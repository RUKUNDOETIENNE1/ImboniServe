import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Users, Building2, Network, Activity, Filter, Search, Plus,
  Phone, Mail, MessageSquare, Eye, Edit, Trash2, Download,
  UserPlus, Tag, TrendingUp, AlertCircle, CheckCircle, Upload
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Link from 'next/link'

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  type: string
  status: string
  role?: string
  jobTitle?: string
  city?: string
  tags: string[]
  activityScore: number
  lastActivityAt?: string
  createdAt: string
  organizationMemberships?: Array<{
    organization: {
      id: string
      name: string
      type: string
    }
    role?: string
    isPrimary: boolean
  }>
}

interface ContactStats {
  totalContacts: number
  activeContacts: number
  inactiveContacts: number
  leads: number
  typeBreakdown: Record<string, number>
  recentActivities: number
}

export default function ContactsPage() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchContacts()
    fetchStats()
  }, [selectedType, selectedStatus, page])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/contacts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/contacts/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchContacts()
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLIENT: 'bg-blue-100 text-blue-700 border-blue-200',
      SUPPLIER: 'bg-green-100 text-green-700 border-green-200',
      STAFF: 'bg-purple-100 text-purple-700 border-purple-200',
      CUSTOMER: 'bg-amber-100 text-amber-700 border-amber-200',
      PARTNER: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      LEAD: 'bg-orange-100 text-orange-700 border-orange-200',
    }
    return colors[type] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'INACTIVE':
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      case 'LEAD':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getActivityScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('cms.title', 'Contact Management')}
            </h1>
            <p className="text-slate-600">
              {t('cms.subtitle', 'Manage all your business relationships in one place')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/contacts/import"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {t('cms.actions.import', 'Import')}
            </Link>
            <Link
              href="/dashboard/contacts/new"
              className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('cms.contact.add', 'Add Contact')}
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.totalContacts.toLocaleString()}
              </h3>
              <p className="text-sm text-slate-600">
                {t('cms.stats.total_contacts', 'Total Contacts')}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.activeContacts}
              </h3>
              <p className="text-sm text-slate-600">
                {t('cms.stats.active_contacts', 'Active Contacts')}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.leads}
              </h3>
              <p className="text-sm text-slate-600">
                {t('cms.stats.leads', 'Leads')}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.recentActivities}
              </h3>
              <p className="text-sm text-slate-600">
                {t('cms.stats.recent_activities', 'Recent Activities (7 days)')}
              </p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('cms.contact.search', 'Search contacts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('cms.filters.all', 'All Types')}</option>
            <option value="CLIENT">{t('cms.types.CLIENT', 'Client')}</option>
            <option value="SUPPLIER">{t('cms.types.SUPPLIER', 'Supplier')}</option>
            <option value="STAFF">{t('cms.types.STAFF', 'Staff')}</option>
            <option value="CUSTOMER">{t('cms.types.CUSTOMER', 'Customer')}</option>
            <option value="PARTNER">{t('cms.types.PARTNER', 'Partner')}</option>
            <option value="LEAD">{t('cms.types.LEAD', 'Lead')}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('cms.filters.all', 'All Status')}</option>
            <option value="ACTIVE">{t('cms.status.ACTIVE', 'Active')}</option>
            <option value="INACTIVE">{t('cms.status.INACTIVE', 'Inactive')}</option>
            <option value="LEAD">{t('cms.status.LEAD', 'Lead')}</option>
            <option value="BLOCKED">{t('cms.status.BLOCKED', 'Blocked')}</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            {t('filter', 'Filter')}
          </button>

          <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('export', 'Export')}
          </button>
        </div>

        {/* Contacts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.contact.name', 'Contact')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.contact.type', 'Type')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.contact.status', 'Status')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.organization.name', 'Organization')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.contact.activity_score', 'Activity')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('cms.contact.last_activity', 'Last Activity')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('common.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {t('loading', 'Loading...')}
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {t('cms.messages.no_contacts', 'No contacts found')}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800">{contact.name}</p>
                          {contact.jobTitle && (
                            <p className="text-sm text-slate-500">{contact.jobTitle}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {contact.phone && (
                              <span className="text-xs text-slate-400">{contact.phone}</span>
                            )}
                            {contact.email && (
                              <span className="text-xs text-slate-400">{contact.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(contact.type)}`}>
                          {t(`cms.types.${contact.type}`, contact.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contact.status)}
                          <span className="text-sm text-slate-700">
                            {t(`cms.status.${contact.status}`, contact.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact.organizationMemberships && contact.organizationMemberships.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {contact.organizationMemberships[0].organization.name}
                            </p>
                            {contact.organizationMemberships[0].role && (
                              <p className="text-xs text-slate-500">
                                {contact.organizationMemberships[0].role}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityScoreColor(contact.activityScore)}`}>
                          {Math.round(contact.activityScore)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {contact.lastActivityAt
                          ? new Date(contact.lastActivityAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/contacts/${contact.id}`}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title={t('cms.contact.view', 'View Contact')}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Link>
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title={t('cms.actions.call', 'Call')}
                            >
                              <Phone className="w-4 h-4 text-green-600" />
                            </a>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                              title={t('cms.actions.email', 'Send Email')}
                            >
                              <Mail className="w-4 h-4 text-purple-600" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
