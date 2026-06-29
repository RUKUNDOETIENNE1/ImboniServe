import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, TrendingUp, Package, Users, Settings, 
  FileText, ShoppingCart, Bell, Search, ChevronDown, 
  LogOut, Menu, X, Home, Sparkles, MapPin, Gift, 
  UtensilsCrossed, BarChart2, Hotel, Flag, Tag, Globe, Receipt, Store, Trophy, Palette, Clock,
  Video, UserPlus, DollarSign, CreditCard, QrCode, MessageSquare, Calendar, ShieldCheck, UserCircle, RotateCcw
} from 'lucide-react'
import OfflineIndicator from './OfflineIndicator'
import PWAInstallPrompt from './PWAInstallPrompt'
import { TopbarQuickActions } from './layout/TopbarQuickActions'
import { useTranslation } from '@/lib/i18n'
import { useTheme } from '@/hooks/useTheme'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { useFeatureFlags } from '@/hooks/useFeatureFlag'
import InstallAppButton from '@/components/InstallAppButton'
import BrandAssistantWidget from '@/components/BrandAssistantWidget'
import SupportChatWidget from '@/components/SupportChatWidget'
import SupportWidget from '@/components/SupportWidget'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import LiveClock from '@/components/LiveClock'

// V1 Navigation Section Configuration
type V1SectionKey = 'OPERATIONS' | 'MENU_INVENTORY' | 'QR_DIGITAL' | 'REPORTS' | 'TEAM' | 'FINANCIAL' | 'SETTINGS' | 'ADMIN'

const V1_SECTIONS: Record<V1SectionKey, { name: string; order: number }> = {
  OPERATIONS: { name: 'Operations', order: 1 },
  MENU_INVENTORY: { name: 'Menu & Inventory', order: 2 },
  QR_DIGITAL: { name: 'QR & Digital', order: 3 },
  REPORTS: { name: 'Reports', order: 4 },
  TEAM: { name: 'Team', order: 5 },
  FINANCIAL: { name: 'Financial', order: 6 },
  SETTINGS: { name: 'Settings', order: 7 },
  ADMIN: { name: 'Admin', order: 8 },
}

