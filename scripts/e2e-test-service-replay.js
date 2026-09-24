/**
 * Service Replay™ - End-to-End Test Script
 * 
 * Comprehensive test of the Service Replay feature:
 * 1. Verify simulation data exists
 * 2. Test API endpoints with database queries
 * 3. Verify statistics calculation
 * 4. Test filtering and search
 * 5. Verify event transformation
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test time range (today's lunch)
const today = new Date()
today.setHours(11, 0, 0, 0)
const startTime = today
const endTime = new Date(today)
endTime.setHours(15, 0, 0, 0)

const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

function test(name, condition, details = '') {
  if (condition) {
    results.passed++
    results.tests.push({ name, status: 'PASS', details })
    console.log(`  ✓ ${name}`)
  } else {
    results.failed++
    results.tests.push({ name, status: 'FAIL', details })
    console.log(`  ❌ ${name}${details ? `: ${details}` : ''}`)
  }
}

async function testSimulationData() {
  console.log('\n📊 Testing Simulation Data...')
  
  // Count orders
  const orderCount = await prisma.sale.count({
    where: {
      orderNumber: { startsWith: 'LUN-' },
      createdAt: { gte: startTime, lte: endTime },
    },
  })
  test('Orders exist', orderCount >= 100, `Found ${orderCount} orders`)
  
  // Count events
  const eventCount = await prisma.ticketEvent.count({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
  })
  test('Events exist', eventCount >= 1000, `Found ${eventCount} events`)
  
  // Check event types distribution
  const eventTypes = await prisma.ticketEvent.groupBy({
    by: ['eventType'],
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    _count: true,
  })
  
  const typeNames = eventTypes.map(e => e.eventType)
  test('ORDER_CREATED events exist', typeNames.includes('ORDER_CREATED'))
  test('ITEM_ROUTED events exist', typeNames.includes('ITEM_ROUTED'))
  test('ITEM_READY events exist', typeNames.includes('ITEM_READY'))
  test('ORDER_COMPLETED events exist', typeNames.includes('ORDER_COMPLETED'))
  
  // Check for canceled orders
  const canceledCount = await prisma.ticketEvent.count({
    where: {
      eventType: 'ORDER_CANCELED',
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
    },
  })
  test('Canceled orders exist', canceledCount > 0, `Found ${canceledCount} cancellations`)
  
  return { orderCount, eventCount, eventTypes }
}

async function testEventOrdering() {
  console.log('\n⏱️ Testing Event Ordering...')
  
  // Get events for a single order
  const sampleOrder = await prisma.sale.findFirst({
    where: {
      orderNumber: { startsWith: 'LUN-' },
      status: 'completed',
    },
    include: {
      ticketEvents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  
  if (!sampleOrder) {
    test('Sample order found', false, 'No completed orders found')
    return
  }
  
  test('Sample order found', true, `Order ${sampleOrder.orderNumber}`)
  
  const events = sampleOrder.ticketEvents
  test('Order has events', events.length > 0, `${events.length} events`)
  
  // Verify chronological order
  let isChronological = true
  for (let i = 1; i < events.length; i++) {
    if (events[i].createdAt < events[i - 1].createdAt) {
      isChronological = false
      break
    }
  }
  test('Events are chronologically ordered', isChronological)
  
  // Verify event sequence makes sense
  const eventSequence = events.map(e => e.eventType)
  test('First event is ORDER_CREATED', eventSequence[0] === 'ORDER_CREATED')
  test('Last event is ORDER_COMPLETED', eventSequence[eventSequence.length - 1] === 'ORDER_COMPLETED')
  
  // Check for ITEM_ROUTED before ITEM_READY
  const routedIndex = eventSequence.indexOf('ITEM_ROUTED')
  const readyIndex = eventSequence.indexOf('ITEM_READY')
  test('ITEM_ROUTED comes before ITEM_READY', routedIndex < readyIndex)
}

async function testStatisticsCalculation() {
  console.log('\n📈 Testing Statistics Calculation...')
  
  // Get all events in order
  const events = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sale: { select: { id: true, orderNumber: true, tableId: true } },
    },
  })
  
  // Simulate statistics calculation
  const stats = {
    ordersActive: new Set(),
    ordersCompleted: 0,
    ordersCanceled: 0,
    tablesOccupied: new Set(),
    kitchenQueue: 0,
    itemsReady: 0,
  }
  
  for (const event of events) {
    switch (event.eventType) {
      case 'ORDER_CREATED':
        stats.ordersActive.add(event.saleId)
        if (event.sale?.tableId) stats.tablesOccupied.add(event.sale.tableId)
        break
      case 'ORDER_COMPLETED':
        stats.ordersActive.delete(event.saleId)
        stats.ordersCompleted++
        break
      case 'ORDER_CANCELED':
        stats.ordersActive.delete(event.saleId)
        stats.ordersCanceled++
        break
      case 'ITEM_ROUTED':
        stats.kitchenQueue++
        break
      case 'ITEM_READY':
        stats.kitchenQueue = Math.max(0, stats.kitchenQueue - 1)
        stats.itemsReady++
        break
    }
  }
  
  test('Completed orders tracked', stats.ordersCompleted > 100, `${stats.ordersCompleted} completed`)
  test('Canceled orders tracked', stats.ordersCanceled > 0, `${stats.ordersCanceled} canceled`)
  test('Tables were occupied', stats.tablesOccupied.size > 0, `${stats.tablesOccupied.size} tables used`)
  test('Items went through kitchen', stats.itemsReady > 0, `${stats.itemsReady} items ready`)
  
  // At end of replay, all orders should be completed or canceled
  test('All orders resolved at end', stats.ordersActive.size === 0, `${stats.ordersActive.size} still active`)
}

async function testFiltering() {
  console.log('\n🔍 Testing Filtering...')
  
  // Get unique tables
  const tables = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    select: {
      sale: { select: { tableId: true, table: { select: { number: true } } } },
    },
    distinct: ['saleId'],
  })
  
  const uniqueTables = new Set(tables.map(t => t.sale?.tableId).filter(Boolean))
  test('Multiple tables used', uniqueTables.size > 5, `${uniqueTables.size} tables`)
  
  // Get unique stations
  const stations = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      stationId: { not: null },
    },
    select: { stationId: true },
    distinct: ['stationId'],
  })
  
  test('At least one station used', stations.length >= 1, `${stations.length} stations`)
  
  // Test filtering by table
  const sampleTableId = Array.from(uniqueTables)[0]
  const tableEvents = await prisma.ticketEvent.count({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { tableId: sampleTableId },
    },
  })
  test('Filter by table works', tableEvents > 0, `${tableEvents} events for table`)
  
  // Test filtering by event type
  const orderCreatedEvents = await prisma.ticketEvent.count({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      eventType: 'ORDER_CREATED',
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
  })
  test('Filter by event type works', orderCreatedEvents > 100, `${orderCreatedEvents} ORDER_CREATED events`)
}

async function testSearch() {
  console.log('\n🔎 Testing Search...')
  
  // Search by order number
  const orderSearch = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { contains: 'LUN-0001' } },
    },
  })
  test('Search by order number works', orderSearch.length > 0, `Found ${orderSearch.length} events`)
  
  // Search by actor name
  const actorSearch = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      actorName: { not: null },
    },
    take: 10,
  })
  test('Events have actor names', actorSearch.length > 0, `Found ${actorSearch.length} events with actors`)
}

async function testEventTransformation() {
  console.log('\n🔄 Testing Event Transformation...')
  
  // Get a sample event with all relations
  const sampleEvent = await prisma.ticketEvent.findFirst({
    where: {
      eventType: 'ORDER_CREATED',
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
    },
    include: {
      sale: {
        include: {
          table: true,
          customer: true,
        },
      },
      station: true,
      actor: true,
    },
  })
  
  test('Sample event found', !!sampleEvent)
  
  if (sampleEvent) {
    test('Event has sale relation', !!sampleEvent.sale)
    test('Event has order number', !!sampleEvent.sale?.orderNumber)
    test('Event has table relation', !!sampleEvent.sale?.table)
    test('Event has timestamp', !!sampleEvent.createdAt)
    test('Event has event type', !!sampleEvent.eventType)
  }
}

async function testPlaybackSimulation() {
  console.log('\n▶️ Testing Playback Simulation...')
  
  // Get events in chronological order
  const events = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  
  test('Can fetch events in order', events.length > 0)
  
  // Simulate playback timing
  if (events.length >= 2) {
    const firstTime = new Date(events[0].createdAt).getTime()
    const lastTime = new Date(events[events.length - 1].createdAt).getTime()
    const duration = lastTime - firstTime
    
    test('Events span time range', duration > 0, `${Math.round(duration / 60000)} minutes`)
    
    // Test progress calculation
    const midTime = firstTime + duration / 2
    const midIndex = events.findIndex(e => new Date(e.createdAt).getTime() >= midTime)
    test('Can find event at midpoint', midIndex > 0 && midIndex < events.length - 1, `Index ${midIndex}`)
  }
  
  // Test pagination
  const page1 = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  
  const page2 = await prisma.ticketEvent.findMany({
    where: {
      createdAt: { gte: startTime, lte: new Date(endTime.getTime() + 2 * 60 * 60 * 1000) },
      sale: { orderNumber: { startsWith: 'LUN-' } },
    },
    orderBy: { createdAt: 'asc' },
    skip: 50,
    take: 50,
  })
  
  test('Pagination works', page1.length === 50 && page2.length === 50)
  test('Pages are different', page1[0].id !== page2[0].id)
}

async function runAllTests() {
  console.log('🎬 Service Replay™ - End-to-End Tests')
  console.log('━'.repeat(50))
  console.log(`Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`)
  
  try {
    await testSimulationData()
    await testEventOrdering()
    await testStatisticsCalculation()
    await testFiltering()
    await testSearch()
    await testEventTransformation()
    await testPlaybackSimulation()
    
    console.log('\n' + '━'.repeat(50))
    console.log('📊 Test Results:')
    console.log(`   ✓ Passed: ${results.passed}`)
    console.log(`   ❌ Failed: ${results.failed}`)
    console.log(`   Total: ${results.passed + results.failed}`)
    
    if (results.failed === 0) {
      console.log('\n✅ All tests passed! Service Replay is ready.')
      console.log('\n🎯 Manual verification steps:')
      console.log('   1. Open http://localhost:3000/dashboard/operations/service-replay')
      console.log('   2. Login with a Manager/Owner account')
      console.log('   3. Select "Today Lunch" preset')
      console.log('   4. Click "Load Events" to fetch data')
      console.log('   5. Press Play and verify:')
      console.log('      - Timeline progresses smoothly')
      console.log('      - Statistics update in real-time')
      console.log('      - Events appear in chronological order')
      console.log('   6. Test speed controls (1x, 2x, 4x, 8x)')
      console.log('   7. Test timeline scrubber')
      console.log('   8. Test filters and search')
      console.log('   9. Click an event to view details')
    } else {
      console.log('\n❌ Some tests failed. Please review and fix issues.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Test error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runAllTests()
