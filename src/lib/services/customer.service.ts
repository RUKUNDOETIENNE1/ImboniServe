import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { ContactCustomerBridge } from './contact-customer-bridge.service'

const log = logger.child({ service: 'customer' })

export class CustomerService {
  static async createCustomer(data: {
    name: string
    phone: string
    email?: string
    businessId: string
  }) {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        businessId: data.businessId,
      },
    })

    // Bridge: ensure a CRM Contact exists for this new Customer
    try {
      await ContactCustomerBridge.ensureContactForCustomer(customer.id)
    } catch (error) {
      log.error('Failed to bridge customer to contact', { error: String(error), customerId: customer.id })
    }

    return customer
  }

  static async findByPhone(phone: string, businessId: string) {
    return await prisma.customer.findFirst({
      where: { phone, businessId: businessId },
    })
  }

  /**
   * Find or create a customer by phone number.
   * This is the canonical entry point for customer creation/lookup across all hospitality flows.
   */
  static async findOrCreateByPhone(phone: string, businessId: string, name?: string) {
    const existing = await this.findByPhone(phone, businessId)
    if (existing) return existing

    log.info('Creating new customer', { phone, businessId, name: name || 'Guest' })
    return await this.createCustomer({
      phone,
      businessId,
      name: name || 'Guest',
    })
  }

  /**
   * Update visit stats only (visitCount, lifetimeSpendCents, totalSpent, lastVisit).
   * Does NOT touch loyaltyPoints — that is owned by LoyaltyService.
   */
  static async updateVisitStats(customerId: string, orderAmountCents: number) {
    return await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: { increment: orderAmountCents },
        lifetimeSpendCents: { increment: orderAmountCents },
        visitCount: { increment: 1 },
        lastVisit: new Date(),
      },
    })
  }

  static async getCustomerHistory(customerId: string) {
    return await prisma.sale.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })
  }

}
