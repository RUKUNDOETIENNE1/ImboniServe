import { useEffect, useMemo, useState } from 'react'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

type TrialRow = {
  id: string
  riskScore: number
  blocked: boolean
  blockReason?: string | null
  ipRange?: string | null
  deviceFingerprint?: string | null
  trialUsedAt?: string | null
  createdAt: string
}

type PagedResponse = {
  data: TrialRow[]
  page: number
  pageSize: number
  total: number
}

type Aggregates = {
  totalTrials: number
  blockedTrials: number
  topIpRanges: { ipRange: string | null; count: number }[]
  topDeviceFingerprints: { deviceFingerprint: string | null; count: number }[]
}

function AdminTrialEligibilityPage() {
  const [blocked, setBlocked] = useState<string>('')
  const [minRiskScore, setMinRiskScore] = useState<string>('0')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  const [data, setData] = useState<PagedResponse | null>(null)
  const [aggs, setAggs] = useState<Aggregates | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const qs = useMemo(() => {
    const params = new URLSearchParams()
    if (blocked) params.set('blocked', blocked)
    if (minRiskScore && Number(minRiskScore) > 0) params.set('minRiskScore', String(Number(minRiskScore)))
    if (start) params.set('start', start)
    if (end) params.set('end', end)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return params.toString()
  }, [blocked, minRiskScore, start, end, page, pageSize])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const [listRes, aggRes] = await Promise.all([
          fetch(`/api/admin/trial-eligibility?${qs}`),
          fetch(`/api/admin/trial-eligibility/aggregates?${qs}&topN=10`),
        ])
        if (!cancelled) {
          const listJson = await listRes.json()
          const aggJson = await aggRes.json()
          setData(listJson)
          setAggs(aggJson)
        }
      } catch (e) {
        if (!cancelled) {
          setData({ data: [], page: 1, pageSize: 20, total: 0 })
          setAggs({ totalTrials: 0, blockedTrials: 0, topIpRanges: [], topDeviceFingerprints: [] })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [qs])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div style={{ padding: 16 }}>
      <h1>Trial Eligibility</h1>

      <section style={{ marginBottom: 16 }}>
        <h3>Filters</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label>
            Blocked:
            <select value={blocked} onChange={(e) => { setPage(1); setBlocked(e.target.value) }}>
              <option value="">Any</option>
              <option value="true">Only Blocked</option>
              <option value="false">Only Allowed</option>
            </select>
          </label>
          <label>
            Min Risk Score:
            <input type="number" value={minRiskScore} onChange={(e) => { setPage(1); setMinRiskScore(e.target.value) }} style={{ width: 100 }} />
          </label>
          <label>
            Start (ISO):
            <input type="datetime-local" value={start} onChange={(e) => { setPage(1); setStart(e.target.value) }} />
          </label>
          <label>
            End (ISO):
            <input type="datetime-local" value={end} onChange={(e) => { setPage(1); setEnd(e.target.value) }} />
          </label>
          <label>
            Page Size:
            <input type="number" value={pageSize} min={1} max={100} onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value || '20', 10)) }} style={{ width: 80 }} />
          </label>
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>Summary</h3>
        {aggs ? (
          <div>
            <div>Total Trials: {aggs.totalTrials}</div>
            <div>Blocked Trials: {aggs.blockedTrials}</div>
            <div style={{ marginTop: 8 }}>
              <strong>Top IP Ranges</strong>
              <ul>
                {aggs.topIpRanges.map((r, idx) => (
                  <li key={`ip-${idx}`}>{r.ipRange || 'unknown'} — {r.count}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>Top Device Fingerprints</strong>
              <ul>
                {aggs.topDeviceFingerprints.map((r, idx) => (
                  <li key={`fp-${idx}`}>{r.deviceFingerprint || 'null'} — {r.count}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </section>

      <section>
        <h3>Records</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Created At</th>
                <th>Risk</th>
                <th>Blocked</th>
                <th>Reason</th>
                <th>IP Range</th>
                <th>Device FP</th>
                <th>Trial Used At</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTimeRW(row.createdAt, 'en')}</td>
                  <td>{row.riskScore}</td>
                  <td>{row.blocked ? 'Yes' : 'No'}</td>
                  <td>{row.blockReason || ''}</td>
                  <td>{row.ipRange || ''}</td>
                  <td>{row.deviceFingerprint || ''}</td>
                  <td>{row.trialUsedAt ? formatDateTimeRW(row.trialUsedAt, 'en') : ''}</td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={7}>No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </section>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions as any) as any
  const user: any = session?.user
  const roles: string[] = user?.roles || (user?.role ? [user.role] : [])
  if (!session || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/', permanent: false } }
  }
  return { props: {} }
}

export default AdminTrialEligibilityPage
