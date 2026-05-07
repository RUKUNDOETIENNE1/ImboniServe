import { DollarSign, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function SupplierPayments() {
  const [filterStatus, setFilterStatus] = useState('all')

  const payments = [
    { id: 1, orderNumber: "SUP-001-2024", restaurant: "Nyama Cafe", amount: 180000, status: "PAID", method: "MTN MoMo", date: "2024-01-15", dueDate: "2024-01-15" },
    { id: 2, orderNumber: "SUP-002-2024", restaurant: "Ubumwe Restaurant", amount: 45000, status: "PENDING", method: "Airtel Money", date: "2024-01-14", dueDate: "2024-01-16" },
    { id: 3, orderNumber: "SUP-003-2024", restaurant: "Best Food Ltd", amount: 65000, status: "PAID", method: "Bank Transfer", date: "2024-01-14", dueDate: "2024-01-14" },
    { id: 4, orderNumber: "SUP-004-2024", restaurant: "Kigali Grill", amount: 220000, status: "PENDING", method: "MTN MoMo", date: "2024-01-13", dueDate: "2024-01-17" },
    { id: 5, orderNumber: "SUP-005-2024", restaurant: "Quick Bite", amount: 85000, status: "OVERDUE", method: "Cash", date: "2024-01-10", dueDate: "2024-01-12" },
  ]

  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus)

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0)
  const overdueAmount = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0)

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600">Track and manage all payments</p>
          </div>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            💰 Record Payment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">RWF {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +12% from last month
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">RWF {pendingAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {payments.filter(p => p.status === 'PENDING').length} orders
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">RWF {overdueAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-red-600 mt-2">
              {payments.filter(p => p.status === 'OVERDUE').length} orders need attention
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">94%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Excellent performance
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <input type="date" className="px-4 py-2 border rounded-lg" />
            <input type="date" className="px-4 py-2 border rounded-lg" />
            <select className="px-4 py-2 border rounded-lg">
              <option value="">All Methods</option>
              <option value="mtn">MTN MoMo</option>
              <option value="airtel">Airtel Money</option>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Business</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount (RWF)</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{payment.orderNumber}</td>
                    <td className="px-6 py-4">{payment.restaurant}</td>
                    <td className="px-6 py-4 font-bold">RWF {payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{payment.date}</td>
                    <td className="px-6 py-4">
                      <span className={payment.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}>
                        {payment.dueDate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {payment.status === 'PENDING' && (
                          <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                            Mark Paid
                          </button>
                        )}
                        {payment.status === 'OVERDUE' && (
                          <button className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                            Send Reminder
                          </button>
                        )}
                        <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">MTN MoMo</h3>
            <p className="text-2xl font-bold text-yellow-600">
              RWF {payments.filter(p => p.method === 'MTN MoMo').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Airtel Money</h3>
            <p className="text-2xl font-bold text-red-600">
              RWF {payments.filter(p => p.method === 'Airtel Money').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Bank Transfer</h3>
            <p className="text-2xl font-bold text-blue-600">
              RWF {payments.filter(p => p.method === 'Bank Transfer').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Cash</h3>
            <p className="text-2xl font-bold text-green-600">
              RWF {payments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
