/**
 * Reservation Reminder Service - Phase 1
 * Handles 2-hour reminders with confirmation tracking
 */

import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils/currency';
import { NotificationService } from './notification.service';
import { formatDateTimeRW } from '@/utils/datetimeRW';

export interface ReminderResult {
  sent: boolean;
  reason?: string;
  reminderSentAt?: Date;
}

/**
 * Send 2-hour reminder for reservation with confirmation link
 */
export async function send2HourReminder(reservationId: string): Promise<ReminderResult> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          phone: true,
          currency: true
        }
      },
      customer: {
        select: {
          name: true,
          phone: true
        }
      },
      table: {
        select: {
          number: true
        }
      }
    }
  });

  if (!reservation) {
    return {
      sent: false,
      reason: 'Reservation not found'
    };
  }

  // Check if already reminded
  if (reservation.reminderSentAt) {
    return {
      sent: false,
      reason: 'Reminder already sent'
    };
  }

  // Check if reservation is cancelled
  if (reservation.status === 'CANCELLED') {
    return {
      sent: false,
      reason: 'Reservation cancelled'
    };
  }

  // Check if already confirmed
  if (reservation.confirmedAt) {
    return {
      sent: false,
      reason: 'Already confirmed'
    };
  }

  // Generate confirmation link
  const confirmationLink = generateConfirmationLink(reservationId);

  // Format reservation time
  const reservationTime = new Date(reservation.reservedAt);
  const timeStr = reservationTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const dateStr = reservationTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Format message
  const customerName = reservation.customer?.name || 'Guest';
  const tableName = reservation.table?.number || 'your table';
  const partySize = reservation.partySize;
  const depositAmount = reservation.depositCents / 100;

  const message = `
🍽️ *Reservation Reminder - ${reservation.business.name}*

Hi ${customerName}!

Your reservation is coming up in 2 hours:

📅 ${dateStr}
🕐 ${timeStr}
👥 ${partySize} ${partySize === 1 ? 'person' : 'people'}
🪑 Table: ${tableName}

💰 Deposit paid: ${formatCurrency(depositAmount, reservation.business?.currency || 'RWF')}

⚠️ *Please confirm your reservation:*
👉 ${confirmationLink}

If you don't confirm, your deposit may be forfeited.

Need to cancel? Reply to this message or call ${reservation.business.phone}
  `.trim();

  // Send reminder
  if (reservation.customer?.phone) {
    try {
      await NotificationService.sendWhatsApp(
        reservation.customer.phone,
        message
      );

      // Update reservation with reminder timestamp
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          reminderSentAt: new Date()
        }
      });

      return {
        sent: true,
        reminderSentAt: new Date()
      };
    } catch (error) {
      console.error('Failed to send reservation reminder:', error);
      return {
        sent: false,
        reason: 'SMS send failed'
      };
    }
  }

  return {
    sent: false,
    reason: 'No customer phone number'
  };
}

/**
 * Generate confirmation link for reservation
 */
export function generateConfirmationLink(reservationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imboni.rw';
  return `${baseUrl}/reservation/confirm/${reservationId}`;
}

/**
 * Confirm reservation via link
 */
export async function confirmReservation(reservationId: string): Promise<boolean> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      confirmedAt: true,
      status: true
    }
  });

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  if (reservation.status === 'CANCELLED') {
    throw new Error('Reservation is cancelled');
  }

  if (reservation.confirmedAt) {
    // Already confirmed - idempotent
    return true;
  }

  // Mark as confirmed
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      confirmedAt: new Date(),
      status: 'CONFIRMED'
    }
  });

  return true;
}

/**
 * Check if reservations need reminders (run every 5 minutes via cron)
 * Sends reminders for reservations happening in 2 hours
 */
export async function processReservationReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const twoHoursFiveMinutesFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);

  // Find reservations that need reminders
  // (reservedAt is between 2 hours and 2 hours 5 minutes from now)
  const reservations = await prisma.reservation.findMany({
    where: {
      reservedAt: {
        gte: twoHoursFromNow,
        lte: twoHoursFiveMinutesFromNow
      },
      reminderSentAt: null,
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    select: {
      id: true
    }
  });

  let sent = 0;
  let failed = 0;

  for (const reservation of reservations) {
    const result = await send2HourReminder(reservation.id);
    if (result.sent) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    processed: reservations.length,
    sent,
    failed
  };
}

/**
 * Handle no-show logic
 * Called when reservation time has passed without confirmation
 */
export async function handleNoShow(reservationId: string): Promise<{
  forfeitCents: number;
  reason: string;
}> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      depositCents: true,
      confirmedAt: true,
      reminderSentAt: true,
      status: true
    }
  });

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  if (reservation.status === 'COMPLETED' || reservation.status === 'CANCELLED') {
    return {
      forfeitCents: 0,
      reason: 'Reservation already processed'
    };
  }

  let forfeitCents: number;
  let reason: string;

  if (!reservation.confirmedAt && reservation.reminderSentAt) {
    // Reminder sent but not confirmed = 50% forfeit
    forfeitCents = Math.round(reservation.depositCents * 0.5);
    reason = 'Unconfirmed after reminder - 50% forfeit';
  } else if (reservation.confirmedAt) {
    // Confirmed but no-showed = 100% forfeit
    forfeitCents = reservation.depositCents;
    reason = 'Confirmed but no-showed - 100% forfeit';
  } else {
    // No reminder sent (edge case) = 50% forfeit
    forfeitCents = Math.round(reservation.depositCents * 0.5);
    reason = 'No-show without confirmation - 50% forfeit';
  }

  // Update reservation status
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'NO_SHOW',
      forfeitCents,
      noShowReason: reason
    }
  });

  return {
    forfeitCents,
    reason
  };
}

/**
 * Mark reservation as completed (customer showed up)
 */
export async function completeReservation(reservationId: string): Promise<void> {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });
}
