import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Palette, Sparkles, Globe, Eye, Save, Wand2, Type, Layout } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { GetServerSideProps } from 'next'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type Template = {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  features: string[]
}

type SiteConfig = {
  templateId: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  logo?: string
  coverImage?: string
  sections: {
    hero: boolean
    menu: boolean
    about: boolean
    gallery: boolean
    contact: boolean
    reviews: boolean
  }
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Poppins', label: 'Poppins (Friendly)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Lora', label: 'Lora (Classic)' }
]

export default function SiteBuilderPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<'templates' | 'branding' | 'content' | 'publish'>('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [config, setConfig] = useState<SiteConfig>({
    templateId: '',
    colors: {
      primary: '#3b82f6',
      secondary: '#f97316',
      accent: '#10b981'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    },
    sections: {
      hero: true,
      menu: true,
      about: true,
      gallery: false,
      contact: true,
      reviews: false
    }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')

  useEffect(() => {
    fetchTemplates()
    fetchConfig()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/site-builder/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchConfig() {
    try {
      const res = await fetch('/api/site-builder/config')
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setConfig(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  async function saveConfig() {
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/site-builder/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (res.ok) {
        setMessage({ text: t('dashboard.site_builder.config_saved'), type: 'success' })
      } else {
        setMessage({ text: t('dashboard.site_builder.failed_to_save'), type: 'error' })
      }
    } catch {
      setMessage({ text: t('errors.network'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function publishSite() {
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/site-builder/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })
      if (res.ok) {
        setMessage({ text: t('dashboard.site_builder.site_published_success'), type: 'success' })
      } else {
        setMessage({ text: t('dashboard.site_builder.failed_to_publish'), type: 'error' })
      }
    } catch {
      setMessage({ text: t('errors.network'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function generateAIContent(type: string, params: any) {
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/site-builder/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...params })
      })
      if (res.ok) {
        const data = await res.json()
        setAiResult(data.data.text)
      } else {
        setMessage({ text: t('dashboard.site_builder.ai_generation_failed'), type: 'error' })
      }
    } catch {
      setMessage({ text: t('dashboard.site_builder.ai_service_unavailable'), type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  const categories = ['All', 'Restaurant', 'Café', 'Bar', 'Hotel', 'Specialty']
  const categoryKeyMap: Record<string, string> = { All: 'all', Restaurant: 'restaurant', 'Café': 'cafe', Bar: 'bar', Hotel: 'hotel', Specialty: 'specialty' }
  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const topTemplates = ['restaurant-casual', 'cafe-modern', 'bar-upscale', 'hotel-boutique']

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-6 h-6 text-imboni-blue" />
              <span suppressHydrationWarning>{t('dashboard.site_builder.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('dashboard.site_builder.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span suppressHydrationWarning>{saving ? t('dashboard.site_builder.saving') : t('dashboard.site_builder.save_draft')}</span>
            </button>
            <button
              onClick={publishSite}
              disabled={saving || !config.templateId}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span suppressHydrationWarning>{t('dashboard.site_builder.publish')}</span>
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Step Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'templates', label: t('dashboard.site_builder.templates'), icon: Layout },
          { key: 'branding', label: t('dashboard.site_builder.branding'), icon: Palette },
          { key: 'content', label: t('dashboard.site_builder.content'), icon: Type },
          { key: 'publish', label: t('dashboard.site_builder.publish'), icon: Globe }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStep(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              step === key
                ? 'bg-imboni-blue text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span suppressHydrationWarning>{label}</span>
          </button>
        ))}
      </div>

      {/* Templates Step */}
      {step === 'templates' && (
        <div>
          {/* Templates Hero Banner */}
          <div className="bg-gradient-to-br from-imboni-blue via-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold" suppressHydrationWarning>{t('dashboard.site_builder.templates_hero_title')}</h2>
                  <p className="text-blue-100 mt-1" suppressHydrationWarning>{t('dashboard.site_builder.templates_hero_subtitle')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl mb-2">🎨</div>
                  <h4 className="font-semibold mb-1" suppressHydrationWarning>{t('dashboard.site_builder.benefit_beautiful_designs')}</h4>
                  <p className="text-sm text-blue-100" suppressHydrationWarning>{t('dashboard.site_builder.benefit_beautiful_desc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-semibold mb-1" suppressHydrationWarning>{t('dashboard.site_builder.benefit_quick_setup')}</h4>
                  <p className="text-sm text-blue-100" suppressHydrationWarning>{t('dashboard.site_builder.benefit_quick_desc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl mb-2">📱</div>
                  <h4 className="font-semibold mb-1" suppressHydrationWarning>{t('dashboard.site_builder.benefit_mobile_ready')}</h4>
                  <p className="text-sm text-blue-100" suppressHydrationWarning>{t('dashboard.site_builder.benefit_mobile_desc')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-imboni-blue" />
                <span suppressHydrationWarning>{t('dashboard.site_builder.choose_template')}</span>
              </CardTitle>
              <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.choose_template_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-imboni-blue text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span suppressHydrationWarning>{cat === 'All' ? t('common.all') : t(`dashboard.site_builder.categories.${categoryKeyMap[cat] || cat.toLowerCase()}`)}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                        config.templateId === template.id
                          ? 'border-imboni-blue ring-2 ring-imboni-blue/20'
                          : 'border-slate-200'
                      }`}
                      onClick={() => {
                        setConfig({ ...config, templateId: template.id })
                        setStep('branding')
                      }}
                    >
                      <div className="relative group">
                        <div className="h-48 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                          <span className="text-6xl group-hover:scale-110 transition-transform">🎨</span>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {topTemplates.includes(template.id) && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-imboni-orange to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                              ⭐ <span suppressHydrationWarning>{t('dashboard.site_builder.popular')}</span>
                            </div>
                          )}
                          {config.templateId === template.id && (
                            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
                              ✓ <span suppressHydrationWarning>{t('dashboard.site_builder.selected')}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-imboni-blue rounded-xl transition-all pointer-events-none"></div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-slate-800 text-base">{template.name}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">{template.category}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <span key={idx} className="text-xs bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 px-2 py-1 rounded border border-slate-200">
                              ✓ {feature}
                            </span>
                          ))}
                        </div>
                        <button className="w-full py-2 bg-imboni-blue text-white rounded-lg font-medium hover:bg-imboni-blue/90 transition-colors text-sm">
                          <span suppressHydrationWarning>{t('dashboard.site_builder.use_template_cta')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branding Step */}
      {step === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.colors')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.colors_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'primary', label: t('dashboard.site_builder.primary_color'), desc: t('dashboard.site_builder.primary_desc') },
                  { key: 'secondary', label: t('dashboard.site_builder.secondary_color'), desc: t('dashboard.site_builder.secondary_desc') },
                  { key: 'accent', label: t('dashboard.site_builder.accent_color'), desc: t('dashboard.site_builder.accent_desc') }
                ].map(({ key, label, desc }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.colors[key as keyof typeof config.colors]}
                        onChange={(e) => setConfig({
                          ...config,
                          colors: { ...config.colors, [key]: e.target.value }
                        })}
                        className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.colors[key as keyof typeof config.colors]}
                        onChange={(e) => setConfig({
                          ...config,
                          colors: { ...config.colors, [key]: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.typography')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.choose_fonts')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('dashboard.site_builder.heading_font')}</label>
                  <select
                    value={config.fonts.heading}
                    onChange={(e) => setConfig({
                      ...config,
                      fonts: { ...config.fonts, heading: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('dashboard.site_builder.body_font')}</label>
                  <select
                    value={config.fonts.body}
                    onChange={(e) => setConfig({
                      ...config,
                      fonts: { ...config.fonts, body: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.ai_assistant')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.ai_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() => generateAIContent('tagline', { businessName: 'Your Business', businessType: 'Restaurant' })}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  <span suppressHydrationWarning>{aiLoading ? t('dashboard.site_builder.generating') : t('dashboard.site_builder.generate_tagline')}</span>
                </button>
                {aiResult && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm text-slate-700">{aiResult}</p>
                  </div>
                )}
                <p className="text-xs text-slate-500" suppressHydrationWarning>{t('dashboard.site_builder.cost_note')}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.live_preview')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.preview_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    className="h-64 flex items-center justify-center"
                    style={{ backgroundColor: config.colors.primary }}
                  >
                    <div className="text-center text-white">
                      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: config.fonts.heading }} suppressHydrationWarning>
                        {t('dashboard.site_builder.your_business_name')}
                      </h1>
                      <p className="text-lg opacity-90" style={{ fontFamily: config.fonts.body }} suppressHydrationWarning>
                        {t('dashboard.site_builder.welcome_to_site')}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.primary }}></div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.secondary }}></div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.accent }}></div>
                    </div>
                    <p className="text-sm text-slate-600" style={{ fontFamily: config.fonts.body }} suppressHydrationWarning>
                      {t('dashboard.site_builder.preview_text')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      {t('dashboard.site_builder.powered_by')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Content Step */}
      {step === 'content' && (
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.content_sections')}</CardTitle>
            <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.content_sections_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.sections).map(([key, enabled]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    enabled ? 'border-imboni-blue bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      sections: { ...config.sections, [key]: e.target.checked }
                    })}
                    className="w-5 h-5 text-imboni-blue rounded"
                  />
                  <div>
                    <p className="font-medium text-slate-800" suppressHydrationWarning>{t(`dashboard.site_builder.sections.${key}.title`)}</p>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      {t(`dashboard.site_builder.sections.${key}.desc`)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Step */}
      {step === 'publish' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.publish_title')}</CardTitle>
              <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.publish_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-slate-700 mb-2">
                  <strong suppressHydrationWarning>{t('dashboard.site_builder.will_be_published_at')}</strong>
                </p>
                <p className="text-sm font-mono text-imboni-blue">
                  https://yourbusiness.imboni.serve/site
                </p>
              </div>
              <button
                onClick={publishSite}
                disabled={saving || !config.templateId}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Globe className="w-5 h-5" />
                <span suppressHydrationWarning>{saving ? t('dashboard.site_builder.publishing') : t('dashboard.site_builder.publish_now')}</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>{t('dashboard.site_builder.custom_domain_optional')}</CardTitle>
              <CardDescription suppressHydrationWarning>{t('dashboard.site_builder.custom_domain_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 mb-4" suppressHydrationWarning>
                {t('dashboard.site_builder.use_own_domain')}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('dashboard.site_builder.domain_name')}</label>
                  <input
                    type="text"
                    placeholder="www.yourbusiness.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-imboni-orange to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                  <span suppressHydrationWarning>{t('dashboard.site_builder.request_domain')}</span>
                </button>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong suppressHydrationWarning>{t('dashboard.site_builder.note')}</strong> <span suppressHydrationWarning>{t('dashboard.site_builder.note_text')}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
