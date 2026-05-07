import { generateQRSignature } from './qr-token.service'
import QRCode from 'qrcode'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export interface QRCodeOptions {
  branchId: string
  tableId?: string
  seatId?: string
  outletId?: string
  mode?: 'invenue' | 'preorder' | 'pickup'
}

export class QRGeneratorService {
  static generateURL(options: QRCodeOptions): string {
    const { branchId, tableId, seatId, outletId, mode } = options
    const version = '1'
    
    const signature = generateQRSignature(
      branchId,
      tableId || seatId || outletId,
      version
    )

    const params = new URLSearchParams({
      branchId,
      version,
      signature,
      ...(tableId && { tableId }),
      ...(seatId && { seatId }),
      ...(outletId && { outletId }),
      ...(mode && { mode })
    })

    return `${APP_URL}/order?${params.toString()}`
  }

  static async generateQRCodeImage(options: QRCodeOptions): Promise<string> {
    const url = this.generateURL(options)
    
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      return qrDataURL
    } catch (error) {
      console.error('QR code generation failed:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  static async generateQRCodeBuffer(options: QRCodeOptions): Promise<Buffer> {
    const url = this.generateURL(options)
    
    try {
      const buffer = await QRCode.toBuffer(url, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M'
      })
      
      return buffer
    } catch (error) {
      console.error('QR code buffer generation failed:', error)
      throw new Error('Failed to generate QR code buffer')
    }
  }

  static async generateTableQRCodes(businessId: string, tableIds: string[]): Promise<Map<string, string>> {
    const qrCodes = new Map<string, string>()
    
    for (const tableId of tableIds) {
      const url = this.generateURL({ branchId: businessId, tableId, mode: 'invenue' })
      qrCodes.set(tableId, url)
    }
    
    return qrCodes
  }

  static async generateSeatQRCodes(businessId: string, tableId: string, seatCount: number): Promise<Map<number, string>> {
    const qrCodes = new Map<number, string>()
    
    for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
      const url = this.generateURL({ 
        branchId: businessId, 
        tableId,
        mode: 'invenue' 
      })
      qrCodes.set(seatNum, url)
    }
    
    return qrCodes
  }

  static async generateOutletQRCode(businessId: string, outletId: string): Promise<string> {
    return this.generateURL({ 
      branchId: businessId, 
      outletId,
      mode: 'invenue' 
    })
  }
}
