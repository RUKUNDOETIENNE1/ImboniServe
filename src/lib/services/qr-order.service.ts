/**
 * QR Order Service
 * Handles QR and remote order creation with server-side pricing and fee calculation
 */

import { prisma } from '@/lib/prisma';
import { OrderSource } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  instructionTags?: string[];
}

export interface OrderPricing {
  subtotalCents: number;
  platformFeeCents: number;
  vatCents: number;
  totalCents: number;
  depositCents: number;
  remainingCents: number;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  taxRate: number;
}

export interface CreateOrderInput {
  branchId: string;
  tableId?: string;
  tableSessionId?: string;
  participantId?: string;
  items: OrderItem[];
  orderSource: OrderSource;
  scheduledAt?: Date;
  customerPhone?: string;
  customerName?: string;
  paymentMethod: 'CASH' | 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER' | 'WEB' | 'DIGITAL' | 'OTHER';
}

/**
 * Calculate order pricing (no customer-facing platform fee)
 * Business commission (5%) is deducted at payout/settlement level
 * Supports INCLUSIVE and EXCLUSIVE tax modes
 */
export async function calculateOrderPricing(
  branchId: string,
  items: OrderItem[],
  paymentMethod: 'CASH' | 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER' | 'WEB' | 'DIGITAL' | 'OTHER',
  isRemote: boolean,
  requireDeposit: boolean,
  depositPercent: number = 50,
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE' = 'EXCLUSIVE',
  taxRate: number = 18.0
): Promise<OrderPricing> {
  // 1. Fetch menu items and calculate subtotal
  const menuItemIds = items.map(item => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      businessId: branchId,
      isAvailable: true
    }
  });
  
  if (menuItems.length !== menuItemIds.length) {
    throw new Error('Some menu items not found or unavailable');
  }
  
  const menuPriceSumCents = items.reduce((sum, item) => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
    return sum + (menuItem.priceCents * item.quantity);
  }, 0);
  
  // 2. No platform fee for customers (business pays 5% commission at payout)
  const platformFeeCents = 0;
  
  // 3. Calculate VAT based on tax mode
  let subtotalCents: number;
  let vatCents: number;
  let totalCents: number;
  
  if (taxMode === 'INCLUSIVE') {
    // Menu prices already include VAT
    // Extract VAT portion: VAT = Total × (rate / (100 + rate))
    totalCents = menuPriceSumCents;
    vatCents = Math.round(totalCents * (taxRate / (100 + taxRate)));
    subtotalCents = totalCents - vatCents;
  } else {
    // EXCLUSIVE: Add VAT on top of menu prices
    subtotalCents = menuPriceSumCents;
    vatCents = Math.round(subtotalCents * (taxRate / 100));
    totalCents = subtotalCents + vatCents;
  }
  
  // 5. Calculate deposit if required
  const depositCents = (isRemote && requireDeposit)
    ? Math.round(totalCents * (depositPercent / 100))
    : 0;
  
  const remainingCents = totalCents - depositCents;
  
  return {
    subtotalCents,
    platformFeeCents,
    vatCents,
    totalCents,
    depositCents,
    remainingCents,
    taxMode,
    taxRate
  };
}

/**
 * Check slot capacity for scheduled orders
 */
export async function checkSlotCapacity(
  branchId: string,
  scheduledAt: Date,
  slotDurationMinutes: number,
  maxOrdersPerSlot: number,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<{ available: boolean; currentCount: number }> {
  const now = new Date();
  const holdCutoff = new Date(now.getTime() - 15 * 60 * 1000);
  const slotStart = new Date(scheduledAt);
  slotStart.setMinutes(Math.floor(slotStart.getMinutes() / slotDurationMinutes) * slotDurationMinutes);
  
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
  
  const currentCount = await db.sale.count({
    where: {
      businessId: branchId,
      orderSource: 'QR_REMOTE',
      scheduledAt: {
        gte: slotStart,
        lt: slotEnd
      },
      OR: [
        { paymentStatus: { in: ['PAID', 'COMPLETED'] } },
        { AND: [{ paymentStatus: 'PENDING' }, { createdAt: { gte: holdCutoff } }] }
      ]
    }
  });
  
  return {
    available: currentCount < maxOrdersPerSlot,
    currentCount
  };
}

/**
 * Create draft order
 */
export async function createDraftOrder(
  input: CreateOrderInput,
  pricing: OrderPricing,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<{ saleId: string; orderNumber: string }> {
  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Get or create customer if phone provided
  let customerId: string | undefined;
  if (input.customerPhone) {
    const customer = await db.customer.upsert({
      where: {
        businessId_phone: {
          businessId: input.branchId,
          phone: input.customerPhone
        }
      },
      create: {
        businessId: input.branchId,
        phone: input.customerPhone,
        name: input.customerName || 'QR Customer'
      },
      update: {
        name: input.customerName || undefined
      }
    });
    customerId = customer.id;
  }
  
  // Get business owner as default user
  const business = await db.business.findUnique({
    where: { id: input.branchId },
    select: { ownerId: true }
  });
  
  if (!business) {
    throw new Error('Business not found');
  }
  
  // Fetch actual menu item prices for correct per-item pricing
  const menuItemIds = input.items.map(i => i.menuItemId);
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: menuItemIds }, businessId: input.branchId },
    select: { id: true, priceCents: true },
  });
  const menuPriceMap = new Map(menuItems.map(mi => [mi.id, mi.priceCents]));

  // Create sale with items
  const sale = await db.sale.create({
    data: {
      orderNumber,
      businessId: input.branchId,
      userId: business.ownerId,
      customerId,
      tableId: input.tableId,
      tableSessionId: input.tableSessionId,
      participantId: input.participantId,
      totalAmountCents: pricing.totalCents,
      paymentMethod: input.paymentMethod === 'DIGITAL' ? 'WEB' : 'CASH',
      paymentStatus: 'PENDING',
      status: 'ACTIVE',
      orderSource: input.orderSource,
      scheduledAt: input.scheduledAt,
      depositCents: pricing.depositCents,
      customerPhone: input.customerPhone,
      customerName: input.customerName,
      items: {
        create: input.items.map(item => {
          const unitPrice = menuPriceMap.get(item.menuItemId) || 0;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPriceCents: unitPrice,
            totalPriceCents: unitPrice * item.quantity,
            instructions: item.notes
              ? { notes: [item.notes], source: input.orderSource }
              : undefined,
            instructionTags: item.instructionTags || []
          };
        })
      }
    }
  });
  
  return {
    saleId: sale.id,
    orderNumber: sale.orderNumber
  };
}

/**
 * Get next available time slots
 */
export async function getAvailableSlots(
  branchId: string,
  startTime: Date,
  slotCount: number = 6
): Promise<Array<{ time: Date; available: boolean; currentCount: number }>> {
  const business = await prisma.business.findUnique({
    where: { id: branchId },
    select: {
      slotDurationMinutes: true,
      maxRemoteOrdersPerSlot: true
    }
  });
  
  if (!business) {
    throw new Error('Business not found');
  }
  
  const slots = [];
  let currentTime = new Date(startTime);
  
  for (let i = 0; i < slotCount; i++) {
    const capacity = await checkSlotCapacity(
      branchId,
      currentTime,
      business.slotDurationMinutes,
      business.maxRemoteOrdersPerSlot
    );
    
    slots.push({
      time: new Date(currentTime),
      available: capacity.available,
      currentCount: capacity.currentCount
    });
    
    currentTime = new Date(currentTime.getTime() + business.slotDurationMinutes * 60000);
  }
  
  return slots;
}
