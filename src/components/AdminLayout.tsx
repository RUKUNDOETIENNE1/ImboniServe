import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, Users, Building2, Store, TrendingUp, 
  Settings, Bell, Search, ChevronDown, LogOut, Menu, X,
  DollarSign, FileText, UserCog, RefreshCw, Flag, UserCircle,
  BarChart3, Wallet, Calendar, Mail
} from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Image from 'next/image'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import { useTranslation } from '@/lib/i18n'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Restaurants', href: '/admin/restaurants', icon: Building2 },
    { name: 'Sales Pipeline', href: '/admin/sales-pipeline', icon: TrendingUp },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Contacts', href: '/admin/contacts', icon: UserCircle },
    { name: 'Marketplace', href: '/admin/marketplace', icon: Store },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: DollarSign },
    { name: 'Affiliates', href: '/admin/affiliates', icon: UserCog },
    { name: 'Payout Control', href: '/admin/payout-control', icon: Wallet },
    { name: 'Revenue Analytics', href: '/admin/revenue-analytics', icon: BarChart3 },
    { name: 'Demo Leads', href: '/admin/leads', icon: Calendar },
    { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
    { name: 'Fee Settings', href: '/admin/fee-settings', icon: Settings },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Reconciliation', href: '/admin/reconciliation', icon: RefreshCw },
    { name: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return router.pathname === '/admin'
    }
    return router.pathname.startsWith(href)
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Sidebar - Desktop */}
      <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } hidden lg:block`}>
        <div className="h-full bg-white border-r border-slate-200/60 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <Image 
                src="/imgs/logo1.png" 
                alt="Imboni Serve" 
                width={160}
                height={40}
                className="h-10 w-auto max-h-10"
                priority
              />
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-imboni-blue text-lg">Imboni AI</h2>
                  <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Profile */}
          {sidebarOpen && (
            <div className="p-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                  {session?.user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {session?.user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Platform Admin</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Links */}
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-200/60">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-imboni-blue hover:bg-blue-50 transition-all text-sm"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Restaurant View</span>
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t border-slate-200/60">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              title={!sidebarOpen ? 'Logout' : undefined}
            >
              <LogOut className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} />
              {sidebarOpen && <span className="text-sm font-medium" suppressHydrationWarning>Logout</span>}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          >
            <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white">
            <div className="h-full flex flex-col">
              {/* Mobile Header */}
              <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/imgs/logo1.png" alt="Imboni Serve" width={160} height={40} className="h-10 w-auto max-h-10" />
                  <div>
                    <h2 className="font-bold text-imboni-blue text-lg">Imboni AI</h2>
                    <p className="text-xs text-slate-500">Admin Panel</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Admin Profile */}
              <div className="p-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                    {session?.user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{session?.user?.name || 'Admin'}</p>
                    <p className="text-xs text-purple-600 font-medium">Platform Admin</p>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        active
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Mobile Quick Links */}
              <div className="p-4 border-t border-slate-200/60">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-imboni-blue hover:bg-blue-50 transition-all text-sm"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Restaurant View</span>
                </button>
              </div>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-slate-200/60">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium" suppressHydrationWarning>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
                <div className="relative hidden md:block">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search restaurants, users..." 
                    className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-80"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  title={t('public.footer.cookie_prefs', 'Cookie Preferences')}
                >
                  <Settings className="w-5 h-5 text-slate-600" />
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
    </div>
    <CookieConsentBanner />
    </>
  )
}
