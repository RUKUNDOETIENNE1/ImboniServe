/**
 * Service Replay™ - Simulation Script
 * 
 * Generates realistic restaurant service data for testing the Service Replay feature.
 * Simulates a lunch service with 100+ orders, multiple tables, waiters, and kitchen events.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuration
const CONFIG = {
  // Simulation time range (lunch service: 11:00 - 15:00)
  startHour: 11,
  endHour: 15,
  
  // Restaurant setup
  numTables: 20,
  numWaiters: 5,
  numStations: 3,
  
  // Order configuration
  targetOrders: 120,
  minItemsPerOrder: 1,
  maxItemsPerOrder: 6,
  
  // Timing (in minutes)
  avgPrepTime: 12,
  avgDeliveryTime: 3,
  avgPaymentTime: 5,
  
  // Failure rates
  cancelRate: 0.05, // 5% of orders canceled
  slaBreachRate: 0.08, // 8% of items breach SLA
}

// Sample menu items
const MENU_ITEMS = [
  { name: 'Grilled Chicken', price: 8500, station: 'GRILL' },
  { name: 'Beef Brochettes', price: 12000, station: 'GRILL' },
  { name: 'Tilapia Fish', price: 9500, station: 'GRILL' },
  { name: 'Vegetable Curry', price: 6500, station: 'KITCHEN' },
  { name: 'Rice & Beans', price: 4500, station: 'KITCHEN' },
  { name: 'Chips', price: 3000, station: 'KITCHEN' },
  { name: 'Salad', price: 4000, station: 'KITCHEN' },
  { name: 'Soup of the Day', price: 3500, station: 'KITCHEN' },
  { name: 'Fresh Juice', price: 2500, station: 'BAR' },
  { name: 'Soft Drink', price: 1500, station: 'BAR' },
  { name: 'Beer', price: 2000, station: 'BAR' },
  { name: 'Coffee', price: 1500, station: 'BAR' },
]

// Waiter names
const WAITER_NAMES = ['Alice Uwimana', 'Bob Habimana', 'Claire Mukamana', 'David Niyonzima', 'Eve Ingabire']

// Station names
const STATIONS = [
  { name: 'Main Kitchen', code: 'KITCHEN' },
  { name: 'Grill Station', code: 'GRILL' },
  { name: 'Bar', code: 'BAR' },
]

async function setupSimulation(businessId) {
  console.log('🔧 Setting up simulation environment...')
  
  // Get or create tables
  const existingTables = await prisma.table.findMany({
    where: { businessId },
    take: CONFIG.numTables,
  })
  
  const tables = existingTables.length >= CONFIG.numTables
    ? existingTables.slice(0, CONFIG.numTables)
    : [...existingTables]
  
  if (tables.length < CONFIG.numTables) {
    console.log(`  Creating ${CONFIG.numTables - tables.length} additional tables...`)
    for (let i = tables.length + 1; i <= CONFIG.numTables; i++) {
      const table = await prisma.table.create({
        data: {
          businessId,
          number: `T${i}`,
          capacity: Math.floor(Math.random() * 4) + 2,
          status: 'available',
        },
      })
      tables.push(table)
    }
  }
  
  // Get or create waiters
  const existingWaiters = await prisma.user.findMany({
    where: { businessId },
    take: CONFIG.numWaiters,
  })
  
  const waiters = existingWaiters.slice(0, CONFIG.numWaiters).map((w, i) => ({
    id: w.id,
    name: w.name || WAITER_NAMES[i] || `Waiter ${i + 1}`,
  }))
  
  // Get or create stations
  let stations = await prisma.station.findMany({
    where: { businessId, isActive: true },
  })
  
  if (stations.length < STATIONS.length) {
    console.log(`  Creating ${STATIONS.length - stations.length} stations...`)
    for (const stationDef of STATIONS) {
      const existing = stations.find(s => s.code === stationDef.code)
      if (!existing) {
        const station = await prisma.station.create({
          data: {
            businessId,
            name: stationDef.name,
            code: stationDef.code,
            type: 'KITCHEN',
            isActive: true,
          },
        })
        stations.push(station)
      }
    }
  }
  
  // Get menu items
  const existingMenuItems = await prisma.menuItem.findMany({
    where: { businessId, isAvailable: true },
    take: 20,
  })
  
  const menuItems = existingMenuItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    stationCode: MENU_ITEMS.find(m => m.name === item.name)?.station || 'KITCHEN',
  }))
  
  // If no menu items, create mock ones
  if (menuItems.length === 0) {
    console.log('  Creating mock menu items...')
    for (const item of MENU_ITEMS) {
      try {
        // Try to find a category first
        let category = await prisma.menuCategory.findFirst({
          where: { businessId },
        })
        
        if (!category) {
          category = await prisma.menuCategory.create({
            data: {
              businessId,
              name: 'Main Menu',
              description: 'Main menu items',
              sortOrder: 0,
            },
          })
        }
        
        const menuItem = await prisma.menuItem.create({
          data: {
            businessId,
            categoryId: category.id,
            name: item.name,
            price: item.price,
            isAvailable: true,
          },
        })
        menuItems.push({
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          stationCode: item.station,
        })
      } catch (err) {
        console.log(`  Warning: Could not create menu item ${item.name}`)
      }
    }
  }
  
  console.log(`  ✓ ${tables.length} tables`)
  console.log(`  ✓ ${waiters.length} waiters`)
  console.log(`  ✓ ${stations.length} stations`)
  console.log(`  ✓ ${menuItems.length} menu items`)
  
  return {
    businessId,
    tables: tables.map(t => ({ id: t.id, number: t.number })),
    waiters,
    stations: stations.map(s => ({ id: s.id, name: s.name, code: s.code })),
    menuItems,
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

async function createTicketEvent(saleId, eventType, timestamp, options = {}) {
  await prisma.ticketEvent.create({
    data: {
      saleId,
      saleItemId: options.saleItemId,
      stationId: options.stationId,
      eventType,
      actorId: options.actorId,
      actorName: options.actorName,
      previousState: options.previousState,
      newState: options.newState,
      metadata: options.metadata || {},
      createdAt: timestamp,
    },
  })
}

async function simulateOrder(ctx, orderNumber, startTime) {
  const table = randomElement(ctx.tables)
  const waiter = randomElement(ctx.waiters)
  const numItems = randomBetween(CONFIG.minItemsPerOrder, CONFIG.maxItemsPerOrder)
  const items = Array.from({ length: numItems }, () => randomElement(ctx.menuItems))
  const isCanceled = Math.random() < CONFIG.cancelRate
  
  // Calculate total
  const totalAmountCents = items.reduce((sum, item) => sum + (item.price || 5000), 0)
  
  // Create the sale (order)
  const sale = await prisma.sale.create({
    data: {
      business: { connect: { id: ctx.businessId } },
      orderNumber: `LUN-${String(orderNumber).padStart(4, '0')}`,
      table: { connect: { id: table.id } },
      user: { connect: { id: waiter.id } },
      status: 'pending',
      kitchenStatus: 'pending',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH',
      totalAmountCents: totalAmountCents || 0,
      createdAt: startTime,
    },
  })
  
  // Create sale items
  const saleItems = []
  for (const item of items) {
    const itemPrice = item.price || 5000 // Default price if undefined
    const saleItem = await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        menuItemId: item.id,
        quantity: 1,
        unitPriceCents: itemPrice,
        totalPriceCents: itemPrice,
        itemStatus: 'NEW',
      },
    })
    saleItems.push({ id: saleItem.id, menuItemId: item.id, stationCode: item.stationCode })
  }
  
  let currentTime = startTime
  
  // Event 1: ORDER_CREATED
  await createTicketEvent(sale.id, 'ORDER_CREATED', currentTime, {
    actorId: waiter.id,
    actorName: waiter.name,
    newState: 'pending',
    metadata: { tableNumber: table.number, itemCount: numItems },
  })
  
  // Small delay before routing
  currentTime = addMinutes(currentTime, randomBetween(1, 2))
  
  // Event 2: ITEM_ROUTED for each item
  for (const saleItem of saleItems) {
    const station = ctx.stations.find(s => s.code === saleItem.stationCode) || ctx.stations[0]
    await createTicketEvent(sale.id, 'ITEM_ROUTED', currentTime, {
      saleItemId: saleItem.id,
      stationId: station.id,
      actorId: waiter.id,
      actorName: waiter.name,
      newState: 'routed',
      metadata: { stationName: station.name },
    })
    currentTime = addMinutes(currentTime, 0.5)
  }
  
  // Check for cancellation
  if (isCanceled) {
    currentTime = addMinutes(currentTime, randomBetween(2, 5))
    await createTicketEvent(sale.id, 'ORDER_CANCELED', currentTime, {
      actorId: waiter.id,
      actorName: waiter.name,
      previousState: 'routed',
      newState: 'canceled',
      metadata: { reason: 'Customer request' },
    })
    
    await prisma.sale.update({
      where: { id: sale.id },
      data: { status: 'canceled', kitchenStatus: 'canceled' },
    })
    
    return { endTime: currentTime, canceled: true }
  }
  
  // Event 3: ITEM_ACCEPTED and ITEM_PREPARING
  for (const saleItem of saleItems) {
    const station = ctx.stations.find(s => s.code === saleItem.stationCode) || ctx.stations[0]
    
    // Accepted
    currentTime = addMinutes(currentTime, randomBetween(1, 3))
    await createTicketEvent(sale.id, 'ITEM_ACCEPTED', currentTime, {
      saleItemId: saleItem.id,
      stationId: station.id,
      previousState: 'routed',
      newState: 'accepted',
    })
    
    // Preparing
    currentTime = addMinutes(currentTime, randomBetween(1, 2))
    await createTicketEvent(sale.id, 'ITEM_PREPARING', currentTime, {
      saleItemId: saleItem.id,
      stationId: station.id,
      previousState: 'accepted',
      newState: 'preparing',
    })
  }
  
  // Check for SLA breach
  const hasSLABreach = Math.random() < CONFIG.slaBreachRate
  if (hasSLABreach) {
    currentTime = addMinutes(currentTime, 2)
    await createTicketEvent(sale.id, 'SLA_WARNING', currentTime, {
      saleItemId: saleItems[0].id,
      metadata: { warningType: 'prep_time_exceeded', thresholdMinutes: 15 },
    })
  }
  
  // Event 4: ITEM_READY
  const prepTime = randomBetween(CONFIG.avgPrepTime - 5, CONFIG.avgPrepTime + 8)
  currentTime = addMinutes(currentTime, prepTime)
  
  for (const saleItem of saleItems) {
    const station = ctx.stations.find(s => s.code === saleItem.stationCode) || ctx.stations[0]
    await createTicketEvent(sale.id, 'ITEM_READY', currentTime, {
      saleItemId: saleItem.id,
      stationId: station.id,
      previousState: 'preparing',
      newState: 'ready',
    })
    currentTime = addMinutes(currentTime, 0.5)
  }
  
  // Event 5: ITEM_DELIVERED
  currentTime = addMinutes(currentTime, randomBetween(1, CONFIG.avgDeliveryTime))
  for (const saleItem of saleItems) {
    await createTicketEvent(sale.id, 'ITEM_DELIVERED', currentTime, {
      saleItemId: saleItem.id,
      actorId: waiter.id,
      actorName: waiter.name,
      previousState: 'ready',
      newState: 'delivered',
    })
    currentTime = addMinutes(currentTime, 0.3)
  }
  
  // Event 6: ORDER_COMPLETED
  currentTime = addMinutes(currentTime, randomBetween(CONFIG.avgPaymentTime, CONFIG.avgPaymentTime + 10))
  await createTicketEvent(sale.id, 'ORDER_COMPLETED', currentTime, {
    actorId: waiter.id,
    actorName: waiter.name,
    previousState: 'delivered',
    newState: 'completed',
    metadata: { totalAmountCents, paymentMethod: 'CASH' },
  })
  
  // Update sale status
  await prisma.sale.update({
    where: { id: sale.id },
    data: {
      status: 'completed',
      kitchenStatus: 'completed',
      paymentStatus: 'COMPLETED',
    },
  })
  
  return { endTime: currentTime, canceled: false }
}

async function runSimulation(businessId) {
  console.log('\n🍽️  Service Replay™ - Lunch Service Simulation')
  console.log('━'.repeat(50))
  
  const ctx = await setupSimulation(businessId)
  
  if (ctx.waiters.length === 0) {
    console.error('❌ No waiters found. Please ensure at least one user exists for the business.')
    return
  }
  
  if (ctx.menuItems.length === 0) {
    console.error('❌ No menu items available. Please add menu items first.')
    return
  }
  
  // Set simulation date to today
  const today = new Date()
  today.setHours(CONFIG.startHour, 0, 0, 0)
  
  const serviceStart = today
  const serviceEnd = new Date(today)
  serviceEnd.setHours(CONFIG.endHour, 0, 0, 0)
  
  console.log(`\n📅 Simulating lunch service: ${serviceStart.toLocaleTimeString()} - ${serviceEnd.toLocaleTimeString()}`)
  console.log(`🎯 Target: ${CONFIG.targetOrders} orders\n`)
  
  // Calculate order distribution across the service period
  const serviceDurationMinutes = (CONFIG.endHour - CONFIG.startHour) * 60
  const avgMinutesBetweenOrders = serviceDurationMinutes / CONFIG.targetOrders
  
  let currentTime = serviceStart
  let completedOrders = 0
  let canceledOrders = 0
  
  console.log('📝 Generating orders...')
  
  for (let i = 1; i <= CONFIG.targetOrders; i++) {
    // Add some randomness to order timing (rush hours have more orders)
    const hour = currentTime.getHours()
    const rushMultiplier = (hour >= 12 && hour <= 13) ? 0.6 : 1.2 // More orders during 12-13
    const timeBetweenOrders = avgMinutesBetweenOrders * rushMultiplier * (0.5 + Math.random())
    
    currentTime = addMinutes(currentTime, timeBetweenOrders)
    
    // Don't exceed service end time for starting new orders
    if (currentTime > serviceEnd) {
      console.log(`  ⏰ Service end reached after ${i - 1} orders`)
      break
    }
    
    try {
      const result = await simulateOrder(ctx, i, currentTime)
      
      if (result.canceled) {
        canceledOrders++
      } else {
        completedOrders++
      }
      
      // Progress indicator
      if (i % 20 === 0) {
        console.log(`  ✓ ${i} orders created...`)
      }
    } catch (err) {
      console.error(`  ❌ Error creating order ${i}:`, err.message)
    }
  }
  
  // Count total events
  const eventCount = await prisma.ticketEvent.count({
    where: {
      createdAt: {
        gte: serviceStart,
        lte: new Date(serviceEnd.getTime() + 2 * 60 * 60 * 1000), // Include 2 hours after for completion
      },
      sale: { businessId },
    },
  })
  
  console.log('\n✅ Simulation Complete!')
  console.log('━'.repeat(50))
  console.log(`📊 Results:`)
  console.log(`   • Total Orders: ${completedOrders + canceledOrders}`)
  console.log(`   • Completed: ${completedOrders}`)
  console.log(`   • Canceled: ${canceledOrders}`)
  console.log(`   • Total Events: ${eventCount}`)
  console.log(`   • Time Range: ${serviceStart.toISOString()} to ${serviceEnd.toISOString()}`)
  console.log('\n🎬 Ready for Service Replay testing!')
  console.log(`\n📍 Open: http://localhost:3000/dashboard/operations/service-replay`)
  console.log(`   Select "Today Lunch" preset to replay this simulation`)
}

async function cleanupPreviousSimulation(businessId) {
  console.log('🧹 Cleaning up previous simulation data...')
  
  // Delete ticket events for orders starting with "LUN-"
  const lunOrders = await prisma.sale.findMany({
    where: {
      businessId,
      orderNumber: { startsWith: 'LUN-' },
    },
    select: { id: true },
  })
  
  if (lunOrders.length > 0) {
    const orderIds = lunOrders.map(o => o.id)
    
    await prisma.ticketEvent.deleteMany({
      where: { saleId: { in: orderIds } },
    })
    
    await prisma.saleItem.deleteMany({
      where: { saleId: { in: orderIds } },
    })
    
    await prisma.sale.deleteMany({
      where: { id: { in: orderIds } },
    })
    
    console.log(`  ✓ Deleted ${lunOrders.length} previous simulation orders`)
  } else {
    console.log('  ✓ No previous simulation data found')
  }
}

async function main() {
  // Get business ID from command line or use first business
  let businessId = process.argv[2]
  
  if (!businessId) {
    const business = await prisma.business.findFirst({
      select: { id: true, name: true },
    })
    
    if (!business) {
      console.error('❌ No business found in database')
      process.exit(1)
    }
    
    businessId = business.id
    console.log(`📍 Using business: ${business.name} (${businessId})`)
  }
  
  try {
    await cleanupPreviousSimulation(businessId)
    await runSimulation(businessId)
  } catch (error) {
    console.error('❌ Simulation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
