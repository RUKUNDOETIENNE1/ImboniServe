import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/partnerships/StatusBadge'
import MetricCard from '@/components/partnerships/MetricCard'
import EmptyState from '@/components/EmptyState'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  Inbox,
  AlertTriangle,
  UserCog,
} from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: { userRoles: roles } }
}

interface Application {
  id: string
  status: string
  motivation?: string
  experience?: string
  networkSize?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  partnership: {
    id: string
    name: string
    email: string
    phone?: string
    organization?: string
    region?: string
    partnerType: string
    status: string
  }
}

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const
const PAGE_SIZE = 25

export default function PartnershipApplicationsList({ userRoles }: { userRoles: string[] }) {
  const router = useRouter()
  const { status: authStatus } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const canManage = userRoles.some((r) => ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(r))

  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/partnership-applications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      loadApplications()
    }
  }, [authStatus, loadApplications, router])

  const stats = useMemo(() => {
    const submitted = applications.filter((a) => a.status === 'SUBMITTED').length
    const underReview = applications.filter((a) => a.status === 'UNDER_REVIEW').length
    const approved = applications.filter((a) => a.status === 'APPROVED').length
    const rejected = applications.filter((a) => a.status === 'REJECTED').length
    return { submitted, underReview, approved, rejected }
  }, [applications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    loadApplications()
  }

  const handleRowClick = (id: string) => {
    router.push(`/admin/partnership-applications/${id}`)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)))
    }
  }

  const getTimeWaiting = (createdAt: string): string => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffHr = Math.floor((now.getTime() - created.getTime()) / 3600000)
    if (diffHr < 24) return `${diffHr}h`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d`
  }

  const isOverdue = (createdAt: string, status: string): boolean => {
    if (status !== 'SUBMITTED') return false
    const created = new Date(createdAt)
    const now = new Date()
    return (now.getTime() - created.getTime()) > 5 * 24 * 3600000
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout title="Partnership Applications">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Partnership Applications</h1>
            <p className="text-sm text-slate-500 mt-1">Review and manage incoming partnership applications</p>
          </div>
          {canManage && (
            <button
              onClick={() => router.push('/admin/partnership-applications/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              New Application
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Awaiting Review" value={stats.submitted} icon={Clock} accent="amber" />
          <MetricCard label="In Review" value={stats.underReview} icon={UserCog} accent="blue" />
          <MetricCard label="Approved" value={stats.approved} icon={CheckCircle} accent="green" />
          <MetricCard label="Rejected" value={stats.rejected} icon={XCircle} accent="red" />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, organization, email, phone..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Search applications"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s)
                  setPage(0)
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                  statusFilter === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-pressed={statusFilter === s}
              >
                {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No applications found"
              description="There are no partnership applications matching your filters. New applications will appear here automatically."
              actionLabel={canManage ? "Create Application" : undefined}
              actionHref={canManage ? "/admin/partnership-applications/new" : undefined}
            />
          ) : (
            <>
              {/* Bulk actions bar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-purple-50 border-b border-purple-200">
                  <span className="text-sm text-purple-700 font-medium">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex gap-2">
                    {canManage && (
                      <button
                        className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                        onClick={() => {
                          setSelectedIds(new Set())
                        }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-left">
                      <th scope="col" className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === applications.length && applications.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          aria-label="Select all"
                        />
                      </th>
                      <th scope="col" className="py-3 px-4 font-medium text-slate-600">Applicant</th>
                      <th scope="col" className="py-3 px-4 font-medium text-slate-600 hidden md:table-cell">Organization</th>
                      <th scope="col" className="py-3 px-4 font-medium text-slate-600">Status</th>
                      <th scope="col" className="py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">Waiting</th>
                      <th scope="col" className="py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">Reviewer</th>
                      <th scope="col" className="py-3 px-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const overdue = isOverdue(app.createdAt, app.status)
                      return (
                        <tr
                          key={app.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition"
                          onClick={() => handleRowClick(app.id)}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(app.id)}
                              onChange={() => toggleSelect(app.id)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                              aria-label={`Select ${app.partnership.name}`}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-slate-800">{app.partnership.name}</p>
                                <p className="text-xs text-slate-500">{app.partnership.email}</p>
                              </div>
                              {overdue && (
                                <AlertTriangle
                                  className="w-4 h-4 text-red-500 flex-shrink-0"
                                  aria-label="Overdue"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-slate-600">
                            {app.partnership.organization || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                              {getTimeWaiting(app.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-slate-500 text-xs">
                            {app.reviewedBy || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-600">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
