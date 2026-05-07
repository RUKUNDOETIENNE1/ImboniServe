import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission.middleware';
import { resolveBusinessContext } from '@/lib/api/business-context';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import OpenAI from 'openai';
import { buildAIPrompt, parseAIResponse, validateAIResponse, enforceWordLimit, COMMON_CONFIGS } from '@/lib/ai-prompts';
import { generateMenuHash, getCachedScan, setCachedScan } from '@/lib/scan-cache';
import { checkAchievements } from '@/lib/achievements';
import { getTopPriorityActions } from '@/lib/action-priority';
import { checkAICredits, consumeAICredits, AIFeature } from '@/lib/services/ai-credit.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScanResult {
  score: number;
  primary_issue: string;
  critical_issues: string[];
  medium_issues: string[];
  opportunities: string[];
  quick_wins: string[];
  newAchievements?: any[];
  topPriorityActions?: any[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ctx = await resolveBusinessContext(req, res);
  if (!ctx) return;

  const { userId, businessId } = ctx;

  try {
    const { locale = 'en' } = req.body;

    // Phase 2A: Check AI credits before proceeding
    const creditCheck = await checkAICredits(businessId, AIFeature.BUSINESS_SCANNER);
    if (!creditCheck.allowed) {
      return res.status(402).json({ 
        error: 'Insufficient AI credits',
        message: creditCheck.message,
        creditsAvailable: creditCheck.creditsAvailable,
        creditsRequired: creditCheck.creditsRequired,
        resetDate: creditCheck.resetDate,
        upgradeRequired: true
      });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        imageReal: true,
        category: true,
      },
    });

    const total_items = menuItems.length;
    const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
    const categories_count = categories.length;
    const items_with_images = menuItems.filter(item => item.imageReal && item.imageReal.trim() !== '').length;
    const items_without_images = total_items - items_with_images;
    const items_with_descriptions = menuItems.filter(item => item.description && item.description.trim() !== '').length;
    const items_without_descriptions = total_items - items_with_descriptions;

    // Calculate base score
    let baseScore = 100;
    
    // Penalize for too many items (>35 reduces conversion)
    if (total_items > 35) {
      const excessItems = total_items - 35;
      baseScore -= Math.min(excessItems * 2, 30);
    }
    
    // Penalize for missing images (>40% is critical)
    const imageMissingPercent = total_items > 0 ? (items_without_images / total_items) * 100 : 0;
    if (imageMissingPercent > 40) {
      baseScore -= Math.min((imageMissingPercent - 40) * 0.5, 25);
    }
    
    // Penalize for missing descriptions (>40% hurts sales)
    const descMissingPercent = total_items > 0 ? (items_without_descriptions / total_items) * 100 : 0;
    if (descMissingPercent > 40) {
      baseScore -= Math.min((descMissingPercent - 40) * 0.4, 20);
    }
    
    // Penalize for too few categories (lack of structure)
    if (total_items > 10 && categories_count < 3) {
      baseScore -= 15;
    }
    
    const suggestedScore = Math.max(Math.round(baseScore), 0);

    // Check cache before making AI call
    const menuData = {
      total_items,
      categories_count,
      items_with_images,
      items_without_images,
      items_with_descriptions,
      items_without_descriptions,
    };
    const menuHash = generateMenuHash(menuData);
    const cachedResult = getCachedScan(menuHash);
    
    if (cachedResult) {
      console.log('Using cached scan result for menu hash:', menuHash);
      return res.status(200).json(cachedResult);
    }

    // Map locale to language name for AI prompt
    const languageMap: Record<string, string> = {
      'en': 'English',
      'fr': 'French',
      'rw': 'Kinyarwanda'
    };
    const targetLanguage = languageMap[locale] || 'English';

    // Build prompt using modular template system
    const prompt = buildAIPrompt({
      role: 'hospitality business revenue optimization expert with 15+ years of experience',
      task: `Analyze the following menu data and identify where the business is losing revenue. IMPORTANT: Generate all your analysis and recommendations in ${targetLanguage}.`,
      data: {
        'Total menu items': total_items,
        'Categories': categories_count,
        'Items with images': items_with_images,
        'Items without images': items_without_images,
        'Items with descriptions': items_with_descriptions,
        'Items without descriptions': items_without_descriptions,
      },
      outputFormat: {
        score: 'number (0-100, use suggested score as baseline)',
        primary_issue: 'one highly specific issue using actual numbers',
        critical_issues: ['short bullet points'],
        medium_issues: ['short bullet points'],
        opportunities: ['short bullet points'],
        quick_wins: ['short bullet points'],
      },
      instructions: [
        `Write ALL text in ${targetLanguage}`,
        'Always use actual numbers from the provided data',
        'Identify the SINGLE biggest revenue issue first for primary_issue',
        'Prioritize high-impact problems only',
        'Avoid generic statements like "improve your menu" or "enhance experience"',
        'Focus on how issues affect customer decisions and ordering behavior',
        'Explain the business impact clearly (e.g., "reduces ordering confidence", "increases decision fatigue")',
      ],
      toneRules: COMMON_CONFIGS.toneRules.expert,
      formatRules: [
        ...COMMON_CONFIGS.formatRules.concise,
        'No vague phrases like "optimize menu", "improve quality", "enhance experience"',
      ],
      examples: [
        {
          context: 'primary_issue',
          bad: 'Many items lack images',
          good: `${items_without_images} of ${total_items} menu items lack images — this reduces ordering confidence by 40%`,
        },
        {
          context: 'critical_issues',
          bad: 'Improve menu quality',
          good: `${items_without_images} items missing photos lose you ${Math.round(items_without_images * 0.3)} potential orders daily`,
        },
      ],
      suggestedValue: suggestedScore,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a hospitality business revenue optimization expert with 15+ years of experience. You provide direct, data-driven insights that help businesses increase revenue. Return only valid JSON with no markdown formatting, no code blocks, no extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    });

    const rawResponse = completion.choices[0]?.message?.content || '{}';
    
    // Phase 2A: Consume AI credits after successful call
    const tokensUsed = completion.usage?.total_tokens || 0;
    const estimatedCostUSD = (tokensUsed / 1000000) * 0.60; // gpt-4o-mini cost estimate
    
    await consumeAICredits(businessId, AIFeature.BUSINESS_SCANNER, {
      tokensUsed,
      costUSD: estimatedCostUSD,
      model: 'gpt-4o-mini',
      locale: locale
    });
    
    let scanResult: ScanResult;
    
    try {
      // Use modular parsing function
      scanResult = parseAIResponse<ScanResult>(rawResponse);
      
      // Validate required fields
      validateAIResponse(scanResult, ['score', 'primary_issue', 'critical_issues']);
      
      // Ensure arrays exist
      scanResult.critical_issues = scanResult.critical_issues || [];
      scanResult.medium_issues = scanResult.medium_issues || [];
      scanResult.opportunities = scanResult.opportunities || [];
      scanResult.quick_wins = scanResult.quick_wins || [];
      
      // Enforce 15-word limit per bullet using modular function
      scanResult = enforceWordLimit(scanResult, 15);
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', rawResponse);
      
      // Fallback response with actual data
      scanResult = {
        score: suggestedScore,
        primary_issue: `${items_without_images} of ${total_items} menu items lack images — this reduces customer ordering confidence`,
        critical_issues: [
          `${items_without_images} items missing photos reduce conversions by up to 40%`,
          total_items > 35 ? `Menu has ${total_items} items — too many choices increase decision fatigue` : '',
        ].filter(Boolean),
        medium_issues: [
          items_without_descriptions > 0 ? `${items_without_descriptions} items lack descriptions — customers need details to order confidently` : '',
          categories_count < 3 && total_items > 10 ? `Only ${categories_count} categories — poor menu structure confuses customers` : '',
        ].filter(Boolean),
        opportunities: [
          'Add professional photos to top 10 selling items first',
          'Write compelling descriptions highlighting unique ingredients and preparation',
        ],
        quick_wins: [
          'Photograph your 5 best-selling items today using a smartphone',
          'Add 2-3 sentence descriptions to items missing them',
          total_items > 35 ? 'Remove slow-moving items to streamline menu' : 'Group similar items into clear categories',
        ].filter(Boolean),
      };
    }

    // Check for newly unlocked achievements
    const scanCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count FROM business_scans WHERE user_id = ${userId}
    `;
    const totalScans = Number(scanCount[0]?.count || 0) + 1;

    const previousScans = await prisma.$queryRaw<Array<{ score: number }>>`
      SELECT score FROM business_scans 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const bestScore = previousScans.length > 0 ? previousScans[0].score : 0;

    const newAchievements = checkAchievements({
      score: scanResult.score,
      total_items,
      items_with_images,
      items_with_descriptions,
      scanCount: totalScans,
      bestScore,
    });

    // Calculate top priority actions
    const topPriorityActions = getTopPriorityActions(
      {
        critical: scanResult.critical_issues,
        medium: scanResult.medium_issues,
        opportunities: scanResult.opportunities,
        quick_wins: scanResult.quick_wins,
      },
      {
        total_items,
        items_without_images,
        items_without_descriptions,
      },
      5
    );

    // Add to result
    scanResult.newAchievements = newAchievements;
    scanResult.topPriorityActions = topPriorityActions;

    // Cache the result for future requests
    setCachedScan(menuHash, scanResult);
    
    // Save to database
    try {
      await prisma.$executeRaw`
        INSERT INTO business_scans (user_id, score, primary_issue, critical_issues, medium_issues, opportunities, quick_wins, raw_ai_response)
        VALUES (${userId}, ${scanResult.score}, ${scanResult.primary_issue}, ${JSON.stringify(scanResult.critical_issues)}::jsonb, ${JSON.stringify(scanResult.medium_issues)}::jsonb, ${JSON.stringify(scanResult.opportunities)}::jsonb, ${JSON.stringify(scanResult.quick_wins)}::jsonb, ${rawResponse})
      `;
    } catch (dbError) {
      console.error('Failed to save scan to database:', dbError);
      // Continue anyway - user still gets the result
    }

    // Create optimization recommendations from scan results
    try {
      const { batchCreateFromAI } = await import('@/lib/services/optimization-memory.service');
      
      const recommendations = [];
      
      // Critical issues -> HIGH priority
      if (scanResult.critical_issues && scanResult.critical_issues.length > 0) {
        recommendations.push(...scanResult.critical_issues.map((issue: string) => ({
          category: 'MENU' as const,
          title: 'Critical Issue',
          description: issue,
          priority: 'HIGH' as const,
          estimatedImpact: 'High revenue impact'
        })));
      }
      
      // Quick wins -> HIGH priority (easy + impactful)
      if (scanResult.quick_wins && scanResult.quick_wins.length > 0) {
        recommendations.push(...scanResult.quick_wins.map((win: string) => ({
          category: 'MENU' as const,
          title: 'Quick Win',
          description: win,
          priority: 'HIGH' as const,
          effort: 'LOW' as const,
          estimatedImpact: 'Fast improvement'
        })));
      }
      
      // Opportunities -> MEDIUM priority
      if (scanResult.opportunities && scanResult.opportunities.length > 0) {
        recommendations.push(...scanResult.opportunities.slice(0, 3).map((opp: string) => ({
          category: 'MARKETING' as const,
          title: 'Growth Opportunity',
          description: opp,
          priority: 'MEDIUM' as const
        })));
      }
      
      // Medium issues -> MEDIUM priority
      if (scanResult.medium_issues && scanResult.medium_issues.length > 0) {
        recommendations.push(...scanResult.medium_issues.slice(0, 2).map((issue: string) => ({
          category: 'OPERATIONS' as const,
          title: 'Improvement Area',
          description: issue,
          priority: 'MEDIUM' as const
        })));
      }
      
      if (recommendations.length > 0) {
        await batchCreateFromAI(businessId, 'BUSINESS_SCANNER', recommendations);
      }
    } catch (optError) {
      console.error('Failed to create optimization recommendations:', optError);
      // Continue anyway - scan result is still valid
    }

    return res.status(200).json(scanResult);
  } catch (error) {
    console.error('Business scan error:', error);
    return res.status(500).json({ error: 'Failed to run business scan' });
  }
}

export default withRateLimit(
  requirePermission('settings.read')(handler),
  { maxRequests: 5, windowMs: 60_000 }
)
