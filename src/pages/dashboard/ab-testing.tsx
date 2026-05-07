import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { Beaker, Plus, TrendingUp, Users, DollarSign, Target, Play, Pause, Trophy, HelpCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { toast } from 'react-hot-toast'

interface ABTest {
  id: string
  name: string
  menuItemId: string
  menuItemName: string
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  variants: {
    id: string
    name: string
    changes: {
      price?: number
      description?: string
      image?: string
    }

    trafficPercent: number
    metrics: {
      views: number
      orders: number
      revenue: number
      conversionRate: number
    }
  }[]
  startDate: string
  endDate?: string
  winner?: string
  createdAt: string
}

function ABTesting() {
  const { t } = useTranslation()
  const router = useRouter()
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTest, setShowNewTest] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [newTest, setNewTest] = useState({
    name: '',
    menuItemId: '',
    variants: [
      { name: 'Control', description: '', trafficPercent: 50, changes: {} },
      { name: 'Variant A', description: '', trafficPercent: 50, changes: {} }
    ]
  })
  const [variantChangesText, setVariantChangesText] = useState<string[]>(['{}', '{}'])
    const [variantPriceRw, setVariantPriceRw] = useState<string[]>(['', ''])
    const [variantDescText, setVariantDescText] = useState<string[]>(['', ''])

  useEffect(() => {
    fetchTests()
    fetchMenuItems()
  }, [])

  // When opening the modal, seed the draft textarea values from current variants
  useEffect(() => {
    if (showNewTest) {
      setVariantChangesText(newTest.variants.map(v => JSON.stringify(v.changes ?? {})))
            setVariantPriceRw(newTest.variants.map(v => typeof (v as any).changes?.priceCents === 'number' ? String(Math.round(((v as any).changes.priceCents as number) / 100)) : ''))
            setVariantDescText(newTest.variants.map(v => typeof (v as any).changes?.description === 'string' ? ((v as any).changes.description as string) : ''))
    }
  }, [showNewTest])

  const fetchTests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ab-testing/tests')
      if (res.ok) {
        const data = await res.json()
        setTests(data.tests || [])
        setNeedsAuth(false)
      } else if (res.status === 401) {
        setNeedsAuth(true)
        setTests([])
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const items = await res.json()
        setMenuItems(items)
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    }
  }

  const createTest = async () => {
    try {
      const res = await fetch('/api/ab-testing/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest)
      })
      if (res.ok) {
        toast.success(t('ab.test_created', 'Test created successfully!'))
        setShowNewTest(false)
        setNewTest({
          name: '',
          menuItemId: '',
          variants: [
            { name: 'Control', description: '', trafficPercent: 50, changes: {} },
            { name: 'Variant A', description: '', trafficPercent: 50, changes: {} }
          ]
        })
        setVariantChangesText(['{}', '{}'])
                setVariantPriceRw(['', ''])
                setVariantDescText(['', ''])
        fetchTests()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create test')
      }
    } catch (error) {
      toast.error('Failed to create test')
    }
  }

  const updateTestStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/ab-testing/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(t('ab.status_updated', 'Test status updated'))
        fetchTests()
      }
    } catch (error) {
      toast.error('Failed to update test')
    }
  }

  const selectWinner = async (testId: string, variantId: string) => {
    try {
      const res = await fetch(`/api/ab-testing/tests/${testId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId })
      })
      if (res.ok) {
        toast.success(t('ab.winner_selected', 'Winner selected and applied!'))
        fetchTests()
      }
    } catch (error) {
      toast.error('Failed to select winner')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-700 border-slate-200',
      'RUNNING': 'bg-green-100 text-green-700 border-green-200',
      'PAUSED': 'bg-amber-100 text-amber-700 border-amber-200',
      'COMPLETED': 'bg-blue-100 text-blue-700 border-blue-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const stats = {
    total: tests.length,
    running: tests.filter(t => t.status === 'RUNNING').length,
    completed: tests.filter(t => t.status === 'COMPLETED').length
  }

  const totalNewTestTraffic = newTest.variants.reduce((sum, v) => sum + (v.trafficPercent || 0), 0)

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('ab.title', 'Menu A/B Testing')}
            </h1>
            <p className="text-slate-600">
              {t('ab.subtitle', 'Test menu variations and optimize for conversions')}
            </p>
          </div>
          <button
            onClick={() => setShowNewTest(true)}
            className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('ab.new_test', 'New Test')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Beaker className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.total}</h3>
            <p className="text-sm text-slate-600">{t('ab.total_tests', 'Total Tests')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.running}</h3>
            <p className="text-sm text-slate-600">{t('ab.running', 'Running')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.completed}</h3>
            <p className="text-sm text-slate-600">{t('ab.completed', 'Completed')}</p>
          </Card>
        </div>

        {/* Tests List */}
        <div className="space-y-6">
          {loading ? (
            <Card className="p-12 text-center text-slate-500">
              {t('common.loading', 'Loading...')}
            </Card>
          ) : needsAuth ? (
            <Card className="p-12 text-center">
              <p className="text-slate-600 mb-4">
                {t('ab.login_required', 'Please log in to manage A/B tests.')}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('ab.go_to_login', 'Go to Login')}
              </button>
            </Card>
          ) : tests.length === 0 ? (
            <Card className="p-12 text-center">
              <Beaker className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {t('ab.no_tests', 'No A/B tests yet. Create your first test to optimize your menu!')}
              </p>
              <button
                onClick={() => setShowNewTest(true)}
                className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('ab.create_first', 'Create First Test')}
              </button>
            </Card>
          ) : (
            tests.map(test => (
              <Card key={test.id} className="overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{test.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Testing: <span className="font-medium">{test.menuItemName}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Started: {new Date(test.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {test.status === 'DRAFT' && (
                        <button
                          onClick={() => updateTestStatus(test.id, 'RUNNING')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Test
                        </button>
                      )}
                      {test.status === 'RUNNING' && (
                        <button
                          onClick={() => updateTestStatus(test.id, 'PAUSED')}
                          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors flex items-center gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          Pause
                        </button>
                      )}
                      {test.status === 'PAUSED' && (
                        <button
                          onClick={() => updateTestStatus(test.id, 'RUNNING')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Resume
                        </button>
                      )}
                      {(test.status === 'RUNNING' || test.status === 'PAUSED') && (
                        <button
                          onClick={() => updateTestStatus(test.id, 'COMPLETED')}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                        >
                          End Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants Comparison */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {test.variants.map(variant => {
                      const isWinner = test.winner === variant.id
                      const isBestPerforming = test.variants.every(v => 
                        variant.metrics.conversionRate >= v.metrics.conversionRate
                      )

                      return (
                        <div
                          key={variant.id}
                          className={`p-4 rounded-xl border-2 ${
                            isWinner
                              ? 'border-green-500 bg-green-50'
                              : isBestPerforming && test.status === 'RUNNING'
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800">{variant.name}</h4>
                            {isWinner && (
                              <Trophy className="w-5 h-5 text-green-600" />
                            )}
                          </div>

                          <div className="space-y-3 mb-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">{t('ab.traffic', 'Traffic')}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${variant.trafficPercent}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-800">
                                  {variant.trafficPercent}%
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">{t('ab.views', 'Views')}</p>
                                <p className="font-bold text-slate-800">{variant.metrics.views}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">{t('ab.orders', 'Orders')}</p>
                                <p className="font-bold text-slate-800">{variant.metrics.orders}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 mb-1">{t('ab.conversion', 'Conversion')}</p>
                              <p className="text-lg font-bold text-slate-800">
                                {variant.metrics.conversionRate.toFixed(1)}%
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 mb-1">{t('ab.revenue', 'Revenue')}</p>
                              <p className="font-bold text-slate-800">
                                <CurrencyDisplay amount={variant.metrics.revenue} />
                              </p>
                            </div>
                          </div>

                          {test.status === 'COMPLETED' && !test.winner && (
                            <button
                              onClick={() => selectWinner(test.id, variant.id)}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                              {t('ab.select_winner', 'Select as Winner')}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Test Modal */}
        {showNewTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  {t('ab.create_test', 'Create A/B Test')}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Test Name */}
                <div>
                  <label htmlFor="ab-test-name" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('ab.test_name', 'Test Name')}
                  </label>
                  <input
                    type="text"
                    id="ab-test-name"
                    name="ab-test-name"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Brochette Price Test"
                  />
                </div>

                {/* Menu Item Selection */}
                <div>
                  <label htmlFor="ab-test-menu-item" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('ab.menu_item', 'Menu Item (Optional)')}
                  </label>
                  <select
                    id="ab-test-menu-item"
                    name="ab-test-menu-item"
                    value={newTest.menuItemId}
                    onChange={(e) => setNewTest({ ...newTest, menuItemId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a menu item...</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {(item.priceCents / 100).toLocaleString()} RWF
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variants */}
                <div>
                  <div className="block text-sm font-medium text-slate-700 mb-3">
                    {t('ab.variants', 'Options (A/B)')}
                  </div>
                  {newTest.variants.map((variant, index) => (
                    <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`variant-name-${index}`} className="block text-xs text-slate-600 mb-1">Name</label>
                          <input
                            type="text"
                            id={`variant-name-${index}`}
                            name={`variant-name-${index}`}
                            value={variant.name}
                            onChange={(e) => {
                              const updated = [...newTest.variants]
                              updated[index].name = e.target.value
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor={`variant-traffic-${index}`} className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                            Traffic %
                            <span className="group relative">
                              <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                              <span className="invisible group-hover:visible absolute left-0 top-5 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-10">
                                Percentage of visitors who will see this option. Total should equal 100%.
                              </span>
                            </span>
                          </label>
                          <input
                            type="number"
                            id={`variant-traffic-${index}`}
                            name={`variant-traffic-${index}`}
                            value={variant.trafficPercent}
                            onChange={(e) => {
                              const updated = [...newTest.variants]
                              updated[index].trafficPercent = parseInt(e.target.value) || 0
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label htmlFor={`variant-price-${index}`} className="block text-xs text-slate-600 mb-1">New price</label>
                          <input
                            type="number"
                            id={`variant-price-${index}`}
                            name={`variant-price-${index}`}
                            value={variantPriceRw[index] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setVariantPriceRw(prev => { const copy = [...prev]; copy[index] = val; return copy })
                              const updated = [...newTest.variants]
                              const c: any = { ...(updated[index].changes || {}) }
                              if (val === '' || isNaN(Number(val))) { delete c.priceCents } else { c.priceCents = Math.max(0, Math.round(Number(val) * 100)) }
                              updated[index].changes = c
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            min="0"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Leave blank to keep the current price.</p>
                        </div>
                        <div>
                          <label htmlFor={`variant-desc-${index}`} className="block text-xs text-slate-600 mb-1">Description change</label>
                          <input
                            type="text"
                            id={`variant-desc-${index}`}
                            name={`variant-desc-${index}`}
                            value={variantDescText[index] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setVariantDescText(prev => { const copy = [...prev]; copy[index] = val; return copy })
                              const updated = [...newTest.variants]
                              const c: any = { ...(updated[index].changes || {}) }
                              if (!val) { delete c.description } else { c.description = val }
                              updated[index].changes = c
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Optional. Shown to customers if provided.</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <details>
                          <summary className="text-xs text-slate-600 cursor-pointer select-none">Advanced: Edit raw JSON</summary>
                        <label htmlFor={`variant-changes-${index}`} className="block text-xs text-slate-600 mb-1">
                          Changes (JSON) - e.g., {`{"priceCents": 200000}`}
                        </label>
                        <textarea
                          id={`variant-changes-${index}`}
                          name={`variant-changes-${index}`}
                          value={variantChangesText[index] ?? JSON.stringify(variant.changes ?? {})}
                          onChange={(e) => {
                            const text = e.target.value
                            setVariantChangesText(prev => {
                              const copy = [...prev]
                              copy[index] = text
                              return copy
                            })
                            try {
                              const parsed = JSON.parse(text || '{}')
                              const updated = [...newTest.variants]
                              updated[index].changes = parsed
                              setNewTest({ ...newTest, variants: updated })
                            } catch {
                              // Keep allowing free typing even if JSON is temporarily invalid
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                          rows={2}
                              
                        />
                            </details>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setNewTest({
                        ...newTest,
                        variants: [...newTest.variants, { name: `Variant ${String.fromCharCode(65 + newTest.variants.length - 1)}`, description: '', trafficPercent: 50, changes: {} }]
                      })
                      setVariantChangesText([...variantChangesText, '{}'])
                      setVariantPriceRw([...variantPriceRw, ''])
                      setVariantDescText([...variantDescText, ''])
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Variant
                  </button>
                </div>
              </div>

              <div className="p-6 pt-0 text-sm text-slate-700">
                <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-medium mb-2">A/B Testing basics</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Options (A/B)</span>: A is the Control; add one or more alternatives to compare.</li>
                    <li><span className="font-medium">Traffic %</span>: The share of visitors who see each option. Aim for a total of 100%.</li>
                    <li><span className="font-medium">Changes</span>: Use New price and Description for quick edits. Advanced users can edit raw JSON.</li>
                    <li><span className="font-medium">Run</span>: Start the test, watch views, orders and revenue, then end and select the winner.</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <div className="mb-3 text-sm text-slate-600 flex items-center justify-between">
                  <span>Total traffic allocation:</span>
                  <span className={`font-bold ${totalNewTestTraffic === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    {totalNewTestTraffic}%
                  </span>
                </div>
                {totalNewTestTraffic !== 100 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    ⚠️ Traffic should total 100% for best results
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowNewTest(false)}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={createTest}
                    disabled={!newTest.name || newTest.variants.length < 2}
                    className="px-6 py-2 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('ab.create', 'Create Test')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
export default dynamic(() => Promise.resolve(ABTesting), { ssr: false })