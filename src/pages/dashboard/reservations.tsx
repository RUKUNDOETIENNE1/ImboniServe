import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Calendar, Clock, Users, DollarSign, CheckCircle,
  XCircle, AlertCircle, Plus, Search, Filter, Phone, Mail
} from 'lucide-react'
import Card from '@/components/ui/Card'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { toast } from 'react-hot-toast'

interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  date: string
  time: string
  partySize: number
  tableNumber?: string
  depositAmount: number
  depositPaid: boolean
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  specialRequests?: string
  createdAt: string
}

export default function Reservations() {
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: '',
    time: '',
    partySize: 2,
    depositAmount: 0,
    specialRequests: ''
  })

  useEffect(() => {
    fetchReservations()
  }, [filterStatus])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservations?status=${filterStatus}`)
      if (res.ok) {
        const data = await res.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(t('reservations.created', 'Reservation created successfully'))
        setShowNewForm(false)
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          date: '',
          time: '',
          partySize: 2,
          depositAmount: 0,
          specialRequests: ''
        })
        fetchReservations()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create reservation')
      }
    } catch (error) {
      toast.error('Failed to create reservation')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(t('reservations.updated', 'Reservation updated'))
        fetchReservations()
      }
    } catch (error) {
      toast.error('Failed to update reservation')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
      'CONFIRMED': 'bg-green-100 text-green-700 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-700 border-blue-200',
      'NO_SHOW': 'bg-slate-100 text-slate-700 border-slate-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const filteredReservations = reservations.filter(r =>
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerPhone.includes(searchQuery)
  )

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    today: reservations.filter(r => {
      const resDate = new Date(r.date)
      const today = new Date()
      return resDate.toDateString() === today.toDateString()
    }).length
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('reservations.title', 'Table Reservations')}
            </h1>
            <p className="text-slate-600">
              {t('reservations.subtitle', 'Manage bookings with deposit requirements')}
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('reservations.new', 'New Reservation')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.total}</h3>
            <p className="text-sm text-slate-600">{t('reservations.total', 'Total Reservations')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.pending}</h3>
            <p className="text-sm text-slate-600">{t('reservations.pending', 'Pending')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.confirmed}</h3>
            <p className="text-sm text-slate-600">{t('reservations.confirmed', 'Confirmed')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.today}</h3>
            <p className="text-sm text-slate-600">{t('reservations.today', 'Today')}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('reservations.search', 'Search by name or phone...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('common.all', 'All')}</option>
            <option value="PENDING">{t('reservations.pending', 'Pending')}</option>
            <option value="CONFIRMED">{t('reservations.confirmed', 'Confirmed')}</option>
            <option value="CANCELLED">{t('reservations.cancelled', 'Cancelled')}</option>
            <option value="COMPLETED">{t('reservations.completed', 'Completed')}</option>
          </select>
        </div>

        {/* Reservations Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.customer', 'Customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.date_time', 'Date & Time')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.party_size', 'Party Size')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.table', 'Table')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.deposit', 'Deposit')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('reservations.status', 'Status')}
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
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {t('reservations.no_reservations', 'No reservations found')}
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map(reservation => (
                    <tr key={reservation.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800">{reservation.customerName}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reservation.customerPhone}
                          </p>
                          {reservation.customerEmail && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {reservation.customerEmail}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(reservation.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reservation.time}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Users className="w-4 h-4" />
                          {reservation.partySize}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {reservation.tableNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800">
                            <CurrencyDisplay amount={reservation.depositAmount} />
                          </p>
                          <p className={`text-xs ${reservation.depositPaid ? 'text-green-600' : 'text-amber-600'}`}>
                            {reservation.depositPaid ? '✓ Paid' : 'Pending'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {reservation.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(reservation.id, 'CONFIRMED')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {reservation.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateStatus(reservation.id, 'COMPLETED')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                            <button
                              onClick={() => updateStatus(reservation.id, 'CANCELLED')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* New Reservation Modal */}
        {showNewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  {t('reservations.new', 'New Reservation')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.customer_name', 'Customer Name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.phone', 'Phone')} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('reservations.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.date', 'Date')} *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.time', 'Time')} *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.party_size', 'Party Size')} *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.partySize}
                        onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('reservations.deposit_amount', 'Deposit Amount')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('reservations.special_requests', 'Special Requests')}
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      {t('reservations.create', 'Create Reservation')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
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
      </div>
    </DashboardLayout>
  )
}
