// Bluetooth thermal printer service for Android app
// Supports ESC/POS protocol for common thermal printers
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import { EscPosEncoder } from 'esc-pos-encoder'

export interface PrinterDevice {
  id: string
  name: string
  address: string
}

export interface PrintOptions {
  paperWidth: 58 | 80 // mm
  fontSize: 'small' | 'medium' | 'large'
  align: 'left' | 'center' | 'right'
  bold?: boolean
  underline?: boolean
}

class PrinterService {
  // ESC/POS commands
  private readonly ESC = '\x1B'
  private readonly GS = '\x1D'
  
  // Initialize printer
  private readonly INIT = `${this.ESC}@`
  
  // Text formatting
  private readonly BOLD_ON = `${this.ESC}E1`
  private readonly BOLD_OFF = `${this.ESC}E0`
  private readonly UNDERLINE_ON = `${this.ESC}-1`
  private readonly UNDERLINE_OFF = `${this.ESC}-0`
  
  // Alignment
  private readonly ALIGN_LEFT = `${this.ESC}a0`
  private readonly ALIGN_CENTER = `${this.ESC}a1`
  private readonly ALIGN_RIGHT = `${this.ESC}a2`
  
  // Font size
  private readonly FONT_NORMAL = `${this.GS}!0`
  private readonly FONT_DOUBLE_HEIGHT = `${this.GS}!1`
  private readonly FONT_DOUBLE_WIDTH = `${this.GS}!16`
  private readonly FONT_DOUBLE = `${this.GS}!17`
  
  // Paper cut
  private readonly CUT_PAPER = `${this.GS}V1`
  
  // Line feed
  private readonly LINE_FEED = '\n'

  /**
   * Format slip for thermal printing (58mm or 80mm)
   */
  formatSlipForPrint(slip: any, options: PrintOptions = { paperWidth: 80, fontSize: 'medium', align: 'left' }): string {
    let output = this.INIT
    
    // Header - Restaurant name (centered, bold, large)
    output += this.ALIGN_CENTER + this.BOLD_ON + this.FONT_DOUBLE
    output += slip.restaurantName + this.LINE_FEED
    output += this.BOLD_OFF + this.FONT_NORMAL
    
    if (slip.branch) {
      output += slip.branch + this.LINE_FEED
    }
    
    output += this.LINE_FEED
    
    // Slip info (left aligned)
    output += this.ALIGN_LEFT
    output += `Slip: ${slip.slipNumber}` + this.LINE_FEED
    output += `Date: ${formatDateTimeRW(slip.paymentTime, 'en')}` + this.LINE_FEED
    
    if (slip.tableNumber) {
      output += `Table: ${slip.tableNumber}` + this.LINE_FEED
    }
    
    if (slip.servedBy) {
      output += `Served by: ${slip.servedBy}` + this.LINE_FEED
    }
    
    output += this.LINE_FEED
    output += this.repeatChar('-', options.paperWidth === 80 ? 48 : 32) + this.LINE_FEED
    
    // Line items
    slip.lineItems?.forEach((item: any) => {
      const qty = item.quantity.toString()
      const name = item.itemName
      const total = this.formatCurrency(item.totalCents)
      
      // Format: "2x Item Name          5,000"
      const maxNameWidth = options.paperWidth === 80 ? 30 : 18
      const truncatedName = name.length > maxNameWidth ? name.substring(0, maxNameWidth - 3) + '...' : name
      const padding = options.paperWidth === 80 ? 48 - qty.length - 1 - truncatedName.length - total.length : 32 - qty.length - 1 - truncatedName.length - total.length
      
      output += `${qty}x ${truncatedName}${' '.repeat(Math.max(1, padding))}${total}` + this.LINE_FEED
    })
    
    output += this.repeatChar('-', options.paperWidth === 80 ? 48 : 32) + this.LINE_FEED
    
    // Totals (right aligned)
    output += this.ALIGN_RIGHT
    output += `Subtotal: ${this.formatCurrency(slip.subtotalCents)}` + this.LINE_FEED
    output += `VAT (${slip.vatRate}%): ${this.formatCurrency(slip.vatCents)}` + this.LINE_FEED
    output += this.BOLD_ON + this.FONT_DOUBLE_HEIGHT
    output += `TOTAL: ${this.formatCurrency(slip.grandTotalCents)}` + this.LINE_FEED
    output += this.BOLD_OFF + this.FONT_NORMAL
    
    output += this.LINE_FEED
    
    // Footer - Imboni branding (centered, small)
    output += this.ALIGN_CENTER
    output += this.LINE_FEED
    output += 'Powered by Imboni Serve' + this.LINE_FEED
    output += 'Smart Hospitality Management' + this.LINE_FEED
    
    // QR code placeholder (if printer supports QR)
    if (slip.id) {
      output += this.LINE_FEED
      output += `Scan to view online:` + this.LINE_FEED
      output += `${process.env.NEXT_PUBLIC_APP_URL || 'https://imboni.rw'}/slips/${slip.id}` + this.LINE_FEED
    }
    
    output += this.LINE_FEED + this.LINE_FEED + this.LINE_FEED
    output += this.CUT_PAPER
    
    return output
  }

  /**
   * Print slip via Bluetooth (React Native only)
   */
  async printViaBluetooth(slip: any, deviceAddress: string): Promise<void> {
    // This will be implemented in React Native using react-native-bluetooth-escpos-printer
    // For now, this is a placeholder that shows the structure
    throw new Error('Bluetooth printing only available in mobile app')
  }

  /**
   * Scan for available Bluetooth printers (React Native only)
   */
  async scanForPrinters(): Promise<PrinterDevice[]> {
    // This will be implemented in React Native
    throw new Error('Printer scanning only available in mobile app')
  }

  /**
   * Test print connection
   */
  async testPrint(deviceAddress: string): Promise<boolean> {
    try {
      const testSlip = {
        restaurantName: 'Test Print',
        slipNumber: 'TEST-001',
        paymentTime: new Date(),
        lineItems: [
          { quantity: 1, itemName: 'Test Item', totalCents: 100000 }
        ],
        subtotalCents: 100000,
        vatRate: 18,
        vatCents: 18000,
        grandTotalCents: 118000,
      }
      
      await this.printViaBluetooth(testSlip, deviceAddress)
      return true
    } catch (error) {
      console.error('Test print failed:', error)
      return false
    }
  }

  private formatCurrency(cents: number, currencyCode: string = 'RWF'): string {
    return formatCurrency(cents / 100, currencyCode)
  }

  private repeatChar(char: string, count: number): string {
    return char.repeat(count)
  }
}

export const printerService = new PrinterService()
