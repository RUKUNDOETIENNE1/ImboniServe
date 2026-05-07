import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'menu-ai' })

export class MenuAIService {
  static async processDocument(sourceDocumentId: string): Promise<void> {
    const doc = await prisma.menuSourceDocument.findUnique({
      where: { id: sourceDocumentId },
      include: { business: { select: { id: true, name: true } } },
    })
    if (!doc) throw new Error('Document not found')

    await prisma.menuSourceDocument.update({
      where: { id: sourceDocumentId },
      data: { status: 'PROCESSING' },
    })

    try {
      const extractedItems = await this.extractItemsWithLLM(doc.fileUrl, doc.fileType)

      for (const item of extractedItems) {
        await prisma.menuItemCandidate.create({
          data: {
            sourceDocumentId,
            businessId: doc.businessId,
            name: item.name,
            description: item.description,
            category: item.category,
            priceCents: item.priceCents,
            confidence: item.confidence,
            rawData: item.rawData as any,
            status: 'PENDING',
          },
        })
      }

      await prisma.menuSourceDocument.update({
        where: { id: sourceDocumentId },
        data: { status: 'COMPLETED', processedAt: new Date() },
      })

      log.info('Document processed', { sourceDocumentId, itemsFound: extractedItems.length })
    } catch (err) {
      await prisma.menuSourceDocument.update({
        where: { id: sourceDocumentId },
        data: { status: 'FAILED' },
      })
      throw err
    }
  }

  private static async extractItemsWithLLM(fileUrl: string, fileType: string): Promise<Array<{
    name: string; description?: string; category?: string; priceCents?: number
    confidence: number; rawData?: Record<string, unknown>
  }>> {
    if (!process.env.OPENAI_API_KEY) {
      log.warn('OpenAI not configured, returning empty candidates')
      return []
    }

    const prompt = `You are a menu parser. Given a menu document URL: ${fileUrl}
Analyze the content and extract menu items. Return a JSON array of objects with:
- name (string, required)
- description (string, optional)
- category (string, optional, e.g. "Starters", "Mains", "Drinks")
- priceRWF (number, optional, in Rwandan Francs)
- confidence (0.0-1.0, how confident you are in the extraction)

Return ONLY valid JSON array. No markdown, no explanations.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || '[]'
      const parsed = JSON.parse(content)

      return parsed.map((item: any) => ({
        name: item.name,
        description: item.description,
        category: item.category,
        priceCents: item.priceRWF ? Math.round(item.priceRWF * 100) : undefined,
        confidence: item.confidence || 0.7,
        rawData: item,
      }))
    } catch (err) {
      log.error('LLM extraction failed', { error: String(err) })
      return []
    }
  }

  static async publishCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    const candidate = await prisma.menuItemCandidate.findUnique({
      where: { id: candidateId },
    })
    if (!candidate) throw new Error('Candidate not found')
    if (candidate.status !== 'PENDING') throw new Error('Candidate already processed')

    const menuItem = await prisma.menuItem.create({
      data: {
        businessId: candidate.businessId,
        name: candidate.name,
        description: candidate.description,
        category: candidate.category,
        priceCents: candidate.priceCents || 0,
        costCents: 0,
        isAvailable: true,
      },
    })

    await prisma.menuItemCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'PUBLISHED',
        reviewedBy,
        reviewedAt: new Date(),
        publishedItemId: menuItem.id,
      },
    })
  }

  static async rejectCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    await prisma.menuItemCandidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED', reviewedBy, reviewedAt: new Date() },
    })
  }

  static async getCandidates(businessId: string, status = 'PENDING') {
    return prisma.menuItemCandidate.findMany({
      where: { businessId, status },
      include: { sourceDocument: { select: { filename: true, fileType: true } } },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'asc' }],
    })
  }
}
