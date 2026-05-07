/**
 * Custom Domain Service
 * Manages custom domain verification and SSL provisioning
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const log = logger.child({ service: 'custom-domain' })

const BLOCKED_TLDS = ['.tk', '.ml']

export class CustomDomainService {
  /**
   * Request custom domain connection
   */
  static async requestDomain(businessId: string, hostname: string) {
    // Validate hostname
    if (!this.isValidHostname(hostname)) {
      throw new Error('Invalid hostname format')
    }

    // Check for blocked TLDs
    if (this.isBlockedTLD(hostname)) {
      throw new Error('This domain extension (.tk, .ml) is not supported')
    }

    // Check if domain already exists
    const existing = await prisma.customDomain.findUnique({
      where: { hostname }
    })

    if (existing) {
      throw new Error('This domain is already registered')
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create domain record
    const domain = await prisma.customDomain.create({
      data: {
        businessId,
        hostname,
        verificationToken,
        status: 'PENDING'
      }
    })

    log.info('Custom domain requested', { businessId, hostname })
    return domain
  }

  /**
   * Get domain status
   */
  static async getDomainStatus(businessId: string, domainId: string) {
    const domain = await prisma.customDomain.findFirst({
      where: {
        id: domainId,
        businessId
      }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    return domain
  }

  /**
   * Verify domain CNAME record
   */
  static async verifyDomain(domainId: string) {
    const domain = await prisma.customDomain.findUnique({
      where: { id: domainId }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    try {
      // In production, this would use DNS lookup to verify CNAME
      // For now, we'll simulate verification
      const isVerified = await this.checkCNAME(domain.hostname, domain.verificationToken)

      if (isVerified) {
        await prisma.customDomain.update({
          where: { id: domainId },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            lastCheckedAt: new Date()
          }
        })

        log.info('Domain verified', { domainId, hostname: domain.hostname })
        return { verified: true, message: 'Domain verified successfully' }
      } else {
        await prisma.customDomain.update({
          where: { id: domainId },
          data: {
            lastCheckedAt: new Date()
          }
        })

        return { verified: false, message: 'CNAME record not found or incorrect' }
      }
    } catch (error) {
      log.error('Domain verification failed', { error: String(error), domainId })
      
      await prisma.customDomain.update({
        where: { id: domainId },
        data: {
          status: 'FAILED',
          lastCheckedAt: new Date()
        }
      })

      throw error
    }
  }

  /**
   * Check CNAME record (placeholder for actual DNS lookup)
   */
  private static async checkCNAME(hostname: string, expectedToken: string): Promise<boolean> {
    // In production, use dns.promises.resolveCname() or external DNS API
    // For now, return false to simulate pending verification
    return false
  }

  /**
   * Get all domains for a business
   */
  static async getBusinessDomains(businessId: string) {
    return prisma.customDomain.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Delete domain
   */
  static async deleteDomain(businessId: string, domainId: string) {
    const domain = await prisma.customDomain.findFirst({
      where: {
        id: domainId,
        businessId
      }
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    await prisma.customDomain.delete({
      where: { id: domainId }
    })

    log.info('Domain deleted', { businessId, domainId, hostname: domain.hostname })
  }

  /**
   * Validate hostname format
   */
  private static isValidHostname(hostname: string): boolean {
    const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
    return hostnameRegex.test(hostname)
  }

  /**
   * Check if TLD is blocked
   */
  private static isBlockedTLD(hostname: string): boolean {
    return BLOCKED_TLDS.some(tld => hostname.toLowerCase().endsWith(tld))
  }

  /**
   * Get CNAME target for verification
   */
  static getCNAMETarget(): string {
    return 'verify.imboni.serve'
  }

  /**
   * Get verification instructions
   */
  static getVerificationInstructions(verificationToken: string) {
    return {
      step1: 'Add a CNAME record in your DNS settings',
      step2: `Point your domain to: ${this.getCNAMETarget()}`,
      step3: `Add a TXT record with value: imboni-verify=${verificationToken}`,
      step4: 'Wait for DNS propagation (up to 24 hours)',
      step5: 'Click "Verify Domain" to check status'
    }
  }
}
