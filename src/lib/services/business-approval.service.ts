import { prisma } from '@/lib/prisma'

interface BusinessIdentity {
  businessName: string
  phone: string
  city: string
  latitude?: number | null
  longitude?: number | null
  ownerName: string
  email: string
  deviceFingerprint?: string
  ipRange?: string
}

interface DuplicateMatch {
  type: 'EXACT_NAME_CITY' | 'PHONE_REUSE' | 'LOCATION_PROXIMITY' | 'DEVICE_REUSE' | 'PATTERN_MATCH'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  matchedBusinessId: string
  matchedBusinessName: string
  score: number
}

interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  duplicateMatches: DuplicateMatch[]
  autoApprove: boolean
  reason: string
}

export class BusinessApprovalService {
  private static readonly AUTO_APPROVE_THRESHOLD = parseInt(process.env.AUTO_APPROVE_THRESHOLD || '30', 10)
  private static readonly LOCATION_PROXIMITY_METERS = 100 // 100 meters

  /**
   * Normalize text for comparison
   */
  private static normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Assess risk and detect duplicates for a new business
   */
  static async assessBusinessRisk(identity: BusinessIdentity): Promise<RiskAssessment> {
    const duplicateMatches: DuplicateMatch[] = []
    let riskScore = 0

    const normalizedName = this.normalize(identity.businessName)
    const normalizedCity = this.normalize(identity.city)

    // Check 1: Exact business name + city match
    const exactMatch = await prisma.business.findFirst({
      where: {
        name: {
          equals: identity.businessName,
          mode: 'insensitive',
        },
        city: {
          equals: identity.city,
          mode: 'insensitive',
        },
        isActive: true,
      },
      select: { id: true, name: true, city: true },
    })

    if (exactMatch) {
      duplicateMatches.push({
        type: 'EXACT_NAME_CITY',
        severity: 'HIGH',
        description: `Exact match: ${exactMatch.name} in ${exactMatch.city}`,
        matchedBusinessId: exactMatch.id,
        matchedBusinessName: exactMatch.name,
        score: 50,
      })
      riskScore += 50
    }

    // Check 2: Phone number reuse (different email)
    const phoneMatch = await prisma.business.findFirst({
      where: {
        phone: identity.phone,
        isActive: true,
        owner: {
          email: {
            not: identity.email,
          },
        },
      },
      select: { id: true, name: true, phone: true },
    })

    if (phoneMatch) {
      duplicateMatches.push({
        type: 'PHONE_REUSE',
        severity: 'HIGH',
        description: `Phone ${identity.phone} already used by ${phoneMatch.name}`,
        matchedBusinessId: phoneMatch.id,
        matchedBusinessName: phoneMatch.name,
        score: 40,
      })
      riskScore += 40
    }

    // Check 3: Location proximity (within 100 meters)
    if (identity.latitude && identity.longitude) {
      const nearbyBusinesses = await prisma.business.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
          isActive: true,
        },
        select: { id: true, name: true, latitude: true, longitude: true },
      })

      for (const nearby of nearbyBusinesses) {
        if (nearby.latitude && nearby.longitude) {
          const distance = this.calculateDistance(
            identity.latitude,
            identity.longitude,
            nearby.latitude,
            nearby.longitude
          )

          if (distance <= this.LOCATION_PROXIMITY_METERS) {
            duplicateMatches.push({
              type: 'LOCATION_PROXIMITY',
              severity: 'MEDIUM',
              description: `${Math.round(distance)}m from ${nearby.name}`,
              matchedBusinessId: nearby.id,
              matchedBusinessName: nearby.name,
              score: 25,
            })
            riskScore += 25
            break // Only count closest match
          }
        }
      }
    }

    // Check 4: Device fingerprint reuse (from trial eligibility)
    if (identity.deviceFingerprint) {
      const deviceCount = await prisma.business.count({
        where: {
          owner: {
            devices: {
              some: {
                fingerprint: identity.deviceFingerprint,
              },
            },
          },
          isActive: true,
        },
      })

      if (deviceCount > 0) {
        duplicateMatches.push({
          type: 'DEVICE_REUSE',
          severity: 'MEDIUM',
          description: `Device used for ${deviceCount} other business(es)`,
          matchedBusinessId: 'multiple',
          matchedBusinessName: 'Multiple businesses',
          score: 20,
        })
        riskScore += 20
      }
    }

    // Check 5: Pattern matching (similar name in same area)
    const similarBusinesses = await prisma.business.findMany({
      where: {
        city: {
          equals: identity.city,
          mode: 'insensitive',
        },
        isActive: true,
      },
      select: { id: true, name: true },
    })

    for (const similar of similarBusinesses) {
      const normalizedSimilar = this.normalize(similar.name)
      const similarity = this.calculateStringSimilarity(normalizedName, normalizedSimilar)

      if (similarity > 0.8 && normalizedName !== normalizedSimilar) {
        duplicateMatches.push({
          type: 'PATTERN_MATCH',
          severity: 'LOW',
          description: `Similar name: ${similar.name} (${Math.round(similarity * 100)}% match)`,
          matchedBusinessId: similar.id,
          matchedBusinessName: similar.name,
          score: 15,
        })
        riskScore += 15
        break // Only count most similar
      }
    }

    // Determine risk level and auto-approve decision
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    let autoApprove = false
    let reason = ''

    if (riskScore >= 70) {
      riskLevel = 'HIGH'
      autoApprove = false
      reason = 'High risk: Multiple duplicate indicators detected'
    } else if (riskScore >= 30) {
      riskLevel = 'MEDIUM'
      autoApprove = false
      reason = 'Medium risk: Potential duplicates require manual review'
    } else {
      riskLevel = 'LOW'
      autoApprove = riskScore < this.AUTO_APPROVE_THRESHOLD
      reason = autoApprove
        ? 'Low risk: Auto-approved'
        : 'Low risk: Manual review recommended'
    }

    return {
      riskLevel,
      riskScore,
      duplicateMatches,
      autoApprove,
      reason,
    }
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    return maxLen === 0 ? 1 : 1 - distance / maxLen
  }

  /**
   * Approve a business and start trial
   */
  static async approveBusiness(businessId: string, adminId: string): Promise<void> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { approvalStatus: true, businessType: true },
    })

    if (!business) {
      throw new Error('Business not found')
    }

    if (business.approvalStatus === 'APPROVED') {
      throw new Error('Business already approved')
    }

    const now = new Date()
    const isHospitality = ['RESTAURANT', 'HOTEL', 'CAFE', 'BAR'].includes(
      business.businessType || ''
    )
    const trialEnd = isHospitality
      ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      : null

    await prisma.business.update({
      where: { id: businessId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: adminId,
        approvedAt: now,
        trialStartDate: isHospitality ? now : null,
        trialEndDate: trialEnd,
      },
    })
  }

  /**
   * Reject a business
   */
  static async rejectBusiness(
    businessId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    })
  }

  /**
   * Request more information
   */
  static async requestMoreInfo(
    businessId: string,
    adminId: string,
    message: string
  ): Promise<void> {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        approvalStatus: 'NEEDS_INFO',
        approvedBy: adminId,
        rejectionReason: message,
      },
    })
  }

  /**
   * Get pending businesses for admin review
   */
  static async getPendingBusinesses(filters?: {
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
    limit?: number
    offset?: number
  }) {
    const where: any = {
      approvalStatus: 'PENDING',
    }

    if (filters?.riskLevel) {
      where.riskLevel = filters.riskLevel
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          plan: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: [
          { riskLevel: 'desc' }, // HIGH first
          { createdAt: 'asc' }, // Oldest first
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.business.count({ where }),
    ])

    return { businesses, total }
  }
}
