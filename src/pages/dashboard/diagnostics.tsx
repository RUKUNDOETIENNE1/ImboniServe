import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type CheckResult = {
  name: string
  status: 'pass' | 'fail' | 'warn' | 'loading'
  message: string
  details?: any
}

export default function DiagnosticsPage() {
  const { status } = useSession()
  const [checks, setChecks] = useState<CheckResult[]>([])
  const [running, setRunning] = useState(false)

  async function runDiagnostics() {
    setRunning(true)
    const results: CheckResult[] = []

    // Check 1: Session
    try {
      const res = await fetch('/api/auth/session')
      const session = await res.json()
      results.push({
        name: 'Session',
        status: session?.user ? 'pass' : 'fail',
        message: session?.user ? `Logged in as ${session.user.email}` : 'No active session',
        details: session
      })
    } catch (e) {
      results.push({
        name: 'Session',
        status: 'fail',
        message: 'Failed to fetch session',
        details: String(e)
      })
    }

    // Check 2: Business
    try {
      const res = await fetch('/api/business/current')
      if (res.ok) {
        const business = await res.json()
        results.push({
          name: 'Business',
          status: business?.id ? 'pass' : 'fail',
          message: business?.id ? `Business: ${business.name} (${business.id})` : 'No business found',
          details: business
        })
      } else {
        const error = await res.json().catch(() => ({}))
        results.push({
          name: 'Business',
          status: 'fail',
          message: error.error || 'Failed to fetch business',
          details: error
        })
      }
    } catch (e) {
      results.push({
        name: 'Business',
        status: 'fail',
        message: 'Failed to fetch business',
        details: String(e)
      })
    }

    // Check 3: Menu Items
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.data || [])
        results.push({
          name: 'Menu Items',
          status: items.length > 0 ? 'pass' : 'warn',
          message: `${items.length} menu items found`,
          details: items
        })
      } else {
        const error = await res.json().catch(() => ({}))
        results.push({
          name: 'Menu Items',
          status: 'fail',
          message: error.error || 'Failed to fetch menu',
          details: error
        })
      }
    } catch (e) {
      results.push({
        name: 'Menu Items',
        status: 'fail',
        message: 'Failed to fetch menu',
        details: String(e)
      })
    }

    // Check 4: Tables
    try {
      const res = await fetch('/api/tables/list')
      if (res.ok) {
        const data = await res.json()
        const tables = data.tables || []
        results.push({
          name: 'Tables',
          status: tables.length > 0 ? 'pass' : 'warn',
          message: `${tables.length} tables found`,
          details: tables
        })
      } else {
        const error = await res.json().catch(() => ({}))
        results.push({
          name: 'Tables',
          status: 'fail',
          message: error.error || 'Failed to fetch tables',
          details: error
        })
      }
    } catch (e) {
      results.push({
        name: 'Tables',
        status: 'fail',
        message: 'Failed to fetch tables',
        details: String(e)
      })
    }

    // Check 5: QR Templates
    try {
      const res = await fetch('/api/qr/templates')
      if (res.ok) {
        const data = await res.json()
        const templates = data.templates || []
        results.push({
          name: 'QR Templates',
          status: templates.length > 0 ? 'pass' : 'warn',
          message: `${templates.length} templates found`,
          details: templates
        })
      } else {
        const error = await res.json().catch(() => ({}))
        results.push({
          name: 'QR Templates',
          status: 'fail',
          message: error.error || 'Failed to fetch templates',
          details: error
        })
      }
    } catch (e) {
      results.push({
        name: 'QR Templates',
        status: 'fail',
        message: 'Failed to fetch templates',
        details: String(e)
      })
    }

    // Check 6: QR Designs
    try {
      const res = await fetch('/api/qr/designs')
      if (res.ok) {
        const data = await res.json()
        const designs = data.designs || []
        results.push({
          name: 'QR Designs',
          status: designs.length > 0 ? 'pass' : 'warn',
          message: `${designs.length} QR designs found`,
          details: designs
        })
      } else {
        const error = await res.json().catch(() => ({}))
        results.push({
          name: 'QR Designs',
          status: 'fail',
          message: error.error || 'Failed to fetch designs',
          details: error
        })
      }
    } catch (e) {
      results.push({
        name: 'QR Designs',
        status: 'fail',
        message: 'Failed to fetch designs',
        details: String(e)
      })
    }

    setChecks(results)
    setRunning(false)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      runDiagnostics()
    }
  }, [status])

  const getIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />
      case 'warn': return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default: return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200'
      case 'fail': return 'bg-red-50 border-red-200'
      case 'warn': return 'bg-orange-50 border-orange-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Diagnostics</h1>
          <p className="text-slate-600">System health check for menu and QR features</p>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            {checks.length > 0 && (
              <>
                {checks.filter(c => c.status === 'pass').length} passed, 
                {checks.filter(c => c.status === 'fail').length} failed, 
                {checks.filter(c => c.status === 'warn').length} warnings
              </>
            )}
          </div>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Run Again'}
          </button>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(check.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-800">{check.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      check.status === 'pass' ? 'bg-green-100 text-green-700' :
                      check.status === 'fail' ? 'bg-red-100 text-red-700' :
                      check.status === 'warn' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{check.message}</p>
                  {check.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-white rounded border border-slate-200 overflow-x-auto">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {checks.length === 0 && !running && (
          <div className="text-center py-12 text-slate-500">
            Click "Run Again" to start diagnostics
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Fixes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>No QR Templates?</strong> Run: <code className="bg-blue-100 px-1 rounded">npx tsx prisma/seed-templates.ts</code></li>
            <li>• <strong>No Menu Items?</strong> Go to <a href="/dashboard/menu" className="underline">Menu Management</a> and add items</li>
            <li>• <strong>No Tables?</strong> Go to <a href="/dashboard/tables" className="underline">Tables</a> and create tables</li>
            <li>• <strong>No Business?</strong> Check your user account is linked to a business</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
