/**
 * Operational Validation Seed Script
 * Creates complete test data for operational acceptance validation
 * 
 * Creates:
 * - 4 test businesses (Restaurant, Café, Bar, Hotel)
 * - Stations and routing rules
 * - Test users (owners, managers, waiters, kitchen staff)
 * - Menus with categories
 * - Inventory items
 * - Tables and QR codes
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding operational validation data...')

  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...')
  
  // Find test businesses by name
  const testBusinesses = await prisma.business.findMany({
    where: { name: { in: ['Test Restaurant', 'Test Café', 'Test Bar', 'Test Hotel Restaurant'] } },
    select: { id: true }
  })
  const businessIds = testBusinesses.map(b => b.id)

  if (businessIds.length > 0) {
    await prisma.qrCode.deleteMany({ where: { businessId: { in: businessIds } } })
    await prisma.table.deleteMany({ where: { businessId: { in: businessIds } } })
    await prisma.routeRule.deleteMany({ where: { businessId: { in: businessIds } } })
    await prisma.menuItem.deleteMany({ where: { businessId: { in: businessIds } } })
    await prisma.station.deleteMany({ where: { businessId: { in: businessIds } } })
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } })
  }
  
  await prisma.user.deleteMany({
    where: { email: { in: ['restaurant@test.com', 'cafe@test.com', 'bar@test.com', 'hotel@test.com'] } }
  })

  // ============================================================================
  // SCENARIO 1: RESTAURANT (Multi-station)
  // ============================================================================
  console.log('\n📍 Creating Restaurant...')
  
  const restaurantOwner = await prisma.user.create({
    data: {
      email: 'restaurant@test.com',
      name: 'Restaurant Owner',
      phone: '+250788900001',
      password: await bcrypt.hash('password123', 10),
      roles: ['OWNER'],
      emailVerified: new Date(),
    }
  })

  const restaurant = await prisma.business.create({
    data: {
      name: 'Test Restaurant',
      phone: '+250788900001',
      currency: 'RWF',
      ownerId: restaurantOwner.id,
      isActive: true,
    }
  })

  // Create stations
  const kitchenStation = await prisma.station.create({
    data: {
      businessId: restaurant.id,
      name: 'Kitchen',
      code: 'KITCHEN',
      type: 'KITCHEN',
      isActive: true,
      displayOrder: 1,
    }
  })

  const grillStation = await prisma.station.create({
    data: {
      businessId: restaurant.id,
      name: 'Grill',
      code: 'GRILL',
      type: 'GRILL',
      isActive: true,
      displayOrder: 2,
    }
  })

  const pastryStation = await prisma.station.create({
    data: {
      businessId: restaurant.id,
      name: 'Pastry',
      code: 'PASTRY',
      type: 'PASTRY',
      isActive: true,
      displayOrder: 3,
    }
  })

  // Create menu items with routing
  const burger = await prisma.menuItem.create({
    data: {
      businessId: restaurant.id,
      name: 'Classic Burger',
      category: 'Mains',
      priceCents: 800000, // 8,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: restaurant.id,
      stationId: grillStation.id,
      menuItemId: burger.id,
      priority: 10,
      isActive: true,
    }
  })

  const salad = await prisma.menuItem.create({
    data: {
      businessId: restaurant.id,
      name: 'Caesar Salad',
      category: 'Salads',
      priceCents: 500000, // 5,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: restaurant.id,
      stationId: kitchenStation.id,
      category: 'Salads',
      priority: 5,
      isActive: true,
    }
  })

  const cheesecake = await prisma.menuItem.create({
    data: {
      businessId: restaurant.id,
      name: 'Cheesecake',
      category: 'Desserts',
      priceCents: 400000, // 4,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: restaurant.id,
      stationId: pastryStation.id,
      category: 'Desserts',
      priority: 5,
      isActive: true,
    }
  })

  // Create table and QR code
  const table1 = await prisma.table.create({
    data: {
      businessId: restaurant.id,
      number: '1',
      capacity: 4,
      isActive: true,
    }
  })

  await prisma.qrCode.create({
    data: {
      businessId: restaurant.id,
      tableId: table1.id,
      token: 'restaurant-table-1',
      targetUrl: `/order?branchId=${restaurant.id}&tableId=${table1.id}`,
      isActive: true,
    }
  })

  console.log('✅ Restaurant created with 3 stations, 3 menu items, routing rules')

  // ============================================================================
  // SCENARIO 2: CAFÉ (Coffee Bar + Kitchen)
  // ============================================================================
  console.log('\n☕ Creating Café...')
  
  const cafeOwner = await prisma.user.create({
    data: {
      email: 'cafe@test.com',
      name: 'Café Owner',
      phone: '+250788900002',
      password: await bcrypt.hash('password123', 10),
      roles: ['OWNER'],
      emailVerified: new Date(),
    }
  })

  const cafe = await prisma.business.create({
    data: {
      name: 'Test Café',
      phone: '+250788900002',
      currency: 'RWF',
      ownerId: cafeOwner.id,
      isActive: true,
    }
  })

  const barStation = await prisma.station.create({
    data: {
      businessId: cafe.id,
      name: 'Coffee Bar',
      code: 'BAR',
      type: 'BAR',
      isActive: true,
      displayOrder: 1,
    }
  })

  const cafeKitchen = await prisma.station.create({
    data: {
      businessId: cafe.id,
      name: 'Kitchen',
      code: 'KITCHEN',
      type: 'KITCHEN',
      isActive: true,
      displayOrder: 2,
    }
  })

  const latte = await prisma.menuItem.create({
    data: {
      businessId: cafe.id,
      name: 'Latte',
      category: 'Coffee',
      priceCents: 300000, // 3,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: cafe.id,
      stationId: barStation.id,
      category: 'Coffee',
      priority: 10,
      isActive: true,
    }
  })

  const sandwich = await prisma.menuItem.create({
    data: {
      businessId: cafe.id,
      name: 'Club Sandwich',
      category: 'Food',
      priceCents: 600000, // 6,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: cafe.id,
      stationId: cafeKitchen.id,
      category: 'Food',
      priority: 5,
      isActive: true,
    }
  })

  const cafeTable = await prisma.table.create({
    data: {
      businessId: cafe.id,
      number: '1',
      capacity: 2,
      isActive: true,
    }
  })

  await prisma.qrCode.create({
    data: {
      businessId: cafe.id,
      tableId: cafeTable.id,
      token: 'cafe-table-1',
      targetUrl: `/order?branchId=${cafe.id}&tableId=${cafeTable.id}`,
      isActive: true,
    }
  })

  console.log('✅ Café created with 2 stations, 2 menu items, routing rules')

  // ============================================================================
  // SCENARIO 3: BAR (Drinks + Bar Food)
  // ============================================================================
  console.log('\n🍺 Creating Bar...')
  
  const barOwner = await prisma.user.create({
    data: {
      email: 'bar@test.com',
      name: 'Bar Owner',
      phone: '+250788900003',
      password: await bcrypt.hash('password123', 10),
      roles: ['OWNER'],
      emailVerified: new Date(),
    }
  })

  const bar = await prisma.business.create({
    data: {
      name: 'Test Bar',
      phone: '+250788900003',
      currency: 'RWF',
      ownerId: barOwner.id,
      isActive: true,
    }
  })

  const barDrinks = await prisma.station.create({
    data: {
      businessId: bar.id,
      name: 'Bar',
      code: 'BAR',
      type: 'BAR',
      isActive: true,
      displayOrder: 1,
    }
  })

  const barKitchen = await prisma.station.create({
    data: {
      businessId: bar.id,
      name: 'Kitchen',
      code: 'KITCHEN',
      type: 'KITCHEN',
      isActive: true,
      displayOrder: 2,
    }
  })

  const cocktail = await prisma.menuItem.create({
    data: {
      businessId: bar.id,
      name: 'Mojito',
      category: 'Cocktails',
      priceCents: 700000, // 7,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: bar.id,
      stationId: barDrinks.id,
      category: 'Cocktails',
      priority: 10,
      isActive: true,
    }
  })

  const wings = await prisma.menuItem.create({
    data: {
      businessId: bar.id,
      name: 'Buffalo Wings',
      category: 'Bar Food',
      priceCents: 900000, // 9,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: bar.id,
      stationId: barKitchen.id,
      category: 'Bar Food',
      priority: 5,
      isActive: true,
    }
  })

  const barTable = await prisma.table.create({
    data: {
      businessId: bar.id,
      number: '1',
      capacity: 6,
      isActive: true,
    }
  })

  await prisma.qrCode.create({
    data: {
      businessId: bar.id,
      tableId: barTable.id,
      token: 'bar-table-1',
      targetUrl: `/order?branchId=${bar.id}&tableId=${barTable.id}`,
      isActive: true,
    }
  })

  console.log('✅ Bar created with 2 stations, 2 menu items, routing rules')

  // ============================================================================
  // SCENARIO 4: HOTEL RESTAURANT (Full multi-station)
  // ============================================================================
  console.log('\n🏨 Creating Hotel Restaurant...')
  
  const hotelOwner = await prisma.user.create({
    data: {
      email: 'hotel@test.com',
      name: 'Hotel Manager',
      phone: '+250788900004',
      password: await bcrypt.hash('password123', 10),
      roles: ['OWNER'],
      emailVerified: new Date(),
    }
  })

  const hotel = await prisma.business.create({
    data: {
      name: 'Test Hotel Restaurant',
      phone: '+250788900004',
      currency: 'RWF',
      ownerId: hotelOwner.id,
      isActive: true,
    }
  })

  const hotelKitchen = await prisma.station.create({
    data: {
      businessId: hotel.id,
      name: 'Kitchen',
      code: 'KITCHEN',
      type: 'KITCHEN',
      isActive: true,
      displayOrder: 1,
    }
  })

  const hotelGrill = await prisma.station.create({
    data: {
      businessId: hotel.id,
      name: 'Grill',
      code: 'GRILL',
      type: 'GRILL',
      isActive: true,
      displayOrder: 2,
    }
  })

  const hotelBar = await prisma.station.create({
    data: {
      businessId: hotel.id,
      name: 'Bar',
      code: 'BAR',
      type: 'BAR',
      isActive: true,
      displayOrder: 3,
    }
  })

  const hotelPastry = await prisma.station.create({
    data: {
      businessId: hotel.id,
      name: 'Pastry',
      code: 'PASTRY',
      type: 'PASTRY',
      isActive: true,
      displayOrder: 4,
    }
  })

  const hotelExpo = await prisma.station.create({
    data: {
      businessId: hotel.id,
      name: 'Expo',
      code: 'EXPO',
      type: 'EXPO',
      isActive: true,
      displayOrder: 5,
    }
  })

  // Create diverse menu
  const steak = await prisma.menuItem.create({
    data: {
      businessId: hotel.id,
      name: 'Ribeye Steak',
      category: 'Grilled',
      priceCents: 1500000, // 15,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: hotel.id,
      stationId: hotelGrill.id,
      category: 'Grilled',
      priority: 10,
      isActive: true,
    }
  })

  const pasta = await prisma.menuItem.create({
    data: {
      businessId: hotel.id,
      name: 'Carbonara',
      category: 'Pasta',
      priceCents: 1000000, // 10,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: hotel.id,
      stationId: hotelKitchen.id,
      category: 'Pasta',
      priority: 5,
      isActive: true,
    }
  })

  const wine = await prisma.menuItem.create({
    data: {
      businessId: hotel.id,
      name: 'Red Wine',
      category: 'Beverages',
      priceCents: 1200000, // 12,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: hotel.id,
      stationId: hotelBar.id,
      category: 'Beverages',
      priority: 10,
      isActive: true,
    }
  })

  const tiramisu = await prisma.menuItem.create({
    data: {
      businessId: hotel.id,
      name: 'Tiramisu',
      category: 'Desserts',
      priceCents: 600000, // 6,000 RWF
      isAvailable: true,
    }
  })

  await prisma.routeRule.create({
    data: {
      businessId: hotel.id,
      stationId: hotelPastry.id,
      category: 'Desserts',
      priority: 10,
      isActive: true,
    }
  })

  const hotelTable = await prisma.table.create({
    data: {
      businessId: hotel.id,
      number: 'R101',
      capacity: 2,
      isActive: true,
    }
  })

  await prisma.qrCode.create({
    data: {
      businessId: hotel.id,
      tableId: hotelTable.id,
      token: 'hotel-room-101',
      targetUrl: `/order?branchId=${hotel.id}&tableId=${hotelTable.id}`,
      isActive: true,
    }
  })

  console.log('✅ Hotel created with 5 stations, 4 menu items, routing rules')

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n✅ Operational validation seed complete!')
  console.log('\n📊 Summary:')
  console.log('  - 4 businesses (Restaurant, Café, Bar, Hotel)')
  console.log('  - 12 stations total')
  console.log('  - 11 menu items with routing rules')
  console.log('  - 4 tables with QR codes')
  console.log('\n🔑 Test Accounts:')
  console.log('  - restaurant@test.com / password123')
  console.log('  - cafe@test.com / password123')
  console.log('  - bar@test.com / password123')
  console.log('  - hotel@test.com / password123')
  console.log('\n🔗 QR Tokens:')
  console.log('  - restaurant-table-1')
  console.log('  - cafe-table-1')
  console.log('  - bar-table-1')
  console.log('  - hotel-room-101')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
