import type { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signupSchema } from '@/lib/validations/user.schema'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import bcrypt from 'bcryptjs'
import { TrialEligibilityService } from '@/lib/services/trial-eligibility.service'
import { BusinessInviteService } from '@/lib/services/business-invite.service'
import { BusinessApprovalService } from '@/lib/services/business-approval.service'

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
    
    // Read referral cookie for affiliate attribution
    const refCode = req.cookies.im_ref

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

    // Check for affiliate attribution (prevent self-referral)
    let affiliateId: string | undefined
    if (refCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { code: refCode },
        include: { user: true },
      })

      if (affiliate && affiliate.status === 'ACTIVE') {
        // Prevent self-referral: affiliate user cannot refer themselves
        if (affiliate.user && (affiliate.user.email === input.email || affiliate.user.phone === input.phone)) {
          // Silently ignore self-referral attempt
          affiliateId = undefined
        } else {
          affiliateId = affiliate.id
        }
      }
    }

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
    const trialStartDate = shouldAutoApprove && isHospitality ? new Date() : null
    const trialEndDate = shouldAutoApprove && isHospitality 
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
      : null

    const restaurant = await prisma.business.create({
      data: {
        name: input.businessName,
        city: input.city,
        country: 'RW',
        phone: input.phone,
        ownerId: user.id,
        planId: plan.id,
        currency: 'RWF',
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
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { businessId: restaurant.id },
    })

    // Business owner invite attribution (peer-to-peer invite program)
    const inviteCode = (input as any).inviteCode || req.cookies.im_inv
    if (inviteCode) {
      await BusinessInviteService.attributeInvite(inviteCode, restaurant.id)
    }

    // Mark the trial as used for this identity (one-trial-per-email/phone)
    await TrialEligibilityService.markTrialUsed({ email: input.email })

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
