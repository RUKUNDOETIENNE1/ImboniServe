/**
 * Seat Placement Service
 * Suggests optimal QR code placement for seats
 */

import { prisma } from '@/lib/prisma';

export interface PlacementSuggestion {
  seatId: string;
  seatLabel: string;
  position: {
    x: number;
    y: number;
    edge: 'left' | 'right' | 'top' | 'bottom';
  };
  conflicts: boolean;
  conflictsWith?: string[];
}

export interface PrintableLayout {
  tableNumber: string;
  businessName: string;
  seats: Array<{
    seatLabel: string;
    qrUrl: string;
    position: {
      x: number;
      y: number;
      edge: string;
    };
  }>;
}

/**
 * Suggest optimal QR placement for a seat
 */
export async function suggestQRPlacement(
  seatId: string
): Promise<PlacementSuggestion> {
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    include: {
      table: {
        include: {
          seats: {
            where: { isActive: true },
            select: {
              id: true,
              seatNumber: true,
              seatLabel: true,
              position: true
            }
          }
        }
      }
    }
  });

  if (!seat) {
    throw new Error('Seat not found');
  }

  const totalSeats = seat.table.seats.length;
  const seatIndex = seat.table.seats.findIndex(s => s.id === seatId);
  
  // Calculate position based on seat index
  const position = calculateOptimalPosition(seatIndex, totalSeats);
  
  // Check for conflicts
  const conflicts = checkPositionConflicts(
    position,
    seat.table.seats.filter(s => s.id !== seatId && s.position)
  );

  return {
    seatId: seat.id,
    seatLabel: seat.seatLabel || `Seat ${seat.seatNumber}`,
    position,
    conflicts: conflicts.length > 0,
    conflictsWith: conflicts.length > 0 ? conflicts : undefined
  };
}

/**
 * Calculate optimal position for seat based on index
 */
function calculateOptimalPosition(
  seatIndex: number,
  totalSeats: number
): { x: number; y: number; edge: 'left' | 'right' | 'top' | 'bottom' } {
  const seatsPerSide = Math.ceil(totalSeats / 4);
  
  if (seatIndex < seatsPerSide) {
    // Top edge
    return {
      x: ((seatIndex + 1) / (seatsPerSide + 1)) * 100,
      y: 5,
      edge: 'top'
    };
  } else if (seatIndex < seatsPerSide * 2) {
    // Right edge
    const rightIndex = seatIndex - seatsPerSide;
    return {
      x: 95,
      y: ((rightIndex + 1) / (seatsPerSide + 1)) * 100,
      edge: 'right'
    };
  } else if (seatIndex < seatsPerSide * 3) {
    // Bottom edge
    const bottomIndex = seatIndex - seatsPerSide * 2;
    return {
      x: 100 - ((bottomIndex + 1) / (seatsPerSide + 1)) * 100,
      y: 95,
      edge: 'bottom'
    };
  } else {
    // Left edge
    const leftIndex = seatIndex - seatsPerSide * 3;
    return {
      x: 5,
      y: 100 - ((leftIndex + 1) / (seatsPerSide + 1)) * 100,
      edge: 'left'
    };
  }
}

/**
 * Check for position conflicts
 */
function checkPositionConflicts(
  newPosition: { x: number; y: number },
  existingSeats: Array<{
    id: string;
    seatLabel: string | null;
    position: any;
  }>
): string[] {
  const conflicts: string[] = [];
  const minDistance = 10; // Minimum distance percentage

  for (const seat of existingSeats) {
    if (!seat.position) continue;

    const pos = seat.position as { x: number; y: number };
    const distance = Math.sqrt(
      Math.pow(newPosition.x - pos.x, 2) + Math.pow(newPosition.y - pos.y, 2)
    );

    if (distance < minDistance) {
      conflicts.push(seat.seatLabel || seat.id);
    }
  }

  return conflicts;
}

/**
 * Generate printable layout for table
 */
export async function generatePrintableLayout(
  tableId: string
): Promise<PrintableLayout> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      business: {
        select: {
          name: true,
          id: true
        }
      },
      seats: {
        where: { isActive: true },
        orderBy: { seatNumber: 'asc' },
        select: {
          id: true,
          seatNumber: true,
          seatLabel: true,
          qrCode: true,
          position: true
        }
      }
    }
  });

  if (!table) {
    throw new Error('Table not found');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imboni.rw';

  return {
    tableNumber: table.number,
    businessName: table.business.name,
    seats: table.seats.map(seat => ({
      seatLabel: seat.seatLabel || `Seat ${seat.seatNumber}`,
      qrUrl: `${baseUrl}/order/table/${tableId}/seat/${seat.id}`,
      position: seat.position as any || { x: 50, y: 50, edge: 'top' }
    }))
  };
}

/**
 * Optimize all seat positions for a table
 */
export async function optimizeTableSeatPositions(
  tableId: string
): Promise<void> {
  const seats = await prisma.seat.findMany({
    where: { tableId, isActive: true },
    orderBy: { seatNumber: 'asc' },
    select: { id: true }
  });

  const totalSeats = seats.length;

  // Update positions in transaction
  await prisma.$transaction(
    seats.map((seat, index) => {
      const position = calculateOptimalPosition(index, totalSeats);
      return prisma.seat.update({
        where: { id: seat.id },
        data: { position }
      });
    })
  );
}

/**
 * Get placement suggestions for all seats in table
 */
export async function getTablePlacementSuggestions(
  tableId: string
): Promise<PlacementSuggestion[]> {
  const seats = await prisma.seat.findMany({
    where: { tableId, isActive: true },
    orderBy: { seatNumber: 'asc' },
    select: { id: true }
  });

  const suggestions: PlacementSuggestion[] = [];

  for (const seat of seats) {
    const suggestion = await suggestQRPlacement(seat.id);
    suggestions.push(suggestion);
  }

  return suggestions;
}
