import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ConfirmModal from '@/components/ConfirmModal'
import { useTranslation } from '@/lib/i18n'
import { MessageSquare, Plus, Send, Users, Calendar, TrendingUp, Eye, MousePointer } from 'lucide-react'
import Card from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  message: string
  segment: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED'
  scheduledFor?: string
  sentAt?: string
  metrics: {
    sent: number
    delivered: number
    read: number
    clicked: number
  }
  createdAt: string
}

export default function Campaigns() {
  const { t } = useTranslation()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    segment: 'all',
    scheduledFor: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(t('campaigns.created', 'Campaign created successfully'))
        setShowNewCampaign(false)
        setFormData({ name: '', message: '', segment: 'all', scheduledFor: '' })
        fetchCampaigns()
      }
    } catch (error) {
      toast.error('Failed to create campaign')
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || 'Campaign sent successfully')
        fetchCampaigns()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to send campaign')
      }
    } catch (error) {
      toast.error('Failed to send campaign')
    } finally {
      setShowSendConfirm(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-700 border-slate-200',
      'SCHEDULED': 'bg-blue-100 text-blue-700 border-blue-200',
      'SENT': 'bg-green-100 text-green-700 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'SENT').length,
    scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
    totalReach: campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('campaigns.title', 'WhatsApp Campaigns')}
            </h1>
            <p className="text-slate-600">
              {t('campaigns.subtitle', 'Automated customer engagement via WhatsApp')}
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('campaigns.new', 'New Campaign')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.total}</h3>
            <p className="text-sm text-slate-600">{t('campaigns.total', 'Total Campaigns')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.sent}</h3>
            <p className="text-sm text-slate-600">{t('campaigns.sent', 'Sent')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.scheduled}</h3>
            <p className="text-sm text-slate-600">{t('campaigns.scheduled', 'Scheduled')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.totalReach}</h3>
            <p className="text-sm text-slate-600">{t('campaigns.total_reach', 'Total Reach')}</p>
          </Card>
        </div>

        <div className="space-y-6">
          {loading ? (
            <Card className="p-12 text-center text-slate-500">
              {t('common.loading', 'Loading...')}
            </Card>
          ) : campaigns.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {t('campaigns.no_campaigns', 'No campaigns yet. Create your first campaign!')}
              </p>
            </Card>
          ) : (
            campaigns.map(campaign => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{campaign.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{campaign.message}</p>
                    <p className="text-xs text-slate-500">
                      Segment: <span className="font-medium">{campaign.segment}</span>
                    </p>
                  </div>
                  {campaign.status === 'DRAFT' && (
                    <button
                      onClick={() => setShowSendConfirm(campaign.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Now
                    </button>
                  )}
                </div>

                {campaign.status === 'SENT' && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('campaigns.sent', 'Sent')}</p>
                      <p className="text-lg font-bold text-slate-800">{campaign.metrics.sent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('campaigns.delivered', 'Delivered')}</p>
                      <p className="text-lg font-bold text-slate-800">{campaign.metrics.delivered}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('campaigns.read', 'Read')}</p>
                      <p className="text-lg font-bold text-slate-800">{campaign.metrics.read}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t('campaigns.clicked', 'Clicked')}</p>
                      <p className="text-lg font-bold text-slate-800">{campaign.metrics.clicked}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {showNewCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  {t('campaigns.new', 'New Campaign')}
                </h2>
                <form onSubmit={createCampaign} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('campaigns.name', 'Campaign Name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('campaigns.message', 'Message')}
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('campaigns.segment', 'Customer Segment')}
                      </label>
                      <select
                        value={formData.segment}
                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Customers</option>
                        <option value="Champions">Champions</option>
                        <option value="Loyal">Loyal</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('campaigns.schedule', 'Schedule For')}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      {t('campaigns.create', 'Create Campaign')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCampaign(false)}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Send Campaign Confirmation Modal */}
        <ConfirmModal
          isOpen={!!showSendConfirm}
          onClose={() => setShowSendConfirm(null)}
          onConfirm={() => showSendConfirm && sendCampaign(showSendConfirm)}
          title={t('campaigns.send_campaign', 'Send Campaign')}
          message={t('campaigns.send_confirm', 'Send this campaign now? This will send WhatsApp messages to all customers in the selected segment.')}
          confirmText={t('campaigns.send_now', 'Send Now')}
          cancelText={t('common.cancel', 'Cancel')}
          variant="primary"
        />
      </div>
    </DashboardLayout>
  )
}
