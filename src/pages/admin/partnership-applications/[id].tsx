import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/partnerships/StatusBadge'
import ApprovalBanner from '@/components/partnerships/ApprovalBanner'
import RiskIndicator from '@/components/partnerships/RiskIndicator'
import Timeline from '@/components/partnerships/Timeline'
import AuditTimeline from '@/components/partnerships/AuditTimeline'
import ConfirmModal from '@/components/ConfirmModal'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  MessageSquare,
  History,
  Shield,
  ChevronRight,
  Rocket,
} from 'lucide-react'
import { useToast } from '@/components/Toast'

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

type Tab = 'overview' | 'timeline' | 'audit'

interface ApplicationDetail {
  id: string
  status: string
  motivation?: string
  experience?: string
  networkSize?: string
  references?: Record<string, unknown> | null
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  partnership: {
    id: string
    name: string
    email: string
    phone?: string
    organization?: string
    region?: string
    partnerType: string
    status: string
    notes?: string
  }
}

interface RiskProfile {
  riskLevel: string
  riskScore: number
  flags: string[]
}

interface HealthScore {
  score: number
  grade: string
  trendDirection?: string
}

export default function ApplicationDetailPage({ userRoles }: { userRoles: string[] }) {
  const router = useRouter()
  const { id } = router.query
  const { status: authStatus } = useSession()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [auditRecords, setAuditRecords] = useState<any[]>([])
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [actionLoading, setActionLoading] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const canManage = userRoles.some((r) => ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(r))
  const canViewAudit = userRoles.some((r) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'LEGAL', 'FINANCE', 'SUPPORT'].includes(r))

  const loadData = useCallback(async () => {
    if (!id || typeof id !== 'string') return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/partnership-applications/${id}`)
      if (res.ok) {
        const data = await res.json()
        setApplication(data.application)
        setTimeline(data.timeline || [])
        setAuditRecords(data.auditRecords || [])
        setRiskProfile(data.riskProfile)
        setHealthScore(data.healthScore)
      } else if (res.status === 404) {
        router.push('/admin/partnership-applications')
      }
    } catch (err) {
      console.error('Failed to load application:', err)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated' && id) {
      loadData()
    }
  }, [authStatus, id, loadData, router])

  const performAction = async (action: string, extra?: Record<string, unknown>) => {
    if (!id || typeof id !== 'string') return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/partnership-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        await loadData()
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Action failed')
      }
    } catch (err) {
      console.error('Action failed:', err)
      showToast('error', 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = () => {
    performAction('approve', { reviewNotes })
    setShowApproveModal(false)
    setReviewNotes('')
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      showToast('warning', 'Rejection reason is required')
      return
    }
    performAction('reject', { reason: rejectReason })
    setShowRejectModal(false)
    setRejectReason('')
  }

  const handleStartReview = () => {
    performAction('review', { reviewNotes: '' })
  }

  const handleAddNote = () => {
    if (!internalNote.trim()) return
    performAction('addNote', { note: internalNote })
    setInternalNote('')
  }

  if (loading) {
    return (
      <AdminLayout title="Application Detail">
        <div className="p-6 space-y-4">
          <Skeleton variant="rectangular" width={200} height={32} />
          <Skeleton variant="rectangular" width="100%" height={120} />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </div>
      </AdminLayout>
    )
  }

  if (!application) {
    return (
      <AdminLayout title="Application Not Found">
        <div className="p-6">
          <p className="text-slate-600">Application not found.</p>
        </div>
      </AdminLayout>
    )
  }

  const isSubmitted = application.status === 'SUBMITTED'
  const isUnderReview = application.status === 'UNDER_REVIEW'
  const isPending = isSubmitted || isUnderReview
  const isApproved = application.status === 'APPROVED'
  const isRejected = application.status === 'REJECTED'
  const isWithdrawn = application.status === 'WITHDRAWN'

  return (
    <AdminLayout title={`Application — ${application.partnership.name}`}>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => router.push('/admin/partnership-applications')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>

        {/* Status Banner */}
        <ApprovalBanner
          status={application.status}
          message={
            isSubmitted
              ? 'This application is awaiting review. Start reviewing to proceed.'
              : isUnderReview
              ? 'Review in progress. Approve or reject to complete.'
              : isApproved
              ? 'Application approved. Partner has been onboarded.'
              : isRejected
              ? `Rejected${application.reviewNotes ? `: ${application.reviewNotes}` : ''}`
              : isWithdrawn
              ? 'Application withdrawn by applicant.'
              : undefined
          }
          actionLabel={isSubmitted && canManage ? 'Start Review' : undefined}
          onAction={isSubmitted && canManage ? handleStartReview : undefined}
        />

        {/* Activation Workspace Link */}
        {isApproved && (
          <div className="flex gap-3 flex-wrap">
            <a
              href={`/admin/partnership-activation/${application.partnership.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
            >
              <Rocket className="w-4 h-4" />
              Go to Activation Workspace
            </a>
          </div>
        )}

        {/* Action Buttons */}
        {canManage && isPending && (
          <div className="flex gap-3 flex-wrap">
            {isSubmitted && (
              <button
                onClick={handleStartReview}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                Start Review
              </button>
            )}
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-4" role="tablist">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'overview'}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              role="tab"
              aria-selected={activeTab === 'timeline'}
            >
              Timeline
            </button>
            {canViewAudit && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                  activeTab === 'audit'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                role="tab"
                aria-selected={activeTab === 'audit'}
              >
                Audit Trail
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Applicant Profile + Application Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applicant Profile */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Applicant Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={User} label="Name" value={application.partnership.name} />
                  <InfoRow icon={Mail} label="Email" value={application.partnership.email} />
                  <InfoRow icon={Phone} label="Phone" value={application.partnership.phone || '—'} />
                  <InfoRow icon={Building} label="Organization" value={application.partnership.organization || '—'} />
                  <InfoRow icon={MapPin} label="Region" value={application.partnership.region || '—'} />
                  <InfoRow icon={FileText} label="Partner Type" value={application.partnership.partnerType} />
                </div>
              </div>

              {/* Application Information */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Application Information</h2>
                <div className="space-y-4">
                  {application.motivation && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Motivation</p>
                      <p className="text-sm text-slate-700">{application.motivation}</p>
                    </div>
                  )}
                  {application.experience && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Experience</p>
                      <p className="text-sm text-slate-700">{application.experience}</p>
                    </div>
                  )}
                  {application.networkSize && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Network Size</p>
                      <p className="text-sm text-slate-700">{application.networkSize}</p>
                    </div>
                  )}
                  {application.references && Object.keys(application.references).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">References</p>
                      <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(application.references, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      Submitted {new Date(application.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              {canManage && (
                <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    Internal Notes
                  </h2>
                  <div className="flex gap-2">
                    <textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Add an internal note visible to your team..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                      aria-label="Internal note"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!internalNote.trim() || actionLoading}
                      className="self-start px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {application.reviewNotes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-medium text-amber-700 mb-1">Review Notes</p>
                      <p className="text-sm text-amber-800">{application.reviewNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Risk + Status + Quick Actions */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Current Status</h3>
                <StatusBadge status={application.status} size="lg" />
                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Submitted</span>
                    <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                  </div>
                  {application.reviewedAt && (
                    <div className="flex justify-between">
                      <span>Reviewed</span>
                      <span>{new Date(application.reviewedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {application.reviewedBy && (
                    <div className="flex justify-between">
                      <span>Reviewer</span>
                      <span className="font-mono">{application.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Summary */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Risk Summary
                </h3>
                <RiskIndicator
                  riskLevel={riskProfile?.riskLevel}
                  riskScore={riskProfile?.riskScore}
                  flags={riskProfile?.flags}
                />
                {!riskProfile && (
                  <p className="text-xs text-slate-500 mt-2">
                    Risk assessment will be generated during onboarding.
                  </p>
                )}
              </div>

              {/* Health Score (if approved) */}
              {healthScore && (
                <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Health Score</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      healthScore.grade === 'A' || healthScore.grade === 'B'
                        ? 'bg-green-100 text-green-700'
                        : healthScore.grade === 'C'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {healthScore.grade}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{healthScore.score}</p>
                      <p className="text-xs text-slate-500">out of 100</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Link to Partnership */}
              {isApproved && (
                <button
                  onClick={() => router.push(`/admin/partnerships/${application.partnership.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition"
                >
                  <span className="text-sm font-medium text-purple-700">View Partnership Profile</span>
                  <ChevronRight className="w-4 h-4 text-purple-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Activity Timeline
            </h2>
            <Timeline entries={timeline} loading={loading} />
          </div>
        )}

        {activeTab === 'audit' && canViewAudit && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-400" />
              Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Read-only record of all status transitions and system actions. Cannot be edited.
            </p>
            <AuditTimeline entries={auditRecords} loading={loading} />
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Application"
        message="This will approve the application and trigger partner onboarding (agreement creation, health/risk profile initialization). This action is auditable."
        confirmText="Approve & Onboard"
        variant="primary"
      />

      {/* Reject Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ display: showRejectModal ? 'flex' : 'none' }}>
        {showRejectModal && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Application</h3>
              <p className="text-slate-600 mb-4 text-sm">
                This will reject the application and terminate the partnership record. This action is auditable and cannot be undone.
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a clear reason for rejection..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                aria-label="Rejection reason"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}
