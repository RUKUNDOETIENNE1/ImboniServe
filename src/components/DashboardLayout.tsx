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
import InstallAppButton from '@/components/InstallAppButton'
import BrandAssistantWidget from '@/components/BrandAssistantWidget'
import SupportChatWidget from '@/components/SupportChatWidget'
import SupportWidget from '@/components/SupportWidget'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import LiveClock from '@/components/LiveClock'

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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, i18nKey: 'dashboard.nav.dashboard' },
    { name: 'Unified Orders', href: '/dashboard/orders/unified', icon: ShoppingCart, i18nKey: 'dashboard.nav.unifiedOrders' },
    { name: 'Sales', href: '/dashboard/sales', icon: Receipt, i18nKey: 'dashboard.nav.sales' },
    { name: 'Kitchen', href: '/dashboard/kitchen', icon: UtensilsCrossed, i18nKey: 'dashboard.nav.kitchen' },
    { name: 'Tables & Seats', href: '/dashboard/tables', icon: Home, i18nKey: 'dashboard.nav.tablesSeats' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, i18nKey: 'dashboard.nav.inventory' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2, i18nKey: 'dashboard.nav.analytics' },
    { name: 'QR Analytics', href: '/dashboard/qr-analytics', icon: QrCode, i18nKey: 'dashboard.nav.qrAnalytics' },
    { name: 'Menu Performance', href: '/dashboard/analytics/menu-performance', icon: UtensilsCrossed, i18nKey: 'dashboard.nav.menuPerformance' },
    { name: 'Peak Hours', href: '/dashboard/analytics/peak-hours', icon: Clock, i18nKey: 'dashboard.nav.peakHours' },
    { name: 'Instruction Insights', href: '/dashboard/analytics/instruction-insights', icon: Sparkles, i18nKey: 'dashboard.nav.instructionInsights' },
    // Payments Section
    { name: 'Payments', section: true, i18nKey: 'dashboard.nav.payments' },
    { name: 'Payment Analytics', href: '/dashboard/analytics/payments', icon: DollarSign, rolesAllowed: ['OWNER','MANAGER','ADMIN'], i18nKey: 'dashboard.nav.paymentAnalytics' },
    { name: 'Payment Monitor', href: '/dashboard/payments/monitor', icon: CreditCard, rolesAllowed: ['OWNER','MANAGER','ADMIN'], i18nKey: 'dashboard.nav.paymentMonitor' },
    { name: 'Payment Feedback', href: '/dashboard/feedback/payments', icon: MessageSquare, rolesAllowed: ['OWNER','MANAGER','ADMIN'], i18nKey: 'dashboard.nav.paymentFeedback' },
    { name: 'AI Insights', href: '/dashboard/ai', icon: Sparkles, i18nKey: 'dashboard.nav.aiInsights' },
    { name: 'Optimization Hub', href: '/dashboard/optimization', icon: Sparkles, i18nKey: 'dashboard.nav.optimization' },
    { name: 'Menu Builder', href: '/dashboard/menu-builder', icon: Flag, i18nKey: 'dashboard.nav.menuBuilder' },
    { name: 'QR Builder', href: '/dashboard/qr-builder', icon: QrCode, i18nKey: 'dashboard.nav.qrBuilder' },
    { name: 'Site Builder', href: '/dashboard/site-builder', icon: Palette, i18nKey: 'dashboard.nav.siteBuilder' },
    { name: 'Templates', href: '/dashboard/templates', icon: Flag, i18nKey: 'dashboard.nav.templates' },
    { name: 'Content (CMS)', href: '/dashboard/cms', icon: FileText, i18nKey: 'dashboard.nav.content' },
    { name: 'Video Analytics', href: '/dashboard/video-analytics', icon: Video, i18nKey: 'dashboard.nav.videoAnalytics' },
    { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp, i18nKey: 'dashboard.nav.reports' },
    { name: 'Customer CRM', href: '/dashboard/crm', icon: Users, i18nKey: 'dashboard.nav.crm' },
    { name: 'Contacts', href: '/dashboard/contacts', icon: UserCircle, i18nKey: 'cms.contacts' },
    { name: 'Staff', href: '/dashboard/staff', icon: Users, i18nKey: 'dashboard.nav.staff' },
    { name: 'Staff Performance', href: '/dashboard/staff-performance', icon: TrendingUp, i18nKey: 'dashboard.nav.staffPerformance' },
    { name: 'Reservations', href: '/dashboard/reservations', icon: Calendar, i18nKey: 'dashboard.nav.reservations' },
    { name: 'Inventory Alerts', href: '/dashboard/inventory-alerts', icon: Bell, i18nKey: 'dashboard.nav.inventoryAlerts' },
    { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: Sparkles, i18nKey: 'dashboard.nav.abTesting' },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: MessageSquare, i18nKey: 'dashboard.nav.campaigns' },
    { name: 'Currency Settings', href: '/dashboard/currency-settings', icon: DollarSign, i18nKey: 'dashboard.nav.currencySettings' },
    { name: 'Branches', href: '/dashboard/branches', icon: MapPin, i18nKey: 'dashboard.nav.branches' },
    { name: 'Outlets', href: '/dashboard/outlets', icon: Store, i18nKey: 'dashboard.nav.outlets' },
    { name: 'My Referrals', href: '/dashboard/my-referrals', icon: Gift, i18nKey: 'dashboard.nav.myReferrals' },
    { name: 'Referrals', href: '/dashboard/referrals', icon: Trophy, i18nKey: 'dashboard.nav.referrals' },
    { name: 'Invite & Earn', href: '/dashboard/invite', icon: UserPlus, i18nKey: 'dashboard.nav.invite' },
    { name: 'Loyalty', href: '/dashboard/loyalty', icon: Gift, i18nKey: 'dashboard.nav.loyalty' },
    { name: 'Promotions', href: '/dashboard/promotions', icon: Tag, i18nKey: 'dashboard.nav.promotions' },
    { name: 'Hotel', href: '/dashboard/hotel', icon: Hotel, i18nKey: 'dashboard.nav.hotel' },
    { name: 'Smart Dining Slips', href: '/dashboard/smart-dining-slips', icon: Receipt, i18nKey: 'dashboard.nav.smartDiningSlips' },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText, i18nKey: 'dashboard.nav.transactions' },
    { name: 'Payout Summary', href: '/dashboard/payout-summary', icon: DollarSign, i18nKey: 'dashboard.nav.payoutSummary' },
    { name: 'Payment Settings', href: '/dashboard/payment-settings', icon: CreditCard, i18nKey: 'dashboard.nav.paymentSettings' },
    { name: 'Discovery Profile', href: '/dashboard/profile', icon: Globe, i18nKey: 'dashboard.nav.discoveryProfile' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, i18nKey: 'dashboard.nav.notifications' },
    { name: 'Support Inbox', href: '/dashboard/support/inbox', icon: MessageSquare, rolesAllowed: ['ADMIN','MANAGER'], i18nKey: 'dashboard.nav.supportInbox' },
    { name: 'Canned Replies', href: '/dashboard/support/canned-replies', icon: MessageSquare, rolesAllowed: ['ADMIN','MANAGER'], i18nKey: 'dashboard.nav.cannedReplies' },
    { name: 'Security', href: '/dashboard/security', icon: ShieldCheck, i18nKey: 'dashboard.nav.security' },
    { name: 'Feature Flags', href: '/dashboard/admin/feature-flags', icon: Flag, adminOnly: true as const, i18nKey: 'dashboard.nav.featureFlags' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, i18nKey: 'dashboard.nav.settings' },
  ]

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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if ((item as any).section) {
                return (
                  <div
                    key={`section-${item.name}`}
                    className={`px-3 ${sidebarOpen ? 'pt-4 pb-1' : 'py-2'} text-xs font-semibold text-white/50 uppercase tracking-wide`}
                    suppressHydrationWarning
                  >
                    {t((item as any).i18nKey as string, item.name)}
                  </div>
                )
              }

              const Icon = (item as any).icon
              const active = isActive((item as any).href)
              const hidden = ((item as any).adminOnly && !isAdmin) ||
                (((item as any).rolesAllowed) && !hasAnyRole((item as any).rolesAllowed as string[]))
              const classes = [
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                hidden ? 'hidden' : '',
                active
                  ? 'bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ').trim()

              return (
                <button
                  key={(item as any).href}
                  onClick={() => router.push((item as any).href)}
                  className={classes}
                  title={!sidebarOpen ? t((item as any).i18nKey as string, (item as any).name) : undefined}
                >
                  <Icon className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium" suppressHydrationWarning>{t((item as any).i18nKey as string, (item as any).name)}</span>
                  )}
                </button>
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

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  if ((item as any).section) {
                    return (
                      <div
                        key={`m-section-${item.name}`}
                        className="px-3 pt-4 pb-1 text-xs font-semibold text-white/50 uppercase tracking-wide"
                        suppressHydrationWarning
                      >
                        {t((item as any).i18nKey as string, item.name)}
                      </div>
                    )
                  }

                  const Icon = (item as any).icon
                  const active = isActive((item as any).href)
                  const hidden = ((item as any).adminOnly && !isAdmin) ||
                    (((item as any).rolesAllowed) && !hasAnyRole((item as any).rolesAllowed as string[]))
                  const classes = [
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    hidden ? 'hidden' : '',
                    active
                      ? 'bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ').trim()

                  return (
                    <button
                      key={(item as any).name}
                      onClick={() => {
                        router.push((item as any).href)
                        setMobileMenuOpen(false)
                      }}
                      className={classes}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium" suppressHydrationWarning>{t((item as any).i18nKey as string, (item as any).name)}</span>
                    </button>
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
