import { prisma } from '@/lib/prisma'
import { TaxType } from '@prisma/client'

export interface TaxCalculation {
  taxType: TaxType
  name: string
  rate: number
  baseAmountCents: number
  taxAmountCents: number
  isInclusive: boolean
}

export interface TaxBreakdown {
  subtotalCents: number
  taxes: TaxCalculation[]
  totalTaxCents: number
  grandTotalCents: number
}

export class TaxService {
  static async getActiveTaxes(businessId: string): Promise<any[]> {
    return await prisma.taxConfiguration.findMany({
      where: { businessId, isActive: true },
      orderBy: { priority: 'asc' }
    })
  }

  static async calculateTaxes(
    businessId: string,
    subtotalCents: number,
    options: { includeTourismLevy?: boolean } = {}
  ): Promise<TaxBreakdown> {
    const taxes = await this.getActiveTaxes(businessId)
    
    if (taxes.length === 0) {
      const defaultVAT = 18.0
      const vatCents = Math.round((subtotalCents * defaultVAT) / (100 + defaultVAT))
      return {
        subtotalCents,
        taxes: [{
          taxType: 'VAT' as TaxType,
          name: 'VAT',
          rate: defaultVAT,
          baseAmountCents: subtotalCents,
          taxAmountCents: vatCents,
          isInclusive: true
        }],
        totalTaxCents: vatCents,
        grandTotalCents: subtotalCents
      }
    }

    const calculations: TaxCalculation[] = []
    let runningTotal = subtotalCents
    let totalTaxCents = 0

    for (const tax of taxes) {
      if (tax.taxType === 'TOURISM_LEVY' && !options.includeTourismLevy) {
        continue
      }

      let taxAmountCents: number
      
      if (tax.isInclusive) {
        taxAmountCents = Math.round((runningTotal * tax.rate) / (100 + tax.rate))
      } else {
        taxAmountCents = Math.round((runningTotal * tax.rate) / 100)
        runningTotal += taxAmountCents
      }

      calculations.push({
        taxType: tax.taxType,
        name: tax.name,
        rate: tax.rate,
        baseAmountCents: runningTotal,
        taxAmountCents,
        isInclusive: tax.isInclusive
      })

      totalTaxCents += taxAmountCents
    }

    return {
      subtotalCents,
      taxes: calculations,
      totalTaxCents,
      grandTotalCents: runningTotal
    }
  }

  static async createDefaultTaxConfig(businessId: string, countryCode: string): Promise<void> {
    const configs: Record<string, Array<{ taxType: TaxType; name: string; rate: number; isInclusive: boolean; priority: number }>> = {
      RW: [
        { taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }
      ],
      KE: [
        { taxType: 'VAT', name: 'VAT', rate: 16.0, isInclusive: true, priority: 1 }
      ],
      UG: [
        { taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }
      ],
      TZ: [
        { taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }
      ],
      ZA: [
        { taxType: 'VAT', name: 'VAT', rate: 15.0, isInclusive: true, priority: 1 }
      ],
      NG: [
        { taxType: 'VAT', name: 'VAT', rate: 7.5, isInclusive: true, priority: 1 }
      ],
      US: [
        { taxType: 'SALES_TAX', name: 'Sales Tax', rate: 8.0, isInclusive: false, priority: 1 }
      ],
      GB: [
        { taxType: 'VAT', name: 'VAT', rate: 20.0, isInclusive: true, priority: 1 }
      ],
      AE: [
        { taxType: 'VAT', name: 'VAT', rate: 5.0, isInclusive: true, priority: 1 }
      ],
    }

    const countryTaxes = configs[countryCode] || configs['RW']

    for (const tax of countryTaxes) {
      await prisma.taxConfiguration.upsert({
        where: {
          businessId_taxType_name: {
            businessId,
            taxType: tax.taxType,
            name: tax.name
          }
        },
        create: {
          businessId,
          ...tax
        },
        update: {}
      })
    }
  }

  static async addServiceCharge(businessId: string, rate: number = 10.0): Promise<void> {
    await prisma.taxConfiguration.create({
      data: {
        businessId,
        taxType: 'SERVICE_CHARGE',
        name: 'Service Charge',
        rate,
        isInclusive: false,
        isActive: true,
        priority: 2
      }
    })
  }

  static async addTourismLevy(businessId: string, rate: number = 1.5): Promise<void> {
    await prisma.taxConfiguration.create({
      data: {
        businessId,
        taxType: 'TOURISM_LEVY',
        name: 'Tourism Development Levy',
        rate,
        isInclusive: false,
        isActive: true,
        priority: 3
      }
    })
  }
}
