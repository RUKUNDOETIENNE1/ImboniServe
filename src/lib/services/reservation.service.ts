/**
 * Reservation Service
 * Handles table reservations, confirmations, and reminders
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'
import { CustomerService } from '@/lib/services/customer.service'
import { normalizePhone } from '@/lib/utils/phone'
import { NotificationService } from '@/lib/services/notification.service'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

const log = logger.child({ service: 'reservation' })

export class ReservationService {
  /**
   * Create a new reservation.
   * Auto-resolves or creates a Customer record from customerPhone.
   * This is the canonical reservation creation entry point.
   */
  static async createReservation(data: {
    businessId: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    reservationDate: Date
    reservationTime: string
    partySize: number
    tableId?: string
    specialRequests?: string
    customerId?: string
  }) {
    // Generate confirmation code
    const confirmationCode = crypto.randomBytes(4).toString('hex').toUpperCase()

    // Combine date and time into reservedAt
    const [hours, minutes] = data.reservationTime.split(':');
    const reservedAt = new Date(data.reservationDate);
    reservedAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Auto-resolve customer from phone if not explicitly provided
    let customerId = data.customerId
    if (!customerId && data.customerPhone) {
      try {
        const normalized = normalizePhone(data.customerPhone)
        const customer = await CustomerService.findOrCreateByPhone(
          normalized,
          data.businessId,
          data.customerName
        )
        customerId = customer.id
      } catch (error) {
        log.error('Failed to resolve customer for reservation', { error: String(error), phone: data.customerPhone })
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        businessId: data.businessId,
        customerId: customerId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        reservedAt,
        partySize: data.partySize,
        tableId: data.tableId,
        specialRequests: data.specialRequests,
        confirmationCode,
        status: 'PENDING'
      },
      include: {
        business: { select: { name: true, phone: true } },
        table: { select: { number: true } }
      }
    })

    log.info('Reservation created', {
      reservationId: reservation.id,
      businessId: data.businessId,
      confirmationCode,
      customerId: customerId || null
    })

    // Send confirmation (WhatsApp/SMS/Email)
    await this.sendConfirmation(reservation)

    return reservation
  }

  /**
   * Get reservations for a business
   */
  static async getBusinessReservations(
    businessId: string,
    filters?: {
      date?: Date
      status?: string
      limit?: number
    }
  ) {
    const where: any = { businessId }

    if (filters?.date) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { timezone: true }
      })
      const { start: startOfDay, end: endOfDay } = getBusinessDayBoundary(
        filters.date,
        business?.timezone
      )

      where.reservationDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (filters?.status) {
      where.status = filters.status
    }

    return prisma.reservation.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        table: { select: { number: true, capacity: true } }
      },
      orderBy: [
        { reservationDate: 'asc' },
        { reservationTime: 'asc' }
      ],
      take: filters?.limit || 100
    })
  }

  /**
   * Get reservation by confirmation code
   */
  static async getByConfirmationCode(confirmationCode: string) {
    return prisma.reservation.findUnique({
      where: { confirmationCode },
      include: {
        business: { select: { name: true, address: true, phone: true } },
        table: { select: { number: true } }
      }
    })
  }

  /**
   * Update reservation status
   */
  static async updateStatus(reservationId: string, status: string) {
    const reservation = await (prisma as any).reservation.update({
      where: { id: reservationId },
      data: { status }
    })

    log.info('Reservation status updated', { reservationId, status })

    return reservation
  }

  /**
   * Update table assignment for a reservation
   */
  static async updateTable(reservationId: string, tableId: string | null) {
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { tableId }
    })

    log.info('Reservation table updated', { reservationId, tableId })

    return reservation
  }

  /**
   * Update deposit status for a reservation
   */
  static async updateDepositStatus(
    reservationId: string,
    depositStatus: string,
    options?: { depositPaidAt?: Date; paymentTransactionId?: string }
  ) {
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        depositStatus,
        depositPaidAt: options?.depositPaidAt || null,
        paymentTransactionId: options?.paymentTransactionId || undefined,
      }
    })

    log.info('Reservation deposit status updated', { reservationId, depositStatus })

    return reservation
  }

  /**
   * Confirm a reservation (mark as CONFIRMED with timestamp)
   * If a table is assigned, automatically sets table status to RESERVED.
   * This prevents double-booking — a confirmed reservation must hold the table.
   */
  static async confirmReservation(reservationId: string) {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, confirmedAt: true, status: true, tableId: true }
    })

    if (!existing) throw new Error('Reservation not found')
    if (existing.status === 'CANCELLED') throw new Error('Reservation is cancelled')
    if (existing.confirmedAt) return existing // idempotent

    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          confirmedAt: new Date(),
          status: 'CONFIRMED'
        }
      })

      // OPS-CRIT-001: Auto-reserve the table when reservation is confirmed
      if (existing.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'RESERVED' }
        })
        log.info('Table auto-reserved', { reservationId, tableId: existing.tableId })
      }

      return updated
    })

    log.info('Reservation confirmed', { reservationId })

    return reservation
  }

  /**
   * Mark a reservation as no-show with deposit forfeiture
   * Releases the reserved table back to AVAILABLE.
   */
  static async markNoShow(reservationId: string, forfeitCents: number, reason: string) {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, tableId: true }
    })

    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'NO_SHOW',
          forfeitCents,
          noShowReason: reason
        }
      })

      // OPS-CRIT-001: Release the table when reservation is no-show
      if (existing?.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'AVAILABLE' }
        })
        log.info('Table released (no-show)', { reservationId, tableId: existing.tableId })
      }

      return updated
    })

    log.info('Reservation marked no-show', { reservationId, forfeitCents, reason })

    return reservation
  }

  /**
   * Complete a reservation (customer showed up)
   * Releases the reserved table back to AVAILABLE.
   */
  static async completeReservation(reservationId: string) {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, tableId: true }
    })

    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      // OPS-CRIT-001: Release the table when reservation is completed
      if (existing?.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'AVAILABLE' }
        })
        log.info('Table released (completed)', { reservationId, tableId: existing.tableId })
      }

      return updated
    })

    log.info('Reservation completed', { reservationId })

    return reservation
  }

  /**
   * Forfeit deposit for a reservation (cron no-show processing)
   * Releases the reserved table back to AVAILABLE.
   */
  static async forfeitDeposit(reservationId: string, forfeitCents: number, reason: string) {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, tableId: true }
    })

    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          depositStatus: 'FORFEITED' as any,
          forfeitCents,
          noShowReason: reason,
          status: 'CANCELLED',
        }
      })

      // OPS-CRIT-001: Release the table when deposit is forfeited (no-show)
      if (existing?.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'AVAILABLE' }
        })
        log.info('Table released (forfeit)', { reservationId, tableId: existing.tableId })
      }

      return updated
    })

    log.info('Reservation deposit forfeited', { reservationId, forfeitCents, reason })

    return reservation
  }

  /**
   * Mark reminder as sent
   */
  static async markReminderSent(reservationId: string) {
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { reminderSentAt: new Date() }
    })

    log.info('Reservation reminder marked sent', { reservationId })

    return reservation
  }

  /**
   * Cancel reservation
   * Releases the reserved table back to AVAILABLE.
   */
  static async cancelReservation(reservationId: string, reason?: string) {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, tableId: true }
    })

    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CANCELLED',
          specialRequests: reason ? `CANCELLED: ${reason}` : 'CANCELLED'
        }
      })

      // OPS-CRIT-001: Release the table when reservation is cancelled
      if (existing?.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'AVAILABLE' }
        })
        log.info('Table released (cancelled)', { reservationId, tableId: existing.tableId })
      }

      return updated
    })

    log.info('Reservation cancelled', { reservationId, reason })

    return reservation
  }

  /**
   * Send confirmation message via NotificationService (WhatsApp)
   */
  private static async sendConfirmation(reservation: any) {
    const message = `✅ Reservation Confirmed!\n\n` +
      `📍 ${reservation.business.name}\n` +
      `📅 ${new Date(reservation.reservationDate).toLocaleDateString()}\n` +
      `🕐 ${reservation.reservationTime}\n` +
      `👥 Party of ${reservation.partySize}\n` +
      `${reservation.table ? `🪑 Table ${reservation.table.number}\n` : ''}` +
      `🔑 Code: ${reservation.confirmationCode}\n\n` +
      `Call ${reservation.business.phone} to modify or cancel.`

    try {
      if (reservation.customerPhone) {
        await NotificationService.sendWhatsApp(reservation.customerPhone, message)
      }
    } catch (error) {
      log.error('Failed to send reservation confirmation', { error: String(error), reservationId: reservation.id })
    }

    log.info('Reservation confirmation sent', {
      reservationId: reservation.id,
      phone: reservation.customerPhone
    })

    return { success: true, message }
  }

  /**
   * Send reminder (24 hours before)
   */
  static async sendReminders() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const { start: tomorrowStart, end: endOfTomorrow } = getBusinessDayBoundary(tomorrow)

    const reservations = await prisma.reservation.findMany({
      where: {
        reservationDate: {
          gte: tomorrowStart,
          lte: endOfTomorrow
        },
        status: 'CONFIRMED',
        reminderSent: false
      },
      include: {
        business: { select: { name: true, phone: true } }
      }
    })

    for (const reservation of reservations) {
      const message = `🔔 Reminder: Your reservation tomorrow\n\n` +
        `📍 ${reservation.business.name}\n` +
        `📅 ${new Date(reservation.reservationDate).toLocaleDateString()}\n` +
        `🕐 ${reservation.reservationTime}\n` +
        `👥 Party of ${reservation.partySize}\n` +
        `🔑 Code: ${reservation.confirmationCode}\n\n` +
        `See you soon!`

      // Send reminder
      log.info('Reminder sent', { reservationId: reservation.id })

      // Mark as sent
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSent: true }
      })
    }

    log.info('Reminders sent', { count: reservations.length })
  }

  /**
   * Get available time slots
   */
  static async getAvailableSlots(businessId: string, date: Date) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true }
    })
    const { start: startOfDay, end: endOfDay } = getBusinessDayBoundary(
      date,
      business?.timezone
    )

    const reservations = await prisma.reservation.findMany({
      where: {
        businessId,
        reservationDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] }
      },
      select: { reservationTime: true, partySize: true }
    })

    // Generate time slots (11:00 - 22:00, every 30 min)
    const slots = []
    for (let hour = 11; hour <= 22; hour++) {
      for (let min of [0, 30]) {
        if (hour === 22 && min === 30) break
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        
        // Check if slot is available (simple logic - can be enhanced)
        const bookedAtTime = reservations.filter(r => r.reservationTime === time)
        const totalPartySize = bookedAtTime.reduce((sum, r) => sum + r.partySize, 0)
        
        // Assume max 50 seats total
        const available = totalPartySize < 50

        slots.push({ time, available, bookedPartySize: totalPartySize })
      }
    }

    return slots
  }
}
