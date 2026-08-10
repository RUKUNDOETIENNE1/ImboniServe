import type { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signupSchema } from '@/lib/validations/user.schema'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import bcrypt from 'bcryptjs'
import { TrialEligibilityService } from '@/lib/services/trial-eligibility.service'
import { BusinessInviteService } from '@/lib/services/business-invite.service'
import { BusinessApprovalService } from '@/lib/services/business-approval.service'
import { AttributionResolver, type AttributionResult } from '@/lib/services/attribution-resolver.service'
import { AttributionService } from '@/lib/services/attribution.service'
import { TrialPolicyService } from '@/lib/services/trial-policy.service'
import { FounderCodeService } from '@/lib/services/founder-code.service'
import { getCountryDefaults } from '@/lib/utils/country-config'
import { TaxService } from '@/lib/services/tax.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const input = signupSchema.parse(req.body)
    
    const deviceFingerprint = (req.headers['x-device-fingerprint'] as string) || undefined
    const ipAddress = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').toString()
    const captchaToken = (req.headers['x-captcha-token'] as string) || (req.body && (req.body as any).captchaToken) || undefined
    
    // Extract IP range for risk assessment
    const ipRange = ipAddress ? ipAddress.split('.').slice(0, 3).join('.') + '.0/24' : undefined
    
    // Phase 3: Trial anti-fraud eligibility check (no external APIs)
    const evalResult = await TrialEligibilityService.evaluateAndRecord({
      email: input.email,
      phone: input.phone,
      deviceFingerprint,
      ipAddress,
      captchaToken,
    })
    if (!evalResult.allowed) {
      return res.status(403).json({ error: 'Trial eligibility blocked', reason: evalResult.blockedReason, riskScore: evalResult.riskScore })
    }
    
    // Gather all candidate referral codes: canonical cookie, legacy cookie, form field
    const candidateCodes = [
      req.cookies.im_ref,
      req.cookies.referral_code,
      (input as any).referralCode,
    ]

    // Resolve attribution deterministically across all code namespaces.
    // Uses resolveFromCandidates so an invalid cookie code doesn't block
    // a valid manually-entered code — each candidate is tried in turn.
    const attribution: AttributionResult | null = await AttributionResolver.resolveFromCandidates(
      candidateCodes,
      {
        email: input.email,
        phone: input.phone,
      },
    )

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone: input.phone },
    })

    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered' })
    }

    const plan = await prisma.plan.findUnique({
      where: { code: input.planCode },
    })

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    const hashedPassword = await bcrypt.hash(input.password, 12)

    // Derive affiliateId from unified attribution (self-referral already handled by resolver)
    const affiliateId = attribution?.source === 'AFFILIATE' ? attribution.entityId : undefined

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        isActive: true,
      },
    })

    // Determine if business is eligible for trial (hospitality only, not suppliers)
    const businessType = (input as any).businessType || 'RESTAURANT'
    const isHospitality = ['RESTAURANT', 'HOTEL', 'CAFE', 'BAR'].includes(businessType)

    // Assess business risk and determine approval status
    const riskAssessment = await BusinessApprovalService.assessBusinessRisk({
      businessName: input.businessName,
      phone: input.phone,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      ownerName: input.name,
      email: input.email,
      deviceFingerprint,
      ipRange,
    })

    // Trial starts only if auto-approved (low risk) or when manually approved later
    const shouldAutoApprove = riskAssessment.autoApprove && isHospitality
    const approvalStatus = shouldAutoApprove ? 'APPROVED' : 'PENDING'
    const trialDays = TrialPolicyService.getTrialDays({
      source: attribution?.source,
      trialDaysOverride: attribution?.trialDaysOverride,
    })
    const trialStartDate = shouldAutoApprove && isHospitality ? new Date() : null
    const trialEndDate = shouldAutoApprove && isHospitality
      ? TrialPolicyService.computeTrialEndDate(new Date(), trialDays)
      : null

    // Founding Hospitality Business Program — first 100 hospitality businesses
    const FOUNDING_LIMIT = 100
    const foundingCount = await prisma.business.count({
      where: { isFoundingMember: true },
    })
    const isFoundingMember = isHospitality && foundingCount < FOUNDING_LIMIT

    // EGR-016: Geography is configuration, never code.
    // Derive currency, timezone, and tax defaults from the business's country.
    const country = (input as any).country || 'RW'
    const countryDefaults = getCountryDefaults(country)

    const restaurant = await prisma.business.create({
      data: {
        name: input.businessName,
        city: input.city,
        country,
        phone: input.phone,
        ownerId: user.id,
        planId: plan.id,
        currency: countryDefaults.currency,
        timezone: countryDefaults.timezone,
        taxRate: countryDefaults.taxRate,
        taxMode: countryDefaults.taxMode,
        isActive: true,
        referredByAffiliateId: affiliateId,
        businessType,
        trialStartDate,
        trialEndDate,
        latitude: input.latitude,
        longitude: input.longitude,
        approvalStatus,
        approvedAt: shouldAutoApprove ? new Date() : null,
        riskLevel: riskAssessment.riskLevel,
        duplicateFlags: riskAssessment.duplicateMatches.length > 0 
          ? (riskAssessment.duplicateMatches as any) 
          : undefined,
        isFoundingMember,
        foundingJoinedAt: isFoundingMember ? new Date() : null,
      },
    })

    // Initialize country-specific tax configuration (EGR-016)
    try {
      await TaxService.createDefaultTaxConfig(restaurant.id, country)
    } catch (taxConfigError) {
      // Tax config initialization failure should not block signup
      console.error('[Signup] Tax config initialization failed:', taxConfigError)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { businessId: restaurant.id },
    })

    // Persist canonical attribution record (Phase 1A)
    await AttributionService.recordAttribution({
      businessId: restaurant.id,
      attribution,
      ipAddress,
      userAgent: req.headers['user-agent'] || undefined,
    })

    // Founder Code redemption — create redemption record and increment counter
    if (attribution?.source === 'FOUNDER_CODE') {
      try {
        await FounderCodeService.redeemCode({
          codeId: attribution.entityId,
          businessId: restaurant.id,
          userId: user.id,
          ipAddress,
          userAgent: req.headers['user-agent'] || undefined,
        })
      } catch (err) {
        console.error('Founder Code redemption error:', err)
      }
    }

    // Business owner invite attribution (peer-to-peer invite program)
    // Use attribution resolver result if source is BUSINESS_INVITE, otherwise check form/cookie
    if (attribution?.source === 'BUSINESS_INVITE') {
      await BusinessInviteService.attributeInvite(attribution.code, restaurant.id)
    } else {
      const inviteCode = (input as any).inviteCode || req.cookies.im_inv
      if (inviteCode) {
        await BusinessInviteService.attributeInvite(inviteCode, restaurant.id)
      }
    }

    // Mark the trial as used for this identity (one-trial-per-email/phone)
    await TrialEligibilityService.markTrialUsed({ email: input.email })

    // Expire referral cookies post-signup (attribution consumed)
    const expiredCookies = [
      `im_ref=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `referral_code=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    ]
    res.setHeader('Set-Cookie', expiredCookies)

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      isFoundingMember,
      attribution: attribution
        ? { source: attribution.source, code: attribution.code }
        : null,
      trialDays,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Signup failed' 
    })
  }
}

export default withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 signups per IP per 15 minutes
})
