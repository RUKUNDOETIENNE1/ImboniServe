/**
 * PC-001: Platform consistency regression
 * - every internal href in dashboard nav / homepage / public feature pages resolves to a real page
 * - nav surfaces CRM, Staff Performance, Smart Dining Slips, Sales, Stations without nonexistent flags
 * - marketing no longer advertises platform-staff-only CEO/CFO dashboards
 * - public menu API exposes the business operating currency
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'src', 'pages')

function pageExists(href: string): boolean {
  const rel = href.split('?')[0].split('#')[0].replace(/^\//, '')
  if (!rel) return true
  if (fs.existsSync(path.join(ROOT, rel + '.tsx')) || fs.existsSync(path.join(ROOT, rel, 'index.tsx'))) return true
  const parts = rel.split('/')
  let dir = ROOT
  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1
    const entries = fs.existsSync(dir) ? fs.readdirSync(dir) : []
    if (last) {
      return (
        entries.includes(parts[i] + '.tsx') ||
        (entries.includes(parts[i]) && fs.existsSync(path.join(dir, parts[i], 'index.tsx'))) ||
        entries.some((e) => /^\[[^.]+\](\.tsx)?$/.test(e))
      )
    }
    if (entries.includes(parts[i])) dir = path.join(dir, parts[i])
    else {
      const dyn = entries.find((e) => /^\[[^.]+\]$/.test(e))
      if (!dyn) return false
      dir = path.join(dir, dyn)
    }
  }
  return false
}

function internalHrefs(file: string): string[] {
  const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
  const out = new Set<string>()
  for (const m of src.matchAll(/href[:=]\s*\{?['"`](\/[^'"`$]*)['"`]/g)) {
    if (!m[1].startsWith('/api') && !m[1].startsWith('/imgs')) out.add(m[1])
  }
  return [...out]
}

const read = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')

describe('PC-001 platform consistency', () => {
  const files = [
    'src/components/DashboardLayout.tsx',
    'src/pages/index.tsx',
    'src/pages/dashboard/index.tsx',
    'src/pages/features/index.tsx',
    'src/pages/features/growth.tsx',
    'src/pages/features/analytics.tsx',
    'src/pages/features/finance.tsx',
  ]

  it.each(files)('%s has no broken internal links', (f) => {
    const broken = internalHrefs(f).filter((h) => !pageExists(h))
    expect(broken).toEqual([])
  })

  it('dashboard home WhatsApp action points at the settings WhatsApp tab', () => {
    const s = read('src/pages/dashboard/index.tsx')
    expect(s).not.toContain('/whatsapp-setup')
    expect(s).toContain('/dashboard/settings?tab=whatsapp')
  })

  it('nav surfaces Sales, Stations, CRM, Staff Performance, Smart Dining Slips', () => {
    const s = read('src/components/DashboardLayout.tsx')
    for (const href of [
      '/dashboard/sales',
      '/dashboard/stations',
      '/dashboard/crm',
      '/dashboard/staff-performance',
      '/dashboard/smart-dining-slips',
    ]) {
      const line = s.split('\n').find((l) => l.includes(`href: '${href}'`))
      expect(line).toBeDefined()
      expect(line).toContain('v1Visible: true')
    }
  })

  it('CRM nav is not gated behind the unseeded crm_v1 flag', () => {
    const s = read('src/components/DashboardLayout.tsx')
    const line = s.split('\n').find((l) => l.includes("href: '/dashboard/crm'"))!
    expect(line).not.toContain('featureFlag')
  })

  it('KITCHEN_MANAGER can see Kitchen nav', () => {
    const s = read('src/components/DashboardLayout.tsx')
    const line = s.split('\n').find((l) => l.includes("href: '/dashboard/kitchen'"))!
    expect(line).toContain('KITCHEN_MANAGER')
  })

  it('marketing does not advertise platform-staff-only CEO/CFO dashboards', () => {
    for (const f of [
      'src/pages/index.tsx',
      'src/pages/features/index.tsx',
      'src/pages/features/analytics.tsx',
      'src/pages/features/finance.tsx',
    ]) {
      const s = read(f)
      expect(s).not.toMatch(/CFO Dashboard|CEO Dashboard|href="\/dashboard\/(cfo|ceo)"/)
    }
  })

  it('public order page labels prices with the business operating currency', () => {
    const s = read('src/pages/order/index.tsx')
    expect(s).toContain('setBusinessCurrency(menuData.currency)')
    expect(s).not.toMatch(/<CurrencyDisplay (?!currencyOverride)/)
  })
})

describe('PC-001 public menu currency', () => {
  const mockPrisma = {
    business: { findUnique: jest.fn() },
    menuItem: { findMany: jest.fn() },
  }
  jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
  jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (fn: any) => fn }))

  it('returns business.currency and selects it', async () => {
    let handler: any
    jest.isolateModules(() => {
      handler = require('@/pages/api/public/menu').default
    })
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'b1', name: 'Cafe', address: null, city: 'Kigali', phone: null,
      currency: 'RWF', enableQRInVenue: true, enableQRRemote: false,
    })
    mockPrisma.menuItem.findMany.mockResolvedValue([])
    const res: any = {}
    res.status = jest.fn(() => res)
    res.json = jest.fn(() => res)
    await handler({ method: 'GET', query: { branchId: 'b1' }, headers: {} }, res)
    expect(mockPrisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.objectContaining({ currency: true }) })
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ currency: 'RWF' }))
  })
})
