/**
 * Seat QR Code Management Service
 * Handles QR code generation, updates, and checks for seats
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface QRDesign {
  backgroundColor?: string;
  foregroundColor?: string;
  logoUrl?: string;
  style?: 'square' | 'rounded' | 'dots';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface SeatQRCode {
  id: string;
  seatId: string;
  qrCode: string;
  qrDesign?: QRDesign;
  url: string;
}

/**
 * Generate QR code URL for a seat
 */
export function generateSeatQRURL(
  businessId: string,
  tableId: string,
  seatId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imboni.rw';
  return `${baseUrl}/order/table/${tableId}/seat/${seatId}`;
}

/**
 * Generate unique QR code identifier
 */
function generateQRCode(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Check if QR code exists for seat
 */
export async function checkSeatQR(seatId: string): Promise<SeatQRCode | null> {
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    select: {
      id: true,
      qrCode: true,
      qrDesign: true,
      tableId: true,
      table: {
        select: {
          businessId: true
        }
      }
    }
  });

  if (!seat || !seat.qrCode) {
    return null;
  }

  return {
    id: seat.id,
    seatId: seat.id,
    qrCode: seat.qrCode,
    qrDesign: seat.qrDesign as QRDesign | undefined,
    url: generateSeatQRURL(seat.table.businessId, seat.tableId, seat.id)
  };
}

/**
 * Generate new QR code for seat
 */
export async function generateSeatQR(
  seatId: string,
  design?: QRDesign
): Promise<SeatQRCode> {
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    select: {
      id: true,
      tableId: true,
      table: {
        select: {
          businessId: true
        }
      }
    }
  });

  if (!seat) {
    throw new Error('Seat not found');
  }

  const qrCode = generateQRCode();
  const url = generateSeatQRURL(seat.table.businessId, seat.tableId, seat.id);

  await prisma.seat.update({
    where: { id: seatId },
    data: {
      qrCode,
      qrDesign: design as any
    }
  });

  return {
    id: seat.id,
    seatId: seat.id,
    qrCode,
    qrDesign: design,
    url
  };
}

/**
 * Update existing QR code design
 */
export async function updateSeatQRDesign(
  seatId: string,
  design: QRDesign
): Promise<SeatQRCode> {
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    select: {
      id: true,
      qrCode: true,
      tableId: true,
      table: {
        select: {
          businessId: true
        }
      }
    }
  });

  if (!seat) {
    throw new Error('Seat not found');
  }

  if (!seat.qrCode) {
    // Generate QR if it doesn't exist
    return await generateSeatQR(seatId, design);
  }

  await prisma.seat.update({
    where: { id: seatId },
    data: {
      qrDesign: design as any
    }
  });

  return {
    id: seat.id,
    seatId: seat.id,
    qrCode: seat.qrCode,
    qrDesign: design,
    url: generateSeatQRURL(seat.table.businessId, seat.tableId, seat.id)
  };
}

/**
 * Regenerate QR code for seat (creates new code)
 */
export async function regenerateSeatQR(
  seatId: string,
  preserveDesign: boolean = true
): Promise<SeatQRCode> {
  const existingQR = await checkSeatQR(seatId);
  const design = preserveDesign && existingQR ? existingQR.qrDesign : undefined;

  return await generateSeatQR(seatId, design);
}

/**
 * Generate QR codes for all seats in a table
 */
export async function generateTableSeatQRs(
  tableId: string,
  design?: QRDesign
): Promise<SeatQRCode[]> {
  const seats = await prisma.seat.findMany({
    where: { tableId, isActive: true },
    select: { id: true }
  });

  const qrCodes: SeatQRCode[] = [];

  for (const seat of seats) {
    const existingQR = await checkSeatQR(seat.id);
    
    if (!existingQR) {
      const qr = await generateSeatQR(seat.id, design);
      qrCodes.push(qr);
    } else {
      qrCodes.push(existingQR);
    }
  }

  return qrCodes;
}

/**
 * Get QR code data for printing
 */
export async function getSeatQRForPrinting(seatId: string) {
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    include: {
      table: {
        select: {
          number: true,
          business: {
            select: {
              name: true,
              id: true
            }
          }
        }
      }
    }
  });

  if (!seat) {
    throw new Error('Seat not found');
  }

  const qrData = await checkSeatQR(seatId);

  if (!qrData) {
    throw new Error('QR code not found for seat');
  }

  return {
    qrCode: qrData.qrCode,
    qrDesign: qrData.qrDesign,
    url: qrData.url,
    seatLabel: seat.seatLabel || `Seat ${seat.seatNumber}`,
    tableNumber: seat.table.number,
    businessName: seat.table.business.name,
    printData: {
      title: `${seat.table.business.name}`,
      subtitle: `Table ${seat.table.number} - ${seat.seatLabel || `Seat ${seat.seatNumber}`}`,
      instructions: 'Scan to order from your seat',
      qrUrl: qrData.url
    }
  };
}

/**
 * Bulk generate QR codes for all seats in business
 */
export async function generateBusinessSeatQRs(
  businessId: string,
  design?: QRDesign
): Promise<{
  generated: number;
  existing: number;
  total: number;
}> {
  const tables = await prisma.table.findMany({
    where: { businessId },
    select: { id: true }
  });

  let generated = 0;
  let existing = 0;

  for (const table of tables) {
    const qrCodes = await generateTableSeatQRs(table.id, design);
    
    for (const qr of qrCodes) {
      const wasExisting = await prisma.seat.findFirst({
        where: {
          id: qr.seatId,
          qrCode: { not: null }
        }
      });
      
      if (wasExisting) {
        existing++;
      } else {
        generated++;
      }
    }
  }

  return {
    generated,
    existing,
    total: generated + existing
  };
}

/**
 * Validate QR code uniqueness
 */
export async function validateQRUniqueness(qrCode: string): Promise<boolean> {
  const existing = await prisma.seat.findUnique({
    where: { qrCode }
  });

  return !existing;
}
