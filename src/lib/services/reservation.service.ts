/**
 * Reservation Service
 * Handles table reservations, confirmations, and reminders
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const log = logger.child({ service: 'reservation' })

export class ReservationService {
  /**
   * Create a new reservation
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

    const reservation = await prisma.reservation.create({
      data: {
        ...data,
        reservedAt,
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
      confirmationCode 
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
      const startOfDay = new Date(filters.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filters.date)
      endOfDay.setHours(23, 59, 59, 999)

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
   * Cancel reservation
   */
  static async cancelReservation(reservationId: string, reason?: string) {
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { 
        status: 'CANCELLED',
        specialRequests: reason ? `CANCELLED: ${reason}` : 'CANCELLED'
      }
    })

    log.info('Reservation cancelled', { reservationId, reason })

    return reservation
  }

  /**
   * Send confirmation message
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

    // In production, send via WhatsApp/SMS/Email
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
    tomorrow.setHours(0, 0, 0, 0)

    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    const reservations = await prisma.reservation.findMany({
      where: {
        reservationDate: {
          gte: tomorrow,
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
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

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
