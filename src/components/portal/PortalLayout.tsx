/**
 * PortalLayout — Shared layout for the Founder Success Portal.
 * Clean, motivating, partner-facing navigation.
 */

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import {
  Home, TrendingUp, Megaphone, Tag, Building2, Wallet,
  BookOpen, Download, Mail, LifeBuoy, User, LogOut, Menu, X, Bell,
} from 'lucide-react'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface PortalLayoutProps {
  children: ReactNode
  title?: string
}

const navigation = [
  { name: 'Home', href: '/portal', icon: Home },
  { name: 'My Growth', href: '/portal/growth', icon: TrendingUp },
  { name: 'My Campaigns', href: '/portal/campaigns', icon: Megaphone },
  { name: 'My Founder Codes', href: '/portal/codes', icon: Tag },
  { name: 'My Businesses', href: '/portal/businesses', icon: Building2 },
  { name: 'My Earnings', href: '/portal/earnings', icon: Wallet },
  { name: 'Learning Center', href: '/portal/learning', icon: BookOpen },
  { name: 'Marketing Resources', href: '/portal/resources', icon: Download },
  { name: 'Messages', href: '/portal/messages', icon: Mail },
  { name: 'Support', href: '/portal/support', icon: LifeBuoy },
  { name: 'Profile', href: '/portal/profile', icon: User },
]

export default function PortalLayout({ children }: PortalLayoutProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/portal') return router.pathname === '/portal'
    return router.pathname.startsWith(href)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30">
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
                    <h2 className="font-bold text-emerald-700 text-lg">ImboniServe</h2>
                    <p className="text-xs text-slate-500">Founder Portal</p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Profile */}
            {sidebarOpen && (
              <div className="p-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                    {session?.user?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {session?.user?.name || 'Partner'}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">Founder Partner</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Portal navigation">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} aria-hidden="true" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </button>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-200/60">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                title={!sidebarOpen ? 'Logout' : undefined}
              >
                <LogOut className={`w-5 h-5 ${sidebarOpen ? '' : 'mx-auto'}`} aria-hidden="true" />
                {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
              </button>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              aria-label="Toggle sidebar"
            >
              <span className="text-xs text-slate-500">{sidebarOpen ? '◀' : '▶'}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/imgs/logo1.png" alt="Imboni Serve" width={120} height={30} className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <nav className="p-4 space-y-1" aria-label="Mobile navigation">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.name}
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        active ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <div className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-slate-200/60 bg-white/50">
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button className="relative p-2 rounded-lg hover:bg-slate-100" aria-label="Notifications">
                <Bell className="w-5 h-5 text-slate-600" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
