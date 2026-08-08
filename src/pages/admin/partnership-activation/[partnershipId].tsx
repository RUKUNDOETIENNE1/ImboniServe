import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, User, Loader2, RefreshCw,
  Rocket, FileText, Megaphone, Tag, Package, Bell, Clock, TrendingUp,
} from 'lucide-react'
import StatusBadge from '@/components/partnerships/StatusBadge'
import RiskIndicator from '@/components/partnerships/RiskIndicator'
import Timeline from '@/components/partnerships/Timeline'
import AuditTimeline from '@/components/partnerships/AuditTimeline'
import ActivationChecklist from '@/components/partnerships/ActivationChecklist'
import AgreementCard from '@/components/partnerships/AgreementCard'
import CampaignCard from '@/components/partnerships/CampaignCard'
import CodeCard from '@/components/partnerships/CodeCard'
import HealthWidget from '@/components/partnerships/HealthWidget'
import ProgressCard from '@/components/partnerships/ProgressCard'
import NotificationPanel from '@/components/partnerships/NotificationPanel'
import MarketingKitPanel from '@/components/partnerships/MarketingKitPanel'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: { partnershipId: ctx.params?.partnershipId, userRoles: roles } }
}

interface Props {
  partnershipId: string
  userRoles: string[]
}

export default function ActivationWorkspace({ partnershipId, userRoles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline')
  const [assignedKitItems, setAssignedKitItems] = useState<string[]>([])
  const [sentNotifications, setSentNotifications] = useState<string[]>([])

  const canManage = userRoles.some((r) => ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(r))

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partnership-activation/${partnershipId}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to load workspace')
        return
      }
      const result = await res.json()
      setData(result)

      // Extract kit items from timeline
      const kitActivities = (result.timeline || []).filter(
        (t: any) => t.type === 'activity' && t.activityType === 'MARKETING_KIT_ASSIGNED',
      )
      const kitItems: string[] = kitActivities.flatMap((a: any) => {
        const meta = a.metadata as any
        return (meta?.kitItems as string[]) || []
      })
      setAssignedKitItems([...new Set(kitItems)])

      // Extract sent notifications from timeline
      const notifActivities = (result.timeline || []).filter(
        (t: any) => t.type === 'activity' && t.activityType === 'NOTIFICATION_SENT',
      )
      const notifTypes: string[] = notifActivities.map((a: any) => {
        const meta = a.metadata as any
        return meta?.notificationType as string
      }).filter(Boolean)
      setSentNotifications([...new Set(notifTypes)])
    } catch {
      setError('Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [partnershipId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/partnership-activation/${partnershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || `Failed to ${action}`)
      } else {
        await loadData()
      }
    } catch {
      setError(`Failed to ${action}`)
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Activation Workspace">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading activation workspace...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !data) {
    return (
      <AdminLayout title="Activation Workspace">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={() => router.push('/admin/partnership-applications')}
              className="text-sm text-purple-600 hover:underline"
            >
              Back to Applications
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { partnership, founderPartner, agreements, activeAgreement, campaigns, codes, healthScore, riskProfile, timeline, auditRecords, checklist } = data

  const remainingItems = checklist.items
    .filter((i: any) => !i.completed && i.key !== 'readyToLaunch')
    .map((i: any) => i.label)

  return (
    <AdminLayout title={`Activation: ${partnership?.name || 'Partner'}`}>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/admin/partnership-applications')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {partnership?.status === 'ACTIVE' && (
            <a
              href={`/admin/growth-workspace/${partnershipId}`}
              className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
            >
              <TrendingUp className="w-4 h-4" />
              Growth Workspace
            </a>
          )}
          <button
            onClick={() => loadData()}
            disabled={acting}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${acting ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Top row: Partner Summary + Progress + Health/Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Partner Summary */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{partnership?.name}</h1>
                <p className="text-sm text-slate-500">{partnership?.organization || '—'}</p>
              </div>
              <StatusBadge status={partnership?.status} size="md" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoItem icon={Building2} label="Organization" value={partnership?.organization} />
              <InfoItem icon={User} label="Contact" value={partnership?.name} />
              <InfoItem icon={Mail} label="Email" value={partnership?.email} />
              <InfoItem icon={Phone} label="Phone" value={partnership?.phone} />
              <InfoItem icon={MapPin} label="Region" value={partnership?.region} />
              <InfoItem icon={FileText} label="Partner Type" value={partnership?.partnerType} />
            </div>

            {canManage && partnership?.status === 'ONBOARDED' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleAction('activatePartnership')}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  Activate Partnership
                </button>
              </div>
            )}
          </div>

          {/* Progress + Health */}
          <div className="space-y-4">
            <ProgressCard
              percentage={checklist.percentage}
              completedCount={checklist.completedCount}
              totalCount={checklist.totalCount}
              remainingItems={remainingItems}
            />
            <HealthWidget healthScore={healthScore} />
          </div>
        </div>

        {/* Main grid: Checklist + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Checklist */}
          <div className="space-y-4">
            <ActivationChecklist
              items={checklist.items}
              completedCount={checklist.completedCount}
              totalCount={checklist.totalCount}
              percentage={checklist.percentage}
            />
            <RiskIndicator
              riskLevel={riskProfile?.riskLevel}
              riskScore={riskProfile?.riskScore}
              flags={riskProfile?.flags || []}
            />
          </div>

          {/* Right column: Action cards */}
          <div className="lg:col-span-2 space-y-4">
            <AgreementCard
              agreement={activeAgreement}
              agreements={agreements}
              canManage={canManage}
              onAction={handleAction}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CampaignCard
                campaigns={campaigns}
                canManage={canManage}
                onAction={handleAction}
              />
              <CodeCard
                codes={codes}
                canManage={canManage}
                onAction={handleAction}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MarketingKitPanel
                canManage={canManage}
                onAction={handleAction}
                assignedItems={assignedKitItems}
              />
              <NotificationPanel
                canManage={canManage}
                onAction={handleAction}
                notificationsSent={sentNotifications}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Timeline & Audit tabs */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-5 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Audit Trail
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'timeline' ? (
              <Timeline entries={timeline || []} emptyMessage="No activation events yet" />
            ) : (
              <AuditTimeline entries={auditRecords || []} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="font-medium text-slate-700 truncate">{value || '—'}</p>
    </div>
  )
}
