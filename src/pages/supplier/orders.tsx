import { Search, Filter, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { useState } from 'react'

export default function SupplierOrders() {
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [orders, setOrders] = useState([
    { 
      id: 1, 
      orderNumber: "SUP-001-2024", 
      restaurant: "Nyama Cafe Kigali", 
      items: "10kg Chicken, 5kg Beef, 2kg Liver", 
      amount: 180000, 
      status: "PENDING", 
      time: "10 mins ago",
      deliveryTime: "Today, 2:00 PM",
      restaurantPhone: "+250788123456"
    },
    { 
      id: 2, 
      orderNumber: "SUP-002-2024", 
      restaurant: "Ubumwe Restaurant", 
      items: "20kg Potatoes, 10kg Onions, 5kg Tomatoes", 
      amount: 45000, 
      status: "CONFIRMED", 
      time: "30 mins ago",
      deliveryTime: "Today, 3:30 PM",
      restaurantPhone: "+250788987654"
    },
    { 
      id: 3, 
      orderNumber: "SUP-003-2024", 
      restaurant: "Best Food Ltd", 
      items: "50 Fanta, 30 Coke, 20 Sprite", 
      amount: 65000, 
      status: "PROCESSING", 
      time: "1 hour ago",
      deliveryTime: "Tomorrow, 9:00 AM",
      restaurantPhone: "+250788456789"
    },
    { 
      id: 4, 
      orderNumber: "SUP-004-2024", 
      restaurant: "Kigali Grill House", 
      items: "15kg Goat Meat, 10kg Fish", 
      amount: 220000, 
      status: "READY_FOR_DELIVERY", 
      time: "2 hours ago",
      deliveryTime: "Today, 4:00 PM",
      restaurantPhone: "+250788111222"
    },
    { 
      id: 5, 
      orderNumber: "SUP-005-2024", 
      restaurant: "Quick Bite Cafe", 
      items: "5kg Chicken, 3kg Beef, 2kg Rice", 
      amount: 85000, 
      status: "OUT_FOR_DELIVERY", 
      time: "3 hours ago",
      deliveryTime: "Today, 1:00 PM",
      restaurantPhone: "+250788333444"
    },
  ])

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'READY_FOR_DELIVERY': return 'bg-green-100 text-green-800'
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800'
      case 'DELIVERED': return 'bg-gray-100 text-gray-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return Clock
      case 'CONFIRMED': return CheckCircle
      case 'PROCESSING': return Clock
      case 'READY_FOR_DELIVERY': return Truck
      case 'OUT_FOR_DELIVERY': return Truck
      case 'DELIVERED': return CheckCircle
      case 'REJECTED': return XCircle
      default: return Clock
    }
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
  try {
    const res = await fetch(`/api/supplier/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || 'Failed to update')
    }
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
    alert(`Order ${orderId} status updated to ${newStatus}`)
  } catch (e) {
    alert('Failed to update status')
  }
}

  const handleDelivery = async (orderId: number) => {
    const notes = prompt('Delivery notes (optional):')
    if (notes === null) return

    try {
      const res = await fetch(`/api/supplier/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to confirm delivery')
      }
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'DELIVERED' } : o)))
      alert(`Order ${orderId} delivered successfully!`)
    } catch (e) {
      alert('Failed to confirm delivery')
    }
  }

  const sendWhatsAppUpdate = (phone: string, orderNumber: string, message: string) => {
    const text = encodeURIComponent(`Order ${orderNumber}: ${message}`)
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage all business orders</p>
          </div>
          <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            ðŸ“¦ Bulk Confirm Orders
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending Orders</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Today's Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              RWF {orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold text-blue-600">12 mins</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Delivery Success</p>
            <p className="text-2xl font-bold text-purple-600">98%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by business or order number..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              type="date"
              className="px-4 py-2 border rounded-lg"
              placeholder="Date"
            />
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Business</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount (RWF)</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Delivery Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium">{order.orderNumber}</span>
                        <p className="text-xs text-gray-500">{order.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{order.restaurant}</span>
                        <p className="text-xs text-gray-500">{order.restaurantPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{order.items}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold">RWF {order.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{order.deliveryTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'REJECTED')}
                                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Start Processing
                            </button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'READY_FOR_DELIVERY')}
                              className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                            >
                              Ready for Delivery
                            </button>
                          )}
                          {order.status === 'READY_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')}
                              className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                            >
                              Out for Delivery
                            </button>
                          )}
                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleDelivery(order.id)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          <button
                            onClick={() => sendWhatsAppUpdate(order.restaurantPhone, order.orderNumber, 'Status update')}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            ðŸ“± WhatsApp
                          </button>
                          <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="mt-6 p-6 bg-orange-50 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">ðŸš€ Bulk Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
              Confirm All Pending Orders
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Send WhatsApp Updates to All
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Generate Delivery Schedule
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              Export Orders (Excel)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
