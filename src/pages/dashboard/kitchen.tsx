import { useCallback, useEffect, useRef, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Clock, CheckCircle, Flame, QrCode, UtensilsCrossed, RefreshCw, Wifi, WifiOff, Bell } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useRealtimeMulti } from '@/lib/realtime'
import { useTranslation } from '@/lib/i18n'
import { ManualPaymentConfirmation } from '@/components/ManualPaymentConfirmation'

const ALLOWED_ROLES = new Set(['OWNER', 'KITCHEN_MANAGER', 'CASHIER', 'SUPERVISOR', 'FRONT_DESK', 'ADMIN', 'MANAGER'])

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  const roles: string[] = (session.user as any).roles || []
  if (!roles.some((r) => ALLOWED_ROLES.has(r))) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: { businessId: (session.user as any).businessId || '' } }
}

function useElapsed(since: string | null): string {
  const [label, setLabel] = useState('')
  const timerRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (!since) { setLabel(''); return }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
      if (diff < 60) setLabel(`${diff}s`)
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)}m ${diff % 60}s`)
      else setLabel(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`)
    }
    update()
    timerRef.current = setInterval(update, 1000)
    return () => clearInterval(timerRef.current)
  }, [since])
  return label
}

function OrderCard({ o, action, actionLabel, urgentAfterMinutes = 10, onRefresh }: {
  o: any; action?: (id: string) => void; actionLabel?: string; urgentAfterMinutes?: number; onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const elapsed = useElapsed(o.kitchenReleasedAt || o.createdAt)
  const diffMin = o.kitchenReleasedAt
    ? Math.floor((Date.now() - new Date(o.kitchenReleasedAt).getTime()) / 60000)
    : Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
  const isUrgent = diffMin >= urgentAfterMinutes
  const isAwaitingPayment = o.paymentStatus !== 'PAID' && ['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'OTHER'].includes(o.paymentMethod)

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${isUrgent ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-mono font-bold text-base">{o.orderNumber}</span>
          {o.table?.number && <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">T{o.table.number}</span>}
          {o.participant?.name && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{o.participant.name}</span>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${o.orderSource === 'QR_REMOTE' ? 'bg-blue-100 text-blue-700' : o.orderSource === 'QR_IN_VENUE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
          <QrCode className="inline w-3 h-3 mr-1" />
          {o.orderSource === 'QR_REMOTE' ? t('kitchen.remote', 'Remote') : o.orderSource === 'QR_IN_VENUE' ? t('kitchen.in_venue', 'In-Venue') : t('kitchen.pos', 'POS')}
        </span>
      </div>
      <div className="text-sm text-slate-700 mb-3 space-y-0.5">
        {o.items?.map((it: any, i: number) => (
          <div key={i} className="flex justify-between">
            <span>{it.quantity}× {it.menuItem?.name || t('kitchen.item', 'Item')}</span>
            {it.notes && <span className="text-xs text-orange-600 italic">{it.notes}</span>}
          </div>
        ))}
      </div>
      {o.scheduledAt && (
        <div className="text-xs text-blue-600 mb-2">⏰ ETA {new Date(o.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      )}
      {isAwaitingPayment && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-800 uppercase">⚠️ Awaiting Payment</span>
            <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-medium">
              {o.paymentMethod === 'CASH' ? 'Cash' : o.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN MoMo' : o.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel' : o.paymentMethod}
            </span>
          </div>
          <ManualPaymentConfirmation
            orderId={o.id}
            orderNumber={o.orderNumber}
            paymentMethod={o.paymentMethod}
            amountCents={o.totalCents || 0}
            onSuccess={onRefresh}
          />
        </div>
      )}
      {!isAwaitingPayment && o.paymentStatus === 'PAID' && (
        <div className="mb-2 flex items-center gap-1 text-xs text-green-700">
          <CheckCircle className="w-3 h-3" />
          <span>Paid • {o.paymentMethod === 'CASH' ? 'Cash' : o.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN MoMo' : o.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel' : o.paymentMethod === 'WEB' ? 'Online' : o.paymentMethod}</span>
        </div>
      )}
      <div className={`flex items-center justify-between ${isUrgent ? 'text-red-600' : 'text-slate-500'}`}>
        <span className="text-xs font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />{elapsed}
          {isUrgent && <span className="ml-1 text-xs font-bold animate-pulse">{t('kitchen.urgent', 'URGENT')}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { try { await fetch('/api/kitchen/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: o.id, type: 'PLEASE_WAIT' }) }); } catch {} }}
            title="Notify customer to please wait"
            className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Please wait
          </button>
          <button
            onClick={async () => { try { await fetch('/api/kitchen/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: o.id, type: 'ITEM_UNAVAILABLE' }) }); } catch {} }}
            title="Notify item unavailable"
            className="text-xs px-3 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            Item unavailable
          </button>
          <button
            onClick={async () => { try { await fetch('/api/kitchen/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: o.id, type: 'ALMOST_READY' }) }); } catch {} }}
            title="Notify almost ready"
            className="text-xs px-3 py-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            Almost ready
          </button>
          <button
            onClick={async () => { try { await fetch('/api/kitchen/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: o.id, type: 'READY' }) }); } catch {} }}
            title="Notify ready"
            className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
          >
            Ready
          </button>
          {action && !isAwaitingPayment && (
            <button
              onClick={() => action(o.id)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${isUrgent ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-imboni-blue hover:bg-primary-700 text-white'}`}
            >
              {actionLabel || t('kitchen.action', 'Action')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Column({ title, icon: Icon, items, action, actionLabel, color, onRefresh }: any) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-2 mb-3 px-1 py-2 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
        <h2 className="font-bold text-base">{title}</h2>
        <span className="ml-auto text-sm font-semibold opacity-70">{items.length}</span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {items.map((o: any) => (
          <OrderCard key={o.id} o={o} action={action} actionLabel={actionLabel} onRefresh={onRefresh} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">{t('kitchen.no_orders', 'No orders')}</div>
        )}
      </div>
    </div>
  )
}

export default function KitchenBoard({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [grouped, setGrouped] = useState<Record<string, any[]>>({
    pending: [],
    accepted: [],
    preparing: [],
    almost_ready: [],
    ready: [],
    served: [],
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/kitchen/orders')
      const data = await res.json()
      setGrouped(data.grouped || {
        pending: [],
        accepted: [],
        preparing: [],
        almost_ready: [],
        ready: [],
        served: [],
      })
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function playNewOrderSound() {
    try {
      if (!audioRef.current) return
      // Try to play bundled sound if present
      const soundUrl = '/sounds/new-order.mp3'
      try {
        const head = await fetch(soundUrl, { method: 'HEAD' })
        if (head.ok) {
          if (!audioRef.current.src) audioRef.current.src = soundUrl
          await audioRef.current.play()
          return
        }
      } catch {}
      // If file missing or failed to load, fall through to beep fallback
    } catch (e) {
      // Fallback: generate short beep using Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = 880
        o.connect(g)
        g.connect(ctx.destination)
        g.gain.setValueAtTime(0.0001, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
        o.start()
        o.stop(ctx.currentTime + 0.25)
      } catch {}
    }
  }

  useRealtimeMulti([
    {
      channel: `private-kitchen-${businessId}`,
      event: 'order.created',
      onData: () => { fetchOrders(); playNewOrderSound() },
    },
    { channel: `private-kitchen-${businessId}`, event: 'order.updated', onData: fetchOrders },
    { channel: `private-kitchen-${businessId}`, event: 'order.ready', onData: fetchOrders },
  ])

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    setConnected(Boolean(pusherKey))
  }, [])

  useEffect(() => {
    const id = setInterval(fetchOrders, connected ? 15000 : 5000)
    return () => clearInterval(id)
  }, [fetchOrders, connected])

  async function updateStatus(id: string, newStatus: string) {
    await fetch('/api/kitchen/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, newStatus }),
    })
    fetchOrders()
  }

  const columns = [
    { key: 'pending', title: t('kitchen.pending', 'Pending'), icon: Clock, color: 'bg-amber-50 text-amber-800', action: (id: string) => updateStatus(id, 'accepted'), actionLabel: t('kitchen.accept', 'Accept') },
    { key: 'accepted', title: t('kitchen.accepted', 'Accepted'), icon: Bell, color: 'bg-sky-50 text-sky-800', action: (id: string) => updateStatus(id, 'preparing'), actionLabel: t('kitchen.start_prep', 'Start Prep') },
    { key: 'preparing', title: t('kitchen.preparing', 'Preparing'), icon: Flame, color: 'bg-orange-50 text-orange-800', action: (id: string) => updateStatus(id, 'almost_ready'), actionLabel: t('kitchen.almost_ready', 'Almost Ready') },
    { key: 'almost_ready', title: t('kitchen.almost_ready', 'Almost Ready'), icon: RefreshCw, color: 'bg-indigo-50 text-indigo-800', action: (id: string) => updateStatus(id, 'ready'), actionLabel: t('kitchen.mark_ready', 'Mark Ready') },
    { key: 'ready', title: t('kitchen.ready', 'Ready'), icon: CheckCircle, color: 'bg-green-50 text-green-800', action: (id: string) => updateStatus(id, 'served'), actionLabel: t('kitchen.serve', 'Serve') },
    { key: 'served', title: t('kitchen.served', 'Served'), icon: UtensilsCrossed, color: 'bg-slate-50 text-slate-700' },
  ] as const

  return (
    <DashboardLayout>
      <audio ref={audioRef} preload="none" />
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6" /> {t('kitchen.title', 'Kitchen Display')}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="w-3 h-3" /> {t('kitchen.live', 'Live')}</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-600"><WifiOff className="w-3 h-3" /> {t('kitchen.polling', 'Polling')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchOrders} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {columns.map(col => (
            <Column
              key={col.key}
              title={col.title}
              icon={col.icon}
              items={grouped[col.key] || []}
              action={'action' in col ? col.action : undefined}
              actionLabel={'actionLabel' in col ? col.actionLabel : undefined}
              color={col.color}
              onRefresh={fetchOrders}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