// V1 Navigation Item Interface
interface V1NavigationItem {
  name: string
  href?: string
  icon?: any
  i18nKey?: string
  section?: boolean
  rolesAllowed?: string[]
  adminOnly?: boolean
  // V1 Visibility Control
  v1Visible?: boolean
  v1Section?: V1SectionKey
  v1Order?: number
  v1AdminOnly?: boolean
  v1DeveloperOnly?: boolean
  featureFlag?: string
}

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { isInstalled } = usePWAInstall()
  const [showRestoreButton, setShowRestoreButton] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkDismissed = () => {
      const brandDismissed = localStorage.getItem('brand-assistant-dismissed') === 'true'
      const supportDismissed = localStorage.getItem('support-widget-dismissed') === 'true'
      setShowRestoreButton(brandDismissed || supportDismissed)
    }
    checkDismissed()
    window.addEventListener('storage', checkDismissed)
    return () => window.removeEventListener('storage', checkDismissed)
  }, [])

  const handleRestoreWidgets = () => {
    localStorage.removeItem('brand-assistant-dismissed')
    localStorage.removeItem('support-widget-dismissed')
    setShowRestoreButton(false)
    window.location.reload()
  }

  const userRoles = (session?.user as any)?.roles || []
  const isAdmin = userRoles.includes('ADMIN')
  const hasAnyRole = (roles: string[]) => userRoles.some((r: string) => roles.includes(r))

  // Feature flags for conditional navigation
  const enabledFlags = useFeatureFlags()
  const isDeveloper = process.env.NODE_ENV === 'development'

  // V1 Curated Navigation - 22 visible items organized into 7 sections
  const navigation: V1NavigationItem[] = [
    // === OPERATIONS (5 items) ===
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, i18nKey: 'dashboard.nav.dashboard', v1Visible: true, v1Section: 'OPERATIONS', v1Order: 1 },
    { name: 'Orders', href: '/dashboard/orders/unified', icon: ShoppingCart, i18nKey: 'dashboard.nav.orders', v1Visible: true, v1Section: 'OPERATIONS', v1Order: 2 },
    { name: 'Kitchen', href: '/dashboard/kitchen', icon: UtensilsCrossed, i18nKey: 'dashboard.nav.kitchen', v1Visible: true, v1Section: 'OPERATIONS', v1Order: 3 },
    { name: 'Tables', href: '/dashboard/tables', icon: Home, i18nKey: 'dashboard.nav.tables', v1Visible: true, v1Section: 'OPERATIONS', v1Order: 4 },
    { name: 'Reservations', href: '/dashboard/reservations', icon: Calendar, i18nKey: 'dashboard.nav.reservations', v1Visible: true, v1Section: 'OPERATIONS', v1Order: 5 },

    // === MENU & INVENTORY (4 items) ===
    { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed, i18nKey: 'dashboard.nav.menu', v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 1 },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, i18nKey: 'dashboard.nav.inventory', v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 2 },
    { name: 'Inventory Alerts', href: '/dashboard/inventory-alerts', icon: Bell, i18nKey: 'dashboard.nav.inventoryAlerts', v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 3 },
    { name: 'OCR Documents', href: '/dashboard/die', icon: FileText, i18nKey: 'dashboard.nav.ocrDocuments', v1Visible: true, v1Section: 'MENU_INVENTORY', v1Order: 4 },

    // === QR & DIGITAL (2 items) ===
    { name: 'QR Builder', href: '/dashboard/qr-builder', icon: QrCode, i18nKey: 'dashboard.nav.qrBuilder', v1Visible: true, v1Section: 'QR_DIGITAL', v1Order: 1 },
    { name: 'QR Analytics', href: '/dashboard/qr-analytics', icon: QrCode, i18nKey: 'dashboard.nav.qrAnalytics', v1Visible: true, v1Section: 'QR_DIGITAL', v1Order: 2 },

    // === REPORTS (4 items) ===
    { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp, i18nKey: 'dashboard.nav.reports', v1Visible: true, v1Section: 'REPORTS', v1Order: 1 },
    { name: 'Menu Performance', href: '/dashboard/analytics/menu-performance', icon: BarChart2, i18nKey: 'dashboard.nav.menuPerformance', v1Visible: true, v1Section: 'REPORTS', v1Order: 2 },
    { name: 'Peak Hours', href: '/dashboard/analytics/peak-hours', icon: Clock, i18nKey: 'dashboard.nav.peakHours', v1Visible: true, v1Section: 'REPORTS', v1Order: 3 },
    { name: 'Payment Analytics', href: '/dashboard/analytics/payments', icon: DollarSign, i18nKey: 'dashboard.nav.paymentAnalytics', v1Visible: true, v1Section: 'REPORTS', v1Order: 4 },

    // === TEAM (1 item) ===
    { name: 'Staff', href: '/dashboard/staff', icon: Users, i18nKey: 'dashboard.nav.staff', v1Visible: true, v1Section: 'TEAM', v1Order: 1 },

    // === FINANCIAL (3 items) ===
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText, i18nKey: 'dashboard.nav.transactions', v1Visible: true, v1Section: 'FINANCIAL', v1Order: 1 },
    { name: 'Payout Summary', href: '/dashboard/payout-summary', icon: DollarSign, i18nKey: 'dashboard.nav.payoutSummary', v1Visible: true, v1Section: 'FINANCIAL', v1Order: 2 },
    { name: 'Payment Settings', href: '/dashboard/payment-settings', icon: CreditCard, i18nKey: 'dashboard.nav.paymentSettings', v1Visible: true, v1Section: 'FINANCIAL', v1Order: 3 },

    // === SETTINGS (3 items) ===
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, i18nKey: 'dashboard.nav.settings', v1Visible: true, v1Section: 'SETTINGS', v1Order: 1 },
    { name: 'Profile', href: '/dashboard/profile', icon: Globe, i18nKey: 'dashboard.nav.profile', v1Visible: true, v1Section: 'SETTINGS', v1Order: 2 },
    { name: 'Security', href: '/dashboard/security', icon: ShieldCheck, i18nKey: 'dashboard.nav.security', v1Visible: true, v1Section: 'SETTINGS', v1Order: 3 },

    // === ADMIN ONLY (visible only to admins) ===
    { name: 'Payment Monitor', href: '/dashboard/payments/monitor', icon: CreditCard, i18nKey: 'dashboard.nav.paymentMonitor', v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 1 },
    { name: 'Payment Feedback', href: '/dashboard/feedback/payments', icon: MessageSquare, i18nKey: 'dashboard.nav.paymentFeedback', v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 2 },
    { name: 'Support Inbox', href: '/dashboard/support/inbox', icon: MessageSquare, i18nKey: 'dashboard.nav.supportInbox', v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 3 },
    { name: 'Canned Replies', href: '/dashboard/support/canned-replies', icon: MessageSquare, i18nKey: 'dashboard.nav.cannedReplies', v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 4 },
    { name: 'Feature Flags', href: '/dashboard/admin/feature-flags', icon: Flag, i18nKey: 'dashboard.nav.featureFlags', adminOnly: true, v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 5 },
    { name: 'Instruction Insights', href: '/dashboard/analytics/instruction-insights', icon: Sparkles, i18nKey: 'dashboard.nav.instructionInsights', v1AdminOnly: true, v1Section: 'ADMIN', v1Order: 6 },

    // === FEATURE FLAGGED (controlled by database flags) ===
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2, i18nKey: 'dashboard.nav.analytics', featureFlag: 'advanced_analytics' },
    { name: 'Menu Builder', href: '/dashboard/menu-builder', icon: Flag, i18nKey: 'dashboard.nav.menuBuilder', featureFlag: 'ai_menu_builder' },
    { name: 'Loyalty', href: '/dashboard/loyalty', icon: Gift, i18nKey: 'dashboard.nav.loyalty', featureFlag: 'loyalty_system' },
    { name: 'Promotions', href: '/dashboard/promotions', icon: Tag, i18nKey: 'dashboard.nav.promotions', featureFlag: 'promotions_engine' },
    { name: 'Hotel', href: '/dashboard/hotel', icon: Hotel, i18nKey: 'dashboard.nav.hotel', featureFlag: 'hotel_mode' },
    { name: 'Branches', href: '/dashboard/branches', icon: MapPin, i18nKey: 'dashboard.nav.branches', featureFlag: 'multi_branch' },
    { name: 'Outlets', href: '/dashboard/outlets', icon: Store, i18nKey: 'dashboard.nav.outlets', featureFlag: 'multi_branch' },
    { name: 'CRM', href: '/dashboard/crm', icon: Users, i18nKey: 'dashboard.nav.crm', featureFlag: 'crm_v1' },
    { name: 'Contacts', href: '/dashboard/contacts', icon: UserCircle, i18nKey: 'dashboard.nav.contacts', featureFlag: 'crm_v1' },
    { name: 'CMS', href: '/dashboard/cms', icon: FileText, i18nKey: 'dashboard.nav.cms', featureFlag: 'cms_v1' },
    { name: 'Video Analytics', href: '/dashboard/video-analytics', icon: Video, i18nKey: 'dashboard.nav.videoAnalytics', featureFlag: 'cms_v1' },
    { name: 'AI Insights', href: '/dashboard/ai', icon: Sparkles, i18nKey: 'dashboard.nav.aiInsights', featureFlag: 'ai_insights_v1' },
    { name: 'Optimization Hub', href: '/dashboard/optimization', icon: Sparkles, i18nKey: 'dashboard.nav.optimization', featureFlag: 'ai_insights_v1' },

    // === HIDDEN FROM NAV (routes preserved, not in navigation) ===
    // These items are intentionally not shown in navigation but routes remain accessible
    // Sales, KDS, Staff Performance, A/B Testing, Campaigns, Currency Settings,
    // My Referrals, Referrals, Invite & Earn, Smart Dining Slips, Site Builder,
    // Templates, Notifications, etc.
  ]

  // V1 Navigation Filter - returns only items that should be visible
  const getV1Navigation = (): V1NavigationItem[] => {
    return navigation
      .filter(item => {
        // V1 Visible items always show
        if (item.v1Visible) return true
        
        // Admin-only items show for admins
        if (item.v1AdminOnly && isAdmin) return true
        
        // Developer-only items show in dev mode
        if (item.v1DeveloperOnly && isDeveloper) return true
        
        // Feature-flagged items show if flag is enabled
        if (item.featureFlag && enabledFlags.includes(item.featureFlag)) {
          return true
        }
        
        // Everything else is hidden
        return false
      })
      .sort((a, b) => {
        // Sort by section order, then by item order within section
        const sectionA = V1_SECTIONS[a.v1Section as V1SectionKey]?.order || 99
        const sectionB = V1_SECTIONS[b.v1Section as V1SectionKey]?.order || 99
        
        if (sectionA !== sectionB) return sectionA - sectionB
        
        return (a.v1Order || 99) - (b.v1Order || 99)
      })
  }

  // Group navigation by section
  const groupBySection = (items: V1NavigationItem[]): Record<string, V1NavigationItem[]> => {
    const groups: Record<string, V1NavigationItem[]> = {}
    
    items.forEach(item => {
      const section = item.v1Section || 'OTHER'
      if (!groups[section]) groups[section] = []
      groups[section].push(item)
    })
    
    return groups
  }

  // Get filtered and grouped navigation
  const v1Nav = getV1Navigation()
  const groupedNav = groupBySection(v1Nav)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard'
    }
    return router.pathname.startsWith(href)
  }

  const { darkMode } = useTheme()

  return (
    <div className="min-h-screen bg-imboni-light dark:bg-gray-900 transition-colors">
      {/* Sidebar - Desktop */}
      <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } hidden lg:block`}>
        <div className="h-full bg-gradient-to-b from-imboni-blue to-blue-800 dark:from-gray-800 dark:to-gray-900 border-r border-blue-900/30 dark:border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src="/imgs/logo1.png" 
                alt="Imboni Serve" 
                className="h-10 w-auto max-h-10"
              />
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-white text-lg">Imboni Serve</h2>
                  <p className="text-xs text-white/60" suppressHydrationWarning>{t('dashboard.brand.tagline', 'Hospitality Management')}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          {sidebarOpen && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold border border-white/30">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" suppressHydrationWarning>
                    {session?.user?.name || t('dashboard.user.anon', 'User')}
                  </p>
                  <p className="text-xs text-white/60 truncate" suppressHydrationWarning>
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* V1 Sectioned Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {Object.entries(V1_SECTIONS).map(([sectionKey, sectionConfig]) => {
              const sectionItems = groupedNav[sectionKey]
              if (!sectionItems || sectionItems.length === 0) return null
              
              // Don't show ADMIN section header for non-admins
              if (sectionKey === 'ADMIN' && !isAdmin) return null
              
              return (
                <div key={sectionKey} className="mb-4">
                  {/* Section Header */}
                  {sidebarOpen && (
                    <h3 className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${
                      sectionKey === 'ADMIN' ? 'text-orange-300/70' : 'text-white/50'
                    }`}>
                      {sectionConfig.name}
                    </h3>
                  )}
                  
                  {/* Section Items */}
                  {sectionItems.map(item => {
                    if (!item.href) return null
                    
                    const Icon = item.icon
                    const active = isActive(item.href)
                    const classes = [
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      active
                        ? 'bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/30'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                    ].join(' ').trim()

                    return (
                      <button
                        key={item.href}
                        onClick={() => router.push(item.href!)}
                        className={classes}
                        title={!sidebarOpen ? t(item.i18nKey as string, item.name) : undefined}
                      >
                        {Icon && <Icon className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} />}
                        {sidebarOpen && (
                          <span className="text-sm font-medium" suppressHydrationWarning>
                            {t(item.i18nKey as string, item.name)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
              title={!sidebarOpen ? t('dashboard.actions.logout', 'Logout') : undefined}
            >
              <LogOut className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} />
              {sidebarOpen && <span className="text-sm font-medium" suppressHydrationWarning>{t('dashboard.actions.logout', 'Logout')}</span>}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-20 w-6 h-6 bg-white border border-blue-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          >
            <ChevronDown className={`w-4 h-4 text-imboni-blue transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-imboni-blue to-blue-800 dark:from-gray-800 dark:to-gray-900">
            <div className="h-full flex flex-col">
              {/* Mobile Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/imgs/logo1.png" alt="Imboni Serve" className="h-10 w-auto max-h-10" />
                  <div>
                    <h2 className="font-bold text-white text-lg">Imboni Serve</h2>
                    <p className="text-xs text-white/60" suppressHydrationWarning>{t('dashboard.brand.tagline', 'Hospitality Management')}</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile User Profile */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold border border-white/30">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-white/60 truncate">{session?.user?.email || 'user@example.com'}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Install App CTA */}
              <div className="p-4 border-b border-white/10">
                <InstallAppButton
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  label={t('dashboard.cta.install', 'Install App')}
                />
              </div>

              {/* Mobile V1 Sectioned Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {Object.entries(V1_SECTIONS).map(([sectionKey, sectionConfig]) => {
                  const sectionItems = groupedNav[sectionKey]
                  if (!sectionItems || sectionItems.length === 0) return null
                  
                  // Don't show ADMIN section for non-admins
                  if (sectionKey === 'ADMIN' && !isAdmin) return null
                  
                  return (
                    <div key={`m-${sectionKey}`} className="mb-4">
                      {/* Section Header */}
                      <h3 className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${
                        sectionKey === 'ADMIN' ? 'text-orange-300/70' : 'text-white/50'
                      }`}>
                        {sectionConfig.name}
                      </h3>
                      
                      {/* Section Items */}
                      {sectionItems.map(item => {
                        if (!item.href) return null
                        
                        const Icon = item.icon
                        const active = isActive(item.href)
                        const classes = [
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                          active
                            ? 'bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/30'
                            : 'text-white/70 hover:bg-white/10 hover:text-white',
                        ].join(' ').trim()

                        return (
                          <button
                            key={item.href}
                            onClick={() => {
                              router.push(item.href!)
                              setMobileMenuOpen(false)
                            }}
                            className={classes}
                          >
                            {Icon && <Icon className="w-5 h-5" />}
                            <span className="text-sm font-medium" suppressHydrationWarning>
                              {t(item.i18nKey as string, item.name)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium" suppressHydrationWarning>{t('dashboard.actions.logout', 'Logout')}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-slate-200/60 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-slate-600 dark:text-gray-300" />
                </button>
                <div className="relative hidden md:block">
                  <Search className="w-5 h-5 text-slate-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder={t('dashboard.actions.searchPlaceholder', 'Search...')} 
                    suppressHydrationWarning
                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 w-64 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LiveClock showDate={false} />
                <LanguageSwitcher />
                {isInstalled && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    {t('dashboard.cta.installed', 'Installed')}
                  </span>
                )}
                <InstallAppButton className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs" label={t('dashboard.cta.install', 'Install App')} />
                <TopbarQuickActions />
                <button
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                  className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={t('public.footer.cookie_prefs', 'Cookie Preferences')}
                >
                  <Settings className="w-5 h-5 text-slate-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs"
                  title={t('public.footer.cookie_prefs', 'Cookie Preferences')}
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('public.footer.cookie_prefs', 'Cookie Preferences')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* AI Brand Assistant */}
      <BrandAssistantWidget />

      {/* Support Chat (Crisp) */}
      <SupportWidget />
      <SupportChatWidget />
      <CookieConsentBanner />

      {/* Restore dismissed widgets */}
      {isMounted && showRestoreButton && (
        <button
          onClick={handleRestoreWidgets}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gray-800 dark:bg-gray-700 text-white shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          title="Restore support and AI assistant widgets"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Restore Widgets</span>
        </button>
      )}
    </div>
  )
}
