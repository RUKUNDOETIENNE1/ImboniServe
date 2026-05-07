import QRCode from 'qrcode'
import { logger } from '@/lib/logger'

/**
 * QR Code Generation Service
 * Generates QR codes for referral links, payment requests, etc.
 */
export class QRCodeService {
  /**
   * Generate QR code as Data URL (base64 image)
   */
  static async generateDataURL(
    text: string,
    options?: {
      width?: number
      margin?: number
      color?: { dark?: string; light?: string }
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    }
  ): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        },
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
      }

      const dataURL = await QRCode.toDataURL(text, qrOptions)
      return dataURL
    } catch (error) {
      logger.error('QR code generation failed', { error, text })
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateSVG(
    text: string,
    options?: {
      width?: number
      margin?: number
      color?: { dark?: string; light?: string }
    }
  ): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        },
        type: 'svg' as const
      }

      const svg = await QRCode.toString(text, qrOptions)
      return svg
    } catch (error) {
      logger.error('QR code SVG generation failed', { error, text })
      throw new Error('Failed to generate QR code SVG')
    }
  }

  /**
   * Generate QR code for marketer referral link
   */
  static async generateReferralQR(
    referralCode: string,
    baseUrl: string,
    options?: {
      width?: number
      brandColor?: string
    }
  ): Promise<string> {
    const referralUrl = `${baseUrl}/signup?m=${referralCode}`
    
    return this.generateDataURL(referralUrl, {
      width: options?.width || 400,
      margin: 3,
      color: {
        dark: options?.brandColor || '#1E40AF', // Imboni blue
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for branding
    })
  }

  /**
   * Generate QR code for payment request
   */
  static async generatePaymentQR(
    paymentUrl: string,
    options?: {
      width?: number
    }
  ): Promise<string> {
    return this.generateDataURL(paymentUrl, {
      width: options?.width || 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  }

  /**
   * Generate branded QR code with logo overlay (requires canvas)
   * Note: This is a placeholder - actual implementation would require canvas manipulation
   */
  static async generateBrandedQR(
    text: string,
    logoDataURL: string,
    options?: {
      width?: number
      logoSize?: number
    }
  ): Promise<string> {
    // For now, just generate standard QR
    // TODO: Implement logo overlay using canvas
    logger.warn('Branded QR generation not yet implemented, returning standard QR')
    return this.generateDataURL(text, {
      width: options?.width || 400,
      errorCorrectionLevel: 'H'
    })
  }

  /**
   * Validate QR code content
   */
  static validateQRContent(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'QR content cannot be empty' }
    }

    if (text.length > 2953) {
      return { valid: false, error: 'QR content too long (max 2953 characters)' }
    }

    return { valid: true }
  }

  /**
   * Generate multiple QR codes in batch
   */
  static async generateBatch(
    items: Array<{ id: string; text: string }>,
    options?: {
      width?: number
      format?: 'dataURL' | 'svg'
    }
  ): Promise<Array<{ id: string; qrCode: string; error?: string }>> {
    const results = await Promise.allSettled(
      items.map(async item => {
        const validation = this.validateQRContent(item.text)
        if (!validation.valid) {
          return { id: item.id, qrCode: '', error: validation.error }
        }

        const qrCode = options?.format === 'svg'
          ? await this.generateSVG(item.text, { width: options?.width })
          : await this.generateDataURL(item.text, { width: options?.width })

        return { id: item.id, qrCode }
      })
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          id: items[index].id,
          qrCode: '',
          error: result.reason?.message || 'Failed to generate QR code'
        }
      }
    })
  }
}
