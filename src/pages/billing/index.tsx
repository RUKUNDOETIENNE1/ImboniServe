/**
 * Billing Dashboard
 * Comprehensive billing center for subscription management
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  isAutoRenew: boolean
  plan: {
    id: string
    name: string
    code: string
    priceCents: number
    currency: string
    features: any
  }
  paymentTransactions: Array<{
    id: string
    status: string
    amountCents: number
    createdAt: string
  }>
}

interface PaymentTransaction {
  id: string
  invoiceNumber: string
  transactionId: string
  amountCents: number
  currency: string
  status: string
  gateway: string
  paymentMethod: string
  createdAt: string
  paidAt: string | null
}

interface BillingEvent {
  id: string
  eventType: string
  message: string | null
  occurredAt: string
  metadata: any
}

export default function BillingDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [events, setEvents] = useState<BillingEvent[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'timeline'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchBillingData()
    }
  }, [status])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      
      // Fetch current subscription
      const subRes = await fetch('/api/billing/subscription')
      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData.subscription)
      }

      // Fetch payment history
      const payRes = await fetch('/api/billing/payments')
      if (payRes.ok) {
        const payData = await payRes.json()
        setPayments(payData.payments || [])
      }

      // Fetch billing events
      const eventsRes = await fetch('/api/billing/events')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      GRACE_PERIOD: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      SUCCESS: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const getDaysUntilRenewal = () => {
    if (!subscription?.endDate) return null
    const end = new Date(subscription.endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Billing & Subscription | ImboniServe</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your subscription, view payment history, and download invoices</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Timeline
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Subscription Card */}
            {subscription ? (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                  {getStatusBadge(subscription.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{subscription.plan.name}</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {formatCurrency(subscription.plan.priceCents, subscription.plan.currency)}
                      <span className="text-sm text-gray-500 font-normal">/month</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(subscription.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Renewal Date</p>
                      <p className="font-medium">{formatDate(subscription.endDate)}</p>
                      {getDaysUntilRenewal() !== null && getDaysUntilRenewal()! > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {getDaysUntilRenewal()} days remaining
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Auto-Renewal</p>
                      <p className="font-medium">{subscription.isAutoRenew ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="/billing/upgrade"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Upgrade Plan
                  </Link>
                  {subscription.isAutoRenew && (
                    <button
                      onClick={() => router.push('/billing/cancel')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">No Active Subscription</h2>
                <p className="text-gray-600 mb-4">Subscribe to a plan to unlock premium features</p>
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  View Plans
                </Link>
              </div>
            )}

            {/* Recent Payments */}
            {payments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payments</h2>
                <div className="space-y-3">
                  {payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amountCents, payment.currency)}</p>
                        <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(payment.status)}
                        <p className="text-xs text-gray-500 mt-1">{payment.invoiceNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all payments →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amountCents, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === 'SUCCESS' && (
                          <a
                            href={`/api/billing/invoice/${payment.id}`}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                            download
                          >
                            Download
                          </a>
                        )}
                        <Link
                          href={`/billing/payment/${payment.id}`}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Timeline</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {events.map((event, idx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {idx !== events.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.eventType.replace(/_/g, ' ')}
                            </p>
                            {event.message && (
                              <p className="text-sm text-gray-500">{event.message}</p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDate(event.occurredAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
