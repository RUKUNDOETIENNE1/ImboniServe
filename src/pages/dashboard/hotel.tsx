import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Hotel, BedDouble, Plus, X } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  OCCUPIED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
}

type Room = {
  id: string
  roomNumber: string
  floor?: number | null
  guestName?: string | null
  guestPhone?: string | null
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | string
}

export default function HotelPage() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ roomNumber: '', floor: '', guestName: '', guestPhone: '' })
  const [saving, setSaving] = useState(false)
  const hotelEnabled = useFeatureFlag('hotel_mode')

  async function fetchRooms() {
    setLoading(true)
    try {
      const res = await fetch('/api/hotel/rooms')
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchRooms() }, [])

  async function createRoom() {
    if (!form.roomNumber.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, floor: form.floor ? Number(form.floor) : undefined }),
      })
      if (res.ok) { setShowForm(false); setForm({ roomNumber: '', floor: '', guestName: '', guestPhone: '' }); fetchRooms() }
    } catch { } finally { setSaving(false) }
  }

  if (!hotelEnabled) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium" suppressHydrationWarning>{t('hotel.require_business_plan')}</p>
          <p className="text-sm text-slate-400 mt-1" suppressHydrationWarning>{t('hotel.features_description')}</p>
        </div>
      </DashboardLayout>
    )
  }

  const grouped = rooms.reduce((acc: any, r: any) => {
    const floor = r.floor ?? 0
    if (!acc[floor]) acc[floor] = []
    acc[floor].push(r)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Hotel className="w-6 h-6" /> <span suppressHydrationWarning>{t('hotel.title')}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5" suppressHydrationWarning>
            {t('hotel.occupied')
              .replace('{occupied}', String(rooms.filter(r => r.status === 'OCCUPIED').length))
              .replace('{total}', String(rooms.length))}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm hover:bg-primary-700 transition">
          <Plus className="w-4 h-4" /> <span suppressHydrationWarning>{t('hotel.add_room')}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800" suppressHydrationWarning>{t('hotel.add_room')}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('hotel.form.room_number'), key: 'roomNumber', placeholder: '101' },
              { label: t('hotel.form.floor'), key: 'floor', placeholder: '1' },
              { label: t('hotel.form.guest_name'), key: 'guestName', placeholder: t('hotel.form.optional') },
              { label: t('hotel.form.guest_phone'), key: 'guestPhone', placeholder: '+250...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1" suppressHydrationWarning>{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm" suppressHydrationWarning>{t('common.cancel')}</button>
            <button onClick={createRoom} disabled={saving || !form.roomNumber.trim()} className="px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700 transition">
              {saving ? t('common.loading') : t('hotel.add_room')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]: [string, any]) => (
            <div key={floor}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {Number(floor) > 0 ? t('hotel.floor_n').replace('{n}', String(floor)) : t('hotel.ground_floor')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {floorRooms.map((r: Room) => (
                  <div key={r.id} className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${r.status === 'OCCUPIED' ? 'border-blue-300 bg-blue-50' : r.status === 'MAINTENANCE' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-slate-800">{r.roomNumber}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t(`hotel.status.${r.status}`)}
                    </span>
                    {r.guestName && <p className="text-xs text-slate-500 mt-1 truncate">{r.guestName}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600" suppressHydrationWarning>{t('hotel.no_rooms')}</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
