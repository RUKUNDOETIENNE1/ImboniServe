import puppeteer, { Page } from 'puppeteer'

interface TestCase {
  name: string
  path: string
  requiresAuth?: boolean
  check?: (html: string, url: string) => Promise<boolean> | boolean
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return undefined
}

const BASE = getArg('--base') || process.env.APP_URL || 'http://localhost:3000'
const EMAIL = process.env.TEST_EMAIL || 'jean@nyamacafe.rw'
const PASSWORD = process.env.TEST_PASSWORD || 'Owner123!'

async function ensureAuthenticated(page: Page): Promise<void> {
  // Try dashboard; if redirected to login, perform login
  const res = await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' })
  const url = page.url()
  if (url.includes('/login')) {
    // Attempt to fill common auth form fields
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 }).catch(() => {})
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 5000 }).catch(() => {})

    const emailSel = (await page.$('input[name="email"]')) || (await page.$('input[type="email"]'))
    const passSel = (await page.$('input[name="password"]')) || (await page.$('input[type="password"]'))

    if (emailSel && passSel) {
      await emailSel.click({ clickCount: 3 })
      await emailSel.type(EMAIL, { delay: 10 })
      await passSel.click({ clickCount: 3 })
      await passSel.type(PASSWORD, { delay: 10 })

      // Submit form (try button[type=submit] then any button with Login text)
      let submitBtn = await page.$('button[type="submit"]')
      if (!submitBtn) {
        const buttons = await page.$$('button')
        for (const btn of buttons) {
          const text = await page.evaluate(el => (el.textContent || '').toLowerCase(), btn)
          if (text.includes('login')) {
            submitBtn = btn
            break
          }
        }
      }

      if (submitBtn) {
        await submitBtn.click()
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
      }
    }
  }
  // After login, verify we can view dashboard or at least not on login page
  if (page.url().includes('/login')) {
    console.warn('[WARN] Login may have failed. Protected routes may be skipped.')
  }
}

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(30000)

  const results: { name: string; path: string; ok: boolean; status?: number; note?: string }[] = []

  const publicTests: TestCase[] = [
    { name: 'Home', path: '/' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Login', path: '/login' },
    { name: 'Signup', path: '/signup' },
    { name: 'Manifest', path: '/manifest.json', check: (html) => html.includes('"name"') },
    { name: 'Service Worker', path: '/sw.js', check: (html) => html.includes('Service Worker') },
    { name: 'Offline Page', path: '/offline.html', check: (html) => html.toLowerCase().includes('offline') },
    { name: 'Locales EN', path: '/locales/en.json', check: (html) => html.includes('"welcome"') },
    { name: 'Locales RW', path: '/locales/rw.json', check: (html) => html.includes('"kinyarwanda"') },
  ]

  const protectedTests: TestCase[] = [
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { name: 'Sales', path: '/dashboard/sales', requiresAuth: true },
    { name: 'New Sale', path: '/dashboard/sales/new', requiresAuth: true },
    { name: 'Inventory', path: '/dashboard/inventory', requiresAuth: true },
    { name: 'Reports', path: '/dashboard/reports', requiresAuth: true },
    { name: 'Transactions', path: '/dashboard/transactions', requiresAuth: true },
    { name: 'Settings', path: '/dashboard/settings', requiresAuth: true },
  ]

  // Run public tests
  for (const t of publicTests) {
    try {
      const response = await page.goto(`${BASE}${t.path}`, { waitUntil: 'networkidle2' })
      const status = response ? response.status() : undefined
      const html = await page.content()
      const ok = (!!status && status >= 200 && status < 400) && (t.check ? !!(await t.check(html, page.url())) : true)
      results.push({ name: t.name, path: t.path, ok, status })
      console.log(`${ok ? '[PASS]' : '[FAIL]'} ${t.name} ${t.path} ${status ?? ''}`)
    } catch (e: any) {
      results.push({ name: t.name, path: t.path, ok: false, note: e?.message })
      console.log(`[FAIL] ${t.name} ${t.path} - ${e?.message}`)
    }
  }

  // Ensure auth once
  await ensureAuthenticated(page)

  for (const t of protectedTests) {
    try {
      const response = await page.goto(`${BASE}${t.path}`, { waitUntil: 'networkidle2' })
      const status = response ? response.status() : undefined
      const currentUrl = page.url()
      if (currentUrl.includes('/login')) {
        results.push({ name: t.name, path: t.path, ok: false, status, note: 'Redirected to login (no test account?)' })
        console.log(`[SKIP] ${t.name} ${t.path} - redirected to login`)
        continue
      }
      const ok = (!!status && status >= 200 && status < 400)
      results.push({ name: t.name, path: t.path, ok, status })
      console.log(`${ok ? '[PASS]' : '[FAIL]'} ${t.name} ${t.path} ${status ?? ''}`)
    } catch (e: any) {
      results.push({ name: t.name, path: t.path, ok: false, note: e?.message })
      console.log(`[FAIL] ${t.name} ${t.path} - ${e?.message}`)
    }
  }

  await browser.close()

  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok && !r.note?.includes('redirected to login')).length
  const skipped = results.filter(r => r.note?.includes('redirected to login')).length

  console.log('---------------------------------------------')
  console.log(`Base URL: ${BASE}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped (auth): ${skipped}`)
  console.log('---------------------------------------------')

  if (failed > 0) process.exit(1)
}

run().catch((e) => {
  console.error('Fatal error in smoke tests:', e)
  process.exit(1)
})
