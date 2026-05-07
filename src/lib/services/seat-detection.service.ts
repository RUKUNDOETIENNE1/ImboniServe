/**
 * Seat Detection Service
 * Handles auto-detection and manual assignment of seats for tables
 */

import { prisma } from '@/lib/prisma';

export interface SeatPosition {
  x: number;
  y: number;
  edge: 'left' | 'right' | 'top' | 'bottom';
}

export interface SeatDetectionResult {
  seatNumber: number;
  seatLabel: string;
  suggestedPosition?: SeatPosition;
}

/**
 * Auto-detect seats based on table capacity
 * Creates seat labels based on table capacity
 */
export async function detectSeatsFromCapacity(
  tableId: string
): Promise<SeatDetectionResult[]> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: {
      capacity: true,
      seats: {
        select: { seatNumber: true }
      }
    }
  });

  if (!table) {
    throw new Error('Table not found');
  }

  const existingSeatNumbers = table.seats.map(s => s.seatNumber);
  const seats: SeatDetectionResult[] = [];

  // Generate seats based on capacity
  for (let i = 1; i <= table.capacity; i++) {
    if (!existingSeatNumbers.includes(i)) {
      seats.push({
        seatNumber: i,
        seatLabel: `Seat ${String.fromCharCode(64 + i)}`, // A, B, C, etc.
        suggestedPosition: calculateSeatPosition(i, table.capacity)
      });
    }
  }

  return seats;
}

/**
 * Calculate suggested position for seat based on table layout
 * Distributes seats evenly around table edges
 */
function calculateSeatPosition(
  seatNumber: number,
  totalSeats: number
): SeatPosition {
  const seatsPerSide = Math.ceil(totalSeats / 4);
  
  if (seatNumber <= seatsPerSide) {
    // Top edge
    return {
      x: (seatNumber / (seatsPerSide + 1)) * 100,
      y: 0,
      edge: 'top'
    };
  } else if (seatNumber <= seatsPerSide * 2) {
    // Right edge
    return {
      x: 100,
      y: ((seatNumber - seatsPerSide) / (seatsPerSide + 1)) * 100,
      edge: 'right'
    };
  } else if (seatNumber <= seatsPerSide * 3) {
    // Bottom edge
    return {
      x: 100 - ((seatNumber - seatsPerSide * 2) / (seatsPerSide + 1)) * 100,
      y: 100,
      edge: 'bottom'
    };
  } else {
    // Left edge
    return {
      x: 0,
      y: 100 - ((seatNumber - seatsPerSide * 3) / (seatsPerSide + 1)) * 100,
      edge: 'left'
    };
  }
}

/**
 * Create seats for a table
 * Safely creates seats without disrupting existing data
 */
export async function createSeatsForTable(
  tableId: string,
  seats: Array<{
    seatNumber: number;
    seatLabel?: string;
    position?: SeatPosition;
  }>
): Promise<void> {
  // Verify table exists
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { id: true }
  });

  if (!table) {
    throw new Error('Table not found');
  }

  // Create seats in transaction
  await prisma.$transaction(
    seats.map(seat =>
      prisma.seat.upsert({
        where: {
          tableId_seatNumber: {
            tableId,
            seatNumber: seat.seatNumber
          }
        },
        create: {
          tableId,
          seatNumber: seat.seatNumber,
          seatLabel: seat.seatLabel || `Seat ${seat.seatNumber}`,
          position: seat.position as any,
          isActive: true
        },
        update: {
          seatLabel: seat.seatLabel,
          position: seat.position as any,
          isActive: true
        }
      })
    )
  );
}

/**
 * Auto-generate seats for table based on capacity
 */
export async function autoGenerateSeats(tableId: string): Promise<number> {
  const detectedSeats = await detectSeatsFromCapacity(tableId);
  
  if (detectedSeats.length === 0) {
    return 0; // All seats already exist
  }

  await createSeatsForTable(
    tableId,
    detectedSeats.map(s => ({
      seatNumber: s.seatNumber,
      seatLabel: s.seatLabel,
      position: s.suggestedPosition
    }))
  );

  return detectedSeats.length;
}

/**
 * Validate seat capacity against table capacity
 */
export async function validateSeatCapacity(
  tableId: string,
  seatCount: number
): Promise<boolean> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { capacity: true }
  });

  if (!table) {
    return false;
  }

  return seatCount <= table.capacity;
}

/**
 * Get all seats for a table
 */
export async function getTableSeats(tableId: string) {
  return await prisma.seat.findMany({
    where: { tableId },
    orderBy: { seatNumber: 'asc' },
    include: {
      _count: {
        select: {
          sales: true,
          tips: true
        }
      }
    }
  });
}

/**
 * Update seat label
 */
export async function updateSeatLabel(
  seatId: string,
  seatLabel: string
): Promise<void> {
  await prisma.seat.update({
    where: { id: seatId },
    data: { seatLabel }
  });
}

/**
 * Update seat position
 */
export async function updateSeatPosition(
  seatId: string,
  position: SeatPosition
): Promise<void> {
  // Get the seat's table to check for overlaps
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    select: { tableId: true }
  });

  if (!seat) {
    throw new Error('Seat not found');
  }

  // Check for position overlap with other seats at the same table
  const otherSeats = await prisma.seat.findMany({
    where: {
      tableId: seat.tableId,
      id: { not: seatId },
      isActive: true
    },
    select: {
      id: true,
      position: true
    }
  });

  // Check each seat for position overlap
  for (const otherSeat of otherSeats) {
    if (otherSeat.position) {
      const existingPos = otherSeat.position as any;
      // Check if positions are identical (within 5px tolerance)
      if (
        Math.abs(existingPos.x - position.x) < 5 &&
        Math.abs(existingPos.y - position.y) < 5
      ) {
        throw new Error('Position overlaps with another seat. Please choose a different location.');
      }
    }
  }

  await prisma.seat.update({
    where: { id: seatId },
    data: { position: position as any }
  });
}

/**
 * Deactivate seat (soft delete)
 */
export async function deactivateSeat(seatId: string): Promise<void> {
  await prisma.seat.update({
    where: { id: seatId },
    data: { isActive: false }
  });
}

/**
 * Activate seat
 */
export async function activateSeat(seatId: string): Promise<void> {
  await prisma.seat.update({
    where: { id: seatId },
    data: { isActive: true }
  });
}
