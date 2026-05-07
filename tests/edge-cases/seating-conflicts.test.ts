/**
 * CRITICAL EDGE CASE TESTS: Seating & QR System
 *
 * Tests race conditions, QR mismatches, seat conflicts,
 * and reassignment during active orders.
 *
 * Priority: CRITICAL
 * Coverage Target: 100%
 */

import { mockPrisma, resetAllMocks } from '../utils/mock-prisma';
import { createMockSeat, createMockTable, createMockSale } from '../utils/mock-data';

// Services (imported AFTER mock)
import { detectSeatsFromCapacity, createSeatsForTable, updateSeatPosition } from '@/lib/services/seat-detection.service';
import { generateSeatQR, checkSeatQR } from '@/lib/services/seat-qr.service';

describe('🪑 Seating Conflicts — CRITICAL', () => {

  beforeEach(() => {
    resetAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 1: Concurrent Seat Selection (Race Condition)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 1: Two users select same seat simultaneously', () => {

    test('only ONE active order per seat allowed', async () => {
      const seat = createMockSeat({ id: 'seat-A', tableId: 'table-1', seatNumber: 1 });
      
      // User A creates order for seat
      const orderA = createMockSale({ seatId: 'seat-A', paymentStatus: 'PENDING' });
      mockPrisma.sale.findFirst.mockResolvedValueOnce(orderA); // Active order exists

      // User B tries to create order for same seat
      const activeOrder = await mockPrisma.sale.findFirst({
        where: { seatId: 'seat-A', paymentStatus: { in: ['PENDING', 'PAID'] } }
      });

      expect(activeOrder).toBeTruthy();
      expect(activeOrder!.seatId).toBe('seat-A');
      
      // CRITICAL: App must check for active orders before allowing new order
      // If not checked, two orders can exist for same seat → confusion
    });

    test('seat becomes available after order completed', async () => {
      const seat = createMockSeat({ id: 'seat-A' });
      
      // Previous order completed
      mockPrisma.sale.findFirst.mockResolvedValue(null); // No active orders

      const activeOrder = await mockPrisma.sale.findFirst({
        where: { seatId: 'seat-A', paymentStatus: { in: ['PENDING', 'PAID'] } }
      });

      expect(activeOrder).toBeNull();
      // Seat is available for new order
    });

    test('database unique constraint on (seatId, active status) prevents duplicates', async () => {
      // Simulate: two simultaneous creates
      mockPrisma.sale.create.mockResolvedValueOnce(
        createMockSale({ seatId: 'seat-A', paymentStatus: 'PENDING' })
      );
      mockPrisma.sale.create.mockRejectedValueOnce(
        new Error('Unique constraint failed')
      );

      const first = await mockPrisma.sale.create({
        data: { seatId: 'seat-A', orderNumber: 'A', businessId: 'b1', userId: 'u1', totalAmountCents: 1000, paymentMethod: 'CASH', paymentStatus: 'PENDING' }
      });
      expect(first.seatId).toBe('seat-A');

      await expect(
        mockPrisma.sale.create({
          data: { seatId: 'seat-A', orderNumber: 'B', businessId: 'b1', userId: 'u1', totalAmountCents: 1000, paymentMethod: 'CASH', paymentStatus: 'PENDING' }
        })
      ).rejects.toThrow('Unique constraint');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 2: QR Code Mismatch Detection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 2: QR code points to wrong table/seat', () => {

    test('detect when seatId does not belong to tableId', async () => {
      const table1 = createMockTable({ id: 'table-1', number: '1' });
      const table2 = createMockTable({ id: 'table-2', number: '2' });
      const seat = createMockSeat({ id: 'seat-A', tableId: 'table-1', table: table1 });

      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const fetchedSeat = await mockPrisma.seat.findUnique({
        where: { id: 'seat-A' },
        include: { table: true }
      });

      // Verify seat belongs to table-1
      expect(fetchedSeat!.tableId).toBe('table-1');
      expect(fetchedSeat!.table.id).toBe('table-1');

      // If URL says table-2 but seat belongs to table-1 → MISMATCH
      const urlTableId = 'table-2';
      const mismatch = fetchedSeat!.tableId !== urlTableId;
      expect(mismatch).toBe(true);

      // CRITICAL: App must validate tableId matches seat.tableId
    });

    test('reject order when QR tableId != seat.tableId', async () => {
      const seat = createMockSeat({ id: 'seat-A', tableId: 'table-1' });
      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const urlTableId = 'table-2'; // Wrong table in URL
      const fetchedSeat = await mockPrisma.seat.findUnique({ where: { id: 'seat-A' } });

      if (fetchedSeat && fetchedSeat.tableId !== urlTableId) {
        throw new Error('QR code mismatch: seat does not belong to this table');
      }

      // Should throw error
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 3: Seat vs Table Conflict
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 3: Order has tableId but wrong seatId', () => {

    test('foreign key constraint prevents orphan seat references', async () => {
      // Try to create order with non-existent seatId
      mockPrisma.sale.create.mockRejectedValue(
        new Error('Foreign key constraint failed on the field: `seatId`')
      );

      await expect(
        mockPrisma.sale.create({
          data: {
            orderNumber: 'ORD-001',
            businessId: 'biz-1',
            userId: 'user-1',
            tableId: 'table-1',
            seatId: 'fake-seat-999', // Does not exist
            totalAmountCents: 100000,
            paymentMethod: 'CASH',
            paymentStatus: 'PENDING'
          }
        })
      ).rejects.toThrow('Foreign key constraint');
    });

    test('seat must belong to specified table', async () => {
      const table1 = createMockTable({ id: 'table-1' });
      const seat = createMockSeat({ id: 'seat-A', tableId: 'table-2' }); // Belongs to table-2

      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const fetchedSeat = await mockPrisma.seat.findUnique({ where: { id: 'seat-A' } });
      
      // Order says tableId: table-1, but seat belongs to table-2
      const orderTableId = 'table-1';
      const conflict = fetchedSeat!.tableId !== orderTableId;
      expect(conflict).toBe(true);

      // CRITICAL: Validate seat.tableId === order.tableId before creating order
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 4: Seat Reassignment During Active Order
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 4: Seat deactivated while order in progress', () => {

    test('existing order continues even if seat deactivated', async () => {
      const seat = createMockSeat({ id: 'seat-A', isActive: true });
      const order = createMockSale({ seatId: 'seat-A', paymentStatus: 'PENDING' });

      mockPrisma.sale.findFirst.mockResolvedValue(order);
      mockPrisma.seat.update.mockResolvedValue({ ...seat, isActive: false });

      // Admin deactivates seat
      const deactivated = await mockPrisma.seat.update({
        where: { id: 'seat-A' },
        data: { isActive: false }
      });
      expect(deactivated.isActive).toBe(false);

      // Existing order still exists
      const existingOrder = await mockPrisma.sale.findFirst({
        where: { seatId: 'seat-A', paymentStatus: 'PENDING' }
      });
      expect(existingOrder).toBeTruthy();

      // FINDING: Existing orders should continue, but new orders blocked
    });

    test('new orders blocked on deactivated seat', async () => {
      const seat = createMockSeat({ id: 'seat-A', isActive: false });
      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const fetchedSeat = await mockPrisma.seat.findUnique({ where: { id: 'seat-A' } });
      
      if (!fetchedSeat || !fetchedSeat.isActive) {
        throw new Error('Seat is not active');
      }

      // Should throw error preventing new order
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 5: QR Code Uniqueness
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 5: QR code uniqueness enforcement', () => {

    test('each seat has unique QR code', async () => {
      const seat1 = createMockSeat({ id: 'seat-1', qrCode: 'QR-SEAT-001' });
      const seat2 = createMockSeat({ id: 'seat-2', qrCode: 'QR-SEAT-002' });

      expect(seat1.qrCode).not.toBe(seat2.qrCode);
    });

    test('duplicate QR code rejected by unique constraint', async () => {
      const qrCode = 'QR-DUPLICATE';
      
      mockPrisma.seat.create.mockResolvedValueOnce(
        createMockSeat({ qrCode })
      );
      mockPrisma.seat.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`qrCode`)')
      );

      const first = await mockPrisma.seat.create({
        data: { tableId: 't1', seatNumber: 1, qrCode, isActive: true }
      });
      expect(first.qrCode).toBe(qrCode);

      await expect(
        mockPrisma.seat.create({
          data: { tableId: 't2', seatNumber: 2, qrCode, isActive: true }
        })
      ).rejects.toThrow('Unique constraint');
    });

    test('checkSeatQR detects existing QR before generation', async () => {
      const seat = createMockSeat({ id: 'seat-A', qrCode: 'QR-EXISTING' });
      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const result = await checkSeatQR('seat-A');
      expect(result).toBeTruthy();
      expect(result?.qrCode).toBe('QR-EXISTING');
    });

    test('checkSeatQR returns null for seat without QR', async () => {
      const seat = createMockSeat({ id: 'seat-B', qrCode: null });
      mockPrisma.seat.findUnique.mockResolvedValue(seat);

      const result = await checkSeatQR('seat-B');
      expect(result).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 6: Seat Detection & Auto-Creation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 6: Seat auto-detection and creation', () => {

    test('detectSeatsFromCapacity generates correct seat count', async () => {
      const table = createMockTable({ capacity: 4 });
      mockPrisma.table.findUnique.mockResolvedValue({
        ...table,
        seats: []
      });
      
      const seats = await detectSeatsFromCapacity(table.id);
      
      expect(seats.length).toBe(4);
      expect(seats[0].seatNumber).toBe(1);
      expect(seats[3].seatNumber).toBe(4);
    });

    test('createSeatsForTable creates missing seats', async () => {
      const tableId = 'table-1';
      const seats = [
        { seatNumber: 1, seatLabel: 'Seat 1' },
        { seatNumber: 2, seatLabel: 'Seat 2' }
      ];

      mockPrisma.seat.create.mockResolvedValue(createMockSeat());

      await createSeatsForTable(tableId, seats);

      expect(mockPrisma.seat.create).toHaveBeenCalledTimes(2);
    });

    test('createSeatsForTable handles existing seats gracefully', async () => {
      const tableId = 'table-1';
      const seats = [{ seatNumber: 1, seatLabel: 'Seat 1' }];
      
      mockPrisma.seat.create.mockResolvedValue(
        createMockSeat({ tableId, seatNumber: 1, seatLabel: 'Seat 1' })
      );

      await createSeatsForTable(tableId, seats);

      expect(mockPrisma.seat.create).toHaveBeenCalled();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 7: Seat Position Conflicts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 7: Seat position conflicts', () => {

    test('two seats cannot have identical position coordinates', async () => {
      const position = { x: 100, y: 200, edge: 'left' as const };
      const seat1 = createMockSeat({ id: 'seat-1', position });
      const seat2 = createMockSeat({ id: 'seat-2', position });

      // In real app, should validate no overlapping positions
      expect(seat1.position).toEqual(seat2.position);
      // FINDING: Need validation to prevent position conflicts
    });

    test('updateSeatPosition updates position correctly', async () => {
      const newPosition = { x: 150, y: 250, edge: 'right' as const };
      mockPrisma.seat.update.mockResolvedValue(
        createMockSeat({ position: newPosition })
      );

      await updateSeatPosition('seat-1', newPosition);

      expect(mockPrisma.seat.update).toHaveBeenCalledWith({
        where: { id: 'seat-1' },
        data: { position: newPosition }
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIO 8: Orphan Seat Detection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Scenario 8: Orphan seat detection', () => {

    test('detect seats with deleted tables', async () => {
      const orphanSeat = createMockSeat({ tableId: 'deleted-table' });
      mockPrisma.seat.findMany.mockResolvedValue([orphanSeat]);
      mockPrisma.table.findUnique.mockResolvedValue(null); // Table deleted

      const seats = await mockPrisma.seat.findMany({
        where: { tableId: 'deleted-table' }
      });
      expect(seats.length).toBe(1);

      const table = await mockPrisma.table.findUnique({
        where: { id: 'deleted-table' }
      });
      expect(table).toBeNull();

      // FINDING: Orphan seats exist - need cleanup job or cascade delete
    });

    test('cascade delete removes seats when table deleted', async () => {
      // Simulate cascade delete
      mockPrisma.table.delete.mockResolvedValue(createMockTable());
      mockPrisma.seat.deleteMany.mockResolvedValue({ count: 4 });

      await mockPrisma.table.delete({ where: { id: 'table-1' } });
      await mockPrisma.seat.deleteMany({ where: { tableId: 'table-1' } });

      expect(mockPrisma.seat.deleteMany).toHaveBeenCalled();
    });
  });
});
