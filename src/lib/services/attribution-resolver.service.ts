import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'attribution-resolver' })

/**
 * Attribution precedence (highest → lowest):
 *   1. FounderCode      (legacy — Phase 1)
 *   2. PartnershipCode  (PP-001 platform code namespace — supersedes FounderCode)
 *   3. Affiliate
 *   4. ProfessionalMarketer
 *   5. ReferralLink     (customer referral links)
 *   6. CustomerReferral
 *   7. BusinessInvite
 */

export type AttributionSource =
  | 'FOUNDER_CODE'
  | 'PARTNERSHIP_CODE'
  | 'AFFILIATE'
  | 'PROFESSIONAL_MARKETER'
  | 'REFERRAL_LINK'
  | 'CUSTOMER_REFERRAL'
  | 'BUSINESS_INVITE'

export interface AttributionResult {
  source: AttributionSource
  code: string
  entityId: string
  userId?: string
  /** Trial days override (e.g. Founder codes may grant 30 days). */
  trialDaysOverride?: number
}

export interface ResolveOptions {
  /** Signup email — used for self-referral prevention. */
  email?: string
  /** Signup phone — used for self-referral prevention. */
  phone?: string
}

interface NamespaceResolver {
  source: AttributionSource
  resolve(code: string): Promise<AttributionResult | null>
}

class AttributionResolver {
  /**
   * Walk all code namespaces in precedence order and return the first match.
   * Self-referral is prevented: if the resolved entity belongs to the same
   * email or phone as the signup user, that namespace is silently skipped.
   */
  static async resolve(
    code: string,
    options?: ResolveOptions,
  ): Promise<AttributionResult | null> {
    if (!code) return null

    const resolvers = this.getResolvers(options)

    for (const r of resolvers) {
      try {
        const result = await r.resolve(code)
        if (result) {
          log.info('Attribution resolved', {
            source: result.source,
            code: result.code,
            entityId: result.entityId,
          })
          return result
        }
      } catch (err) {
        // Namespace may not exist yet (e.g. FounderCode) — log and continue
        log.warn('Namespace resolver error, skipping', {
          source: r.source,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return null
  }

  /**
   * Resolve attribution from multiple candidate codes (e.g. cookie + form input).
   * The first non-null result wins, preserving the precedence order.
   */
  static async resolveFromCandidates(
    codes: (string | undefined)[],
    options?: ResolveOptions,
  ): Promise<AttributionResult | null> {
    const unique = [...new Set(codes.filter((c): c is string => !!c))]
    for (const code of unique) {
      const result = await this.resolve(code, options)
      if (result) return result
    }
    return null
  }

  private static getResolvers(options?: ResolveOptions): NamespaceResolver[] {
    const email = options?.email
    const phone = options?.phone

    const resolvers: NamespaceResolver[] = []

    // 1. FounderCode — Phase 1A (model now in schema)
    resolvers.push({
      source: 'FOUNDER_CODE',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const fc = await prisma.founderCode.findUnique({
          where: { code },
          include: { partner: true },
        })
        if (!fc || fc.status !== 'ACTIVE') return null
        // Check expiry
        if (fc.expiresAt && fc.expiresAt < new Date()) return null
        // Check max redemptions
        if (fc.maxRedemptions != null && fc.redemptionCount >= fc.maxRedemptions) return null
        if (email || phone) {
          const partner = fc.partner
          if (partner && partner.userId) {
            const user = await prisma.user.findUnique({ where: { id: partner.userId } })
            if (user && (user.email === email || user.phone === phone)) return null
          }
        }
        return {
          source: 'FOUNDER_CODE',
          code: fc.code,
          entityId: fc.id,
          userId: fc.partner?.userId ?? undefined,
          trialDaysOverride: fc.trialDays ?? undefined,
        }
      },
    })

    // 2. PartnershipCode — PP-001 platform code namespace (supersedes FounderCode)
    resolvers.push({
      source: 'PARTNERSHIP_CODE',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const pc = await prisma.partnershipCode.findUnique({
          where: { code },
          include: { partnership: true },
        })
        if (!pc || pc.status !== 'ACTIVE') return null
        if (pc.expiresAt && pc.expiresAt < new Date()) return null
        if (pc.maxRedemptions != null && pc.redemptionCount >= pc.maxRedemptions) return null
        if (email || phone) {
          const partnership = pc.partnership
          if (partnership && partnership.userId) {
            const user = await prisma.user.findUnique({ where: { id: partnership.userId } })
            if (user && (user.email === email || user.phone === phone)) return null
          }
        }
        return {
          source: 'PARTNERSHIP_CODE',
          code: pc.code,
          entityId: pc.id,
          userId: pc.partnership?.userId ?? undefined,
          trialDaysOverride: pc.trialDays > 0 ? pc.trialDays : undefined,
        }
      },
    })

    // 3. Affiliate
    resolvers.push({
      source: 'AFFILIATE',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const affiliate = await prisma.affiliate.findUnique({
          where: { code },
          include: { user: true },
        })
        if (!affiliate || affiliate.status !== 'ACTIVE') return null
        if (affiliate.user && (affiliate.user.email === email || affiliate.user.phone === phone)) {
          return null
        }
        return {
          source: 'AFFILIATE',
          code: affiliate.code,
          entityId: affiliate.id,
          userId: affiliate.userId ?? undefined,
        }
      },
    })

    // 4. ProfessionalMarketer
    resolvers.push({
      source: 'PROFESSIONAL_MARKETER',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const marketer = await prisma.professionalMarketer.findUnique({
          where: { referralCode: code },
        })
        if (!marketer || marketer.status !== 'ACTIVE') return null
        if (email && marketer.email === email) return null
        if (phone && marketer.phone === phone) return null
        return {
          source: 'PROFESSIONAL_MARKETER',
          code: marketer.referralCode,
          entityId: marketer.id,
          userId: marketer.userId ?? undefined,
        }
      },
    })

    // 5. ReferralLink (customer referral links)
    resolvers.push({
      source: 'REFERRAL_LINK',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const link = await prisma.referralLink.findUnique({
          where: { code },
        })
        if (!link) return null
        if (phone && link.clientPhone === phone) return null
        if (email && link.clientEmail === email) return null
        return {
          source: 'REFERRAL_LINK',
          code: link.code,
          entityId: link.id,
        }
      },
    })

    // 6. CustomerReferral
    resolvers.push({
      source: 'CUSTOMER_REFERRAL',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const referral = await prisma.customerReferral.findUnique({
          where: { referralCode: code },
        })
        if (!referral) return null
        if (phone && referral.referrerPhone === phone) return null
        return {
          source: 'CUSTOMER_REFERRAL',
          code: referral.referralCode,
          entityId: referral.id,
        }
      },
    })

    // 7. BusinessInvite
    resolvers.push({
      source: 'BUSINESS_INVITE',
      resolve: async (code: string): Promise<AttributionResult | null> => {
        const invite = await prisma.businessInvite.findUnique({
          where: { code },
        })
        if (!invite) return null
        if (invite.status !== 'PENDING' && invite.status !== 'SIGNED_UP') return null
        return {
          source: 'BUSINESS_INVITE',
          code: invite.code,
          entityId: invite.id,
        }
      },
    })

    return resolvers
  }
}

export { AttributionResolver }
