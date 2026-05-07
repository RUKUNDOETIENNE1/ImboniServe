import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Globe, Eye, EyeOff, Save, ExternalLink } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const CUISINE_TYPES = ['African', 'Chinese', 'Indian', 'Italian', 'Local Rwandan', 'Fast Food', 'Seafood', 'Vegetarian', 'BBQ & Grill', 'Cafe & Bakery', 'Pizza', 'Sushi', 'Bar & Lounge']

export default function DiscoveryProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any>({ tagline: '', description: '', cuisineTypes: [], priceRange: '', isPublished: false, seoTitle: '', seoDescription: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const discoveryEnabled = useFeatureFlag('discovery_marketplace')

  useEffect(() => {
    fetch('/api/discover/profile')
      .then(r => r.json())
      .then(d => { if (d?.id) setProfile(d) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/discover/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) setMessage({ text: t('profile.profile_saved'), type: 'success' })
      else setMessage({ text: t('profile.failed_to_save'), type: 'error' })
    } catch { setMessage({ text: t('profile.network_error'), type: 'error' }) } finally { setSaving(false) }
  }

  function toggleCuisine(c: string) {
    setProfile((p: any) => ({
      ...p,
      cuisineTypes: p.cuisineTypes.includes(c) ? p.cuisineTypes.filter((x: string) => x !== c) : [...p.cuisineTypes, c].slice(0, 5),
    }))
  }

  if (!discoveryEnabled) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium" suppressHydrationWarning>{t('profile.unlock_message')}</p>
          <p className="text-sm text-slate-400 mt-1" suppressHydrationWarning>{t('profile.unlock_desc')}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-500" /> <span suppressHydrationWarning>{t('profile.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5" suppressHydrationWarning>{t('profile.subtitle')}</p>
          </div>
          {profile.slug && (
            <a href={`/discover/${profile.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <ExternalLink className="w-4 h-4" /> <span suppressHydrationWarning>{t('profile.view_public_page')}</span>
            </a>
          )}
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800" suppressHydrationWarning>{t('profile.visibility')}</h2>
              <button
                onClick={() => setProfile((p: any) => ({ ...p, isPublished: !p.isPublished }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${profile.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {profile.isPublished ? <><Eye className="w-4 h-4" /> <span suppressHydrationWarning>{t('profile.published')}</span></> : <><EyeOff className="w-4 h-4" /> <span suppressHydrationWarning>{t('profile.draft')}</span></>}
              </button>
            </div>
            <p className="text-xs text-slate-400" suppressHydrationWarning>{profile.isPublished ? t('profile.profile_visible') : t('profile.profile_hidden')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800" suppressHydrationWarning>{t('profile.profile_info')}</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('profile.tagline')}</label>
              <input value={profile.tagline || ''} onChange={e => setProfile((p: any) => ({ ...p, tagline: e.target.value }))}
                maxLength={120} placeholder={t('profile.tagline_placeholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('profile.description')}</label>
              <textarea value={profile.description || ''} onChange={e => setProfile((p: any) => ({ ...p, description: e.target.value }))}
                rows={3} placeholder={t('profile.description_placeholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2" suppressHydrationWarning>{t('profile.cuisine_types')}</label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TYPES.map(c => (
                  <button key={c} onClick={() => toggleCuisine(c)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${profile.cuisineTypes?.includes(c) ? 'bg-imboni-blue text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('profile.price_range')}</label>
              <div className="flex gap-2">
                {['$', '$$', '$$$', '$$$$'].map(p => (
                  <button key={p} onClick={() => setProfile((pr: any) => ({ ...pr, priceRange: p }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${profile.priceRange === p ? 'bg-imboni-blue text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800" suppressHydrationWarning>{t('profile.seo_optional')}</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('profile.seo_title')}</label>
              <input value={profile.seoTitle || ''} onChange={e => setProfile((p: any) => ({ ...p, seoTitle: e.target.value }))}
                maxLength={60} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('profile.seo_description')}</label>
              <input value={profile.seoDescription || ''} onChange={e => setProfile((p: any) => ({ ...p, seoDescription: e.target.value }))}
                maxLength={160} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-imboni-blue text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700 transition">
              <Save className="w-4 h-4" /><span suppressHydrationWarning>{saving ? t('profile.saving') : t('profile.save_profile')}</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
