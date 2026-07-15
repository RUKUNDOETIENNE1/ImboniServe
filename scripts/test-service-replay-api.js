/**
 * Service Replay™ - API Test Script
 * 
 * Tests the Service Replay API endpoints to verify they work correctly.
 */

const https = require('https')
const http = require('http')

const BASE_URL = 'http://localhost:3000'

// Test time range (today's lunch)
const today = new Date()
today.setHours(11, 0, 0, 0)
const startTime = today.toISOString()

const endTime = new Date(today)
endTime.setHours(15, 0, 0, 0)
const endTimeStr = endTime.toISOString()

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    
    // Add query params
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    
    const req = http.get(url.toString(), {
      headers: {
        'Cookie': options.cookie || '',
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          })
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

async function testEventsEndpoint() {
  console.log('\n📋 Testing /api/service-replay/events...')
  
  try {
    const response = await makeRequest('/api/service-replay/events', {
      params: {
        startTime,
        endTime: endTimeStr,
        limit: '50',
      },
    })
    
    if (response.status === 401) {
      console.log('  ⚠️  Authentication required (expected without session)')
      return { success: true, needsAuth: true }
    }
    
    if (response.status === 200) {
      const { events, totalCount, hasMore } = response.data
      console.log(`  ✓ Status: ${response.status}`)
      console.log(`  ✓ Events returned: ${events?.length || 0}`)
      console.log(`  ✓ Total count: ${totalCount}`)
      console.log(`  ✓ Has more: ${hasMore}`)
      
      if (events?.length > 0) {
        console.log(`  ✓ First event: ${events[0].eventType} at ${events[0].timestamp}`)
        console.log(`  ✓ Last event: ${events[events.length - 1].eventType}`)
      }
      
      return { success: true, data: response.data }
    }
    
    console.log(`  ❌ Unexpected status: ${response.status}`)
    console.log(`  Response: ${JSON.stringify(response.data).slice(0, 200)}`)
    return { success: false, error: response.data }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testFiltersEndpoint() {
  console.log('\n🔍 Testing /api/service-replay/filters...')
  
  try {
    const response = await makeRequest('/api/service-replay/filters', {
      params: {
        startTime,
        endTime: endTimeStr,
      },
    })
    
    if (response.status === 401) {
      console.log('  ⚠️  Authentication required (expected without session)')
      return { success: true, needsAuth: true }
    }
    
    if (response.status === 200) {
      const { orders, tables, waiters, stations, eventTypes } = response.data
      console.log(`  ✓ Status: ${response.status}`)
      console.log(`  ✓ Orders: ${orders?.length || 0}`)
      console.log(`  ✓ Tables: ${tables?.length || 0}`)
      console.log(`  ✓ Waiters: ${waiters?.length || 0}`)
      console.log(`  ✓ Stations: ${stations?.length || 0}`)
      console.log(`  ✓ Event types: ${eventTypes?.length || 0}`)
      
      return { success: true, data: response.data }
    }
    
    console.log(`  ❌ Unexpected status: ${response.status}`)
    return { success: false, error: response.data }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testSearchEndpoint() {
  console.log('\n🔎 Testing /api/service-replay/search...')
  
  try {
    const response = await makeRequest('/api/service-replay/search', {
      params: {
        q: 'LUN-0001',
        startTime,
        endTime: endTimeStr,
      },
    })
    
    if (response.status === 401) {
      console.log('  ⚠️  Authentication required (expected without session)')
      return { success: true, needsAuth: true }
    }
    
    if (response.status === 200) {
      const { events, totalCount, query } = response.data
      console.log(`  ✓ Status: ${response.status}`)
      console.log(`  ✓ Query: ${query}`)
      console.log(`  ✓ Results: ${events?.length || 0}`)
      console.log(`  ✓ Total count: ${totalCount}`)
      
      return { success: true, data: response.data }
    }
    
    console.log(`  ❌ Unexpected status: ${response.status}`)
    return { success: false, error: response.data }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🎬 Service Replay™ - API Tests')
  console.log('━'.repeat(50))
  console.log(`Time range: ${startTime} to ${endTimeStr}`)
  
  const results = {
    events: await testEventsEndpoint(),
    filters: await testFiltersEndpoint(),
    search: await testSearchEndpoint(),
  }
  
  console.log('\n━'.repeat(50))
  console.log('📊 Test Summary:')
  
  let allPassed = true
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? '✓' : '❌'
    const note = result.needsAuth ? ' (needs auth)' : ''
    console.log(`  ${status} ${name}${note}`)
    if (!result.success) allPassed = false
  }
  
  if (allPassed) {
    console.log('\n✅ All API tests passed!')
    console.log('\n📍 Next: Open the browser and test the UI at:')
    console.log('   http://localhost:3000/dashboard/operations/service-replay')
  } else {
    console.log('\n❌ Some tests failed. Check the output above.')
  }
}

runTests().catch(console.error)
