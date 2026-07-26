/**
 * ContactCustomerBridge
 *
 * Canonical bridge between Contact (CRM entity) and Customer (hospitality entity).
 * When a Customer is created, a Contact of type CUSTOMER is auto-created (if not existing).
 * When a Contact of type CUSTOMER is created, a Customer is auto-created (if not existing).
 *
 * Architectural Invariant:
 *   Customer identity remains canonical across all hospitality workflows.
 *   The Contact ↔ Customer bridge ensures CRM and hospitality stay in sync.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { normalizePhone } from './guest-recognition.service'

const log = logger.child({ service: 'contact-customer-bridge' })

export class ContactCustomerBridge {
  /**
   * Ensure a Contact exists for a given Customer.
   * Called when a Customer is created or when syncing.
   */
  static async ensureContactForCustomer(customerId: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      log.warn('Customer not found for bridge', { customerId })
      return
    }

    // Check if contact already linked
    if (customer.contactId) {
      const existing = await prisma.contact.findUnique({
        where: { id: customer.contactId },
      })
      if (existing) return
    }

    // Check if a contact with same phone exists in this business
    const existingContact = await prisma.contact.findFirst({
      where: {
        businessId: customer.businessId,
        phone: customer.phone,
        type: 'CUSTOMER',
      },
    })

    if (existingContact) {
      // Link existing contact to customer (Customer owns the FK via contactId)
      await prisma.customer.update({
        where: { id: customerId },
        data: { contactId: existingContact.id },
      })
      log.info('Linked existing contact to customer', { customerId, contactId: existingContact.id })
      return
    }

    // Create new contact
    const contact = await prisma.contact.create({
      data: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        type: 'CUSTOMER',
        businessId: customer.businessId,
        source: 'customer_bridge',
        sourceId: customerId,
      },
    })

    await prisma.customer.update({
      where: { id: customerId },
      data: { contactId: contact.id },
    })

    log.info('Created contact for customer', { customerId, contactId: contact.id })
  }

  /**
   * Ensure a Customer exists for a given Contact of type CUSTOMER.
   * Called when a Contact of type CUSTOMER is created or when syncing.
   */
  static async ensureCustomerForContact(contactId: string): Promise<void> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { customer: true },
    })

    if (!contact || contact.type !== 'CUSTOMER') {
      return
    }

    if (!contact.phone) {
      log.warn('Contact has no phone — cannot bridge to Customer', { contactId })
      return
    }

    // Check if customer already linked via relation
    if (contact.customer) {
      return
    }

    const normalized = normalizePhone(contact.phone)

    // Check if a customer with same phone exists in this business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        businessId: contact.businessId,
        phone: normalized,
      },
    })

    if (existingCustomer) {
      // Link existing customer to contact (Customer owns the FK via contactId)
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { contactId },
      })
      log.info('Linked existing customer to contact', { contactId, customerId: existingCustomer.id })
      return
    }

    // Create new customer with contactId link
    const customer = await prisma.customer.create({
      data: {
        name: contact.name,
        phone: normalized,
        email: contact.email,
        businessId: contact.businessId,
        contactId,
      },
    })

    log.info('Created customer for contact', { contactId, customerId: customer.id })
  }
}
