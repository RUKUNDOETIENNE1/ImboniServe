import { prisma } from '@/lib/prisma'

interface RiskFactor {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  score: number
}

interface FraudCheckResult {
  allowed: boolean
  riskScore: number
  riskFactors: RiskFactor[]
  action: 'ALLOWED' | 'FLAGGED' | 'BLOCKED'
}

export class FraudDetectionService {
  // Risk score thresholds
  private static readonly BLOCK_THRESHOLD = 0.8
  private static readonly FLAG_THRESHOLD = 0.5

  /**
   * Check if a referral click is suspicious
   */
  static async checkReferralClick(params: {
    referralLinkId: string
    ipAddress?: string
    deviceId?: string
    userAgent?: string
  }): Promise<FraudCheckResult> {
    const riskFactors: RiskFactor[] = []

    // Check 1: IP address abuse (max 5 clicks per IP per day)
    if (params.ipAddress) {
      const recentClicksFromIP = await prisma.referralClick.count({
        where: {
          referralLinkId: params.referralLinkId,
          ipAddress: params.ipAddress,
          clickedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (recentClicksFromIP >= 5) {
        riskFactors.push({
          type: 'IP_ABUSE',
          severity: 'HIGH',
          description: `${recentClicksFromIP} clicks from same IP in 24h`,
          score: 0.4
        })
      } else if (recentClicksFromIP >= 3) {
        riskFactors.push({
          type: 'IP_SUSPICIOUS',
          severity: 'MEDIUM',
          description: `${recentClicksFromIP} clicks from same IP in 24h`,
          score: 0.2
        })
      }
    }

    // Check 2: Device ID abuse (max 3 clicks per device per day)
    if (params.deviceId) {
      const recentClicksFromDevice = await prisma.referralClick.count({
        where: {
          referralLinkId: params.referralLinkId,
          deviceId: params.deviceId,
          clickedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      if (recentClicksFromDevice >= 3) {
        riskFactors.push({
          type: 'DEVICE_ABUSE',
          severity: 'CRITICAL',
          description: `${recentClicksFromDevice} clicks from same device in 24h`,
          score: 0.6
        })
      }
    }

    // Check 3: Suspicious user agent (bots, scrapers)
    if (params.userAgent) {
      const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget']
      const isSuspicious = botPatterns.some(pattern => 
        params.userAgent!.toLowerCase().includes(pattern)
      )

      if (isSuspicious) {
        riskFactors.push({
          type: 'BOT_DETECTED',
          severity: 'HIGH',
          description: 'Suspicious user agent detected',
          score: 0.5
        })
      }
    }

    return this.calculateRiskAndAction('REFERRAL_CLICK', riskFactors)
  }

  /**
   * Check if a signup is suspicious
   */
  static async checkSignup(params: {
    phone: string
    ipAddress?: string
    deviceId?: string
    referralLinkId?: string
  }): Promise<FraudCheckResult> {
    const riskFactors: RiskFactor[] = []

    // Check 1: Multiple signups from same IP (max 3 per day)
    if (params.ipAddress) {
      const signupsFromIP = await prisma.fraudDetectionLog.count({
        where: {
          entityType: 'SIGNUP',
          ipAddress: params.ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      if (signupsFromIP >= 3) {
        riskFactors.push({
          type: 'IP_SIGNUP_ABUSE',
          severity: 'CRITICAL',
          description: `${signupsFromIP} signups from same IP in 24h`,
          score: 0.7
        })
      }
    }

    // Check 2: Phone number already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone: params.phone }
    })

    if (existingCustomer) {
      riskFactors.push({
        type: 'DUPLICATE_PHONE',
        severity: 'HIGH',
        description: 'Phone number already registered',
        score: 0.6
      })
    }

    // Check 3: Rapid signups from same device
    if (params.deviceId) {
      const signupsFromDevice = await prisma.fraudDetectionLog.count({
        where: {
          entityType: 'SIGNUP',
          deviceId: params.deviceId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      if (signupsFromDevice >= 2) {
        riskFactors.push({
          type: 'DEVICE_SIGNUP_ABUSE',
          severity: 'HIGH',
          description: `${signupsFromDevice} signups from same device in 1h`,
          score: 0.5
        })
      }
    }

    return this.calculateRiskAndAction('SIGNUP', riskFactors)
  }

  /**
   * Check if an order is suspicious (for commission fraud)
   */
  static async checkOrder(params: {
    customerId: string
    totalCents: number
    ipAddress?: string
    referralLinkId?: string
  }): Promise<FraudCheckResult> {
    const riskFactors: RiskFactor[] = []

    // Check 1: Minimum order value (prevent tiny orders for commission farming)
    const MIN_ORDER_VALUE = 500000 // 5,000 RWF
    if (params.totalCents < MIN_ORDER_VALUE) {
      riskFactors.push({
        type: 'LOW_ORDER_VALUE',
        severity: 'MEDIUM',
        description: `Order below minimum threshold (${params.totalCents / 100} RWF)`,
        score: 0.3
      })
    }

    // Check 2: Rapid orders from same customer (max 5 per day)
    const recentOrders = await prisma.sale.count({
      where: {
        customerId: params.customerId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    if (recentOrders >= 5) {
      riskFactors.push({
        type: 'ORDER_FREQUENCY_ABUSE',
        severity: 'HIGH',
        description: `${recentOrders} orders in 24h`,
        score: 0.5
      })
    }

    // Check 3: Self-referral detection (if referred customer orders immediately)
    if (params.referralLinkId) {
      const referralClick = await prisma.referralClick.findFirst({
        where: {
          referralLinkId: params.referralLinkId,
          customerId: params.customerId,
          convertedAt: {
            not: null
          }
        },
        orderBy: { convertedAt: 'desc' }
      })

      if (referralClick) {
        const timeSinceConversion = Date.now() - referralClick.convertedAt!.getTime()
        const minutesSinceConversion = timeSinceConversion / (1000 * 60)

        // Suspicious if order placed within 5 minutes of signup
        if (minutesSinceConversion < 5) {
          riskFactors.push({
            type: 'RAPID_CONVERSION',
            severity: 'MEDIUM',
            description: `Order placed ${Math.round(minutesSinceConversion)} minutes after signup`,
            score: 0.3
          })
        }
      }

      // Check if referrer and referee have same IP
      if (params.ipAddress) {
        const referralLink = await prisma.referralLink.findUnique({
          where: { id: params.referralLinkId },
          include: {
            clicks: {
              where: { ipAddress: params.ipAddress },
              take: 1
            }
          }
        })

        if (referralLink && referralLink.clicks.length > 0) {
          riskFactors.push({
            type: 'SAME_IP_REFERRAL',
            severity: 'CRITICAL',
            description: 'Referrer and referee share same IP',
            score: 0.8
          })
        }
      }
    }

    return this.calculateRiskAndAction('ORDER', riskFactors)
  }

  /**
   * Calculate overall risk score and determine action
   */
  private static calculateRiskAndAction(
    entityType: string,
    riskFactors: RiskFactor[]
  ): FraudCheckResult {
    // Calculate total risk score (max 1.0)
    const riskScore = Math.min(
      1.0,
      riskFactors.reduce((sum, factor) => sum + factor.score, 0)
    )

    // Determine action based on thresholds
    let action: 'ALLOWED' | 'FLAGGED' | 'BLOCKED'
    if (riskScore >= this.BLOCK_THRESHOLD) {
      action = 'BLOCKED'
    } else if (riskScore >= this.FLAG_THRESHOLD) {
      action = 'FLAGGED'
    } else {
      action = 'ALLOWED'
    }

    return {
      allowed: action !== 'BLOCKED',
      riskScore,
      riskFactors,
      action
    }
  }

  /**
   * Log fraud detection result
   */
  static async logDetection(params: {
    entityType: string
    entityId: string
    result: FraudCheckResult
    ipAddress?: string
    deviceId?: string
    metadata?: any
  }): Promise<void> {
    try {
      await prisma.fraudDetectionLog.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          riskScore: params.result.riskScore,
          riskFactors: params.result.riskFactors,
          action: params.result.action,
          ipAddress: params.ipAddress,
          deviceId: params.deviceId,
          metadata: params.metadata
        }
      })
    } catch (error) {
      console.error('Failed to log fraud detection:', error)
      // Don't throw - logging failure shouldn't block the operation
    }
  }

  /**
   * Get fraud statistics for monitoring
   */
  static async getStats(days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [total, blocked, flagged, allowed] = await Promise.all([
      prisma.fraudDetectionLog.count({ where: { createdAt: { gte: since } } }),
      prisma.fraudDetectionLog.count({ where: { action: 'BLOCKED', createdAt: { gte: since } } }),
      prisma.fraudDetectionLog.count({ where: { action: 'FLAGGED', createdAt: { gte: since } } }),
      prisma.fraudDetectionLog.count({ where: { action: 'ALLOWED', createdAt: { gte: since } } })
    ])

    return {
      total,
      blocked,
      flagged,
      allowed,
      blockRate: total > 0 ? (blocked / total) * 100 : 0,
      flagRate: total > 0 ? (flagged / total) * 100 : 0
    }
  }
}
