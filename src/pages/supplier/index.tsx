import { Package, Truck, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react'

export default function SupplierDashboard() {
  const colorClasses: Record<string, { text: string; bg: string; icon: string }> = {
    orange: { text: 'text-orange-600', bg: 'bg-orange-100', icon: 'text-orange-600' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-600' },
    green: { text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-600' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-600' },
  }

  const stats = [
    { title: "Today's Orders", value: "24", change: "+8%", icon: Package, color: "orange" },
    { title: "Pending Deliveries", value: "6", change: "Need attention", icon: Truck, color: "blue" },
    { title: "Today's Revenue", value: "RWF 850,000", change: "+15%", icon: DollarSign, color: "green" },
    { title: "Avg Response Time", value: "12 mins", change: "Good", icon: Clock, color: "purple" },
  ]

  const recentOrders = [
    { id: 1, restaurant: "Nyama Cafe", items: "10kg Chicken, 5kg Beef", amount: "RWF 180,000", status: "Ready for Delivery", time: "30 mins ago" },
    { id: 2, restaurant: "Ubumwe Restaurant", items: "20kg Potatoes, 10kg Onions", amount: "RWF 45,000", status: "Processing", time: "1 hour ago" },
    { id: 3, restaurant: "Best Food Ltd", items: "50 Fanta, 30 Coke", amount: "RWF 65,000", status: "Pending", time: "2 hours ago" },
  ]

  const lowStockItems = [
    { name: "Chicken", stock: "15kg", min: "50kg", alert: "HIGH" },
    { name: "Beef", stock: "25kg", min: "40kg", alert: "MEDIUM" },
    { name: "Potatoes", stock: "80kg", min: "100kg", alert: "LOW" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
              <p className="text-gray-600">Kigali Meat Supply • Welcome back, Emmanuel</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">Verified Supplier</span>
              </div>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                + Add New Product
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const classes = colorClasses[stat.color] || colorClasses.blue
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold mt-2 ${classes.text}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 ${classes.bg} rounded-full`}>
                    <Icon className={`w-6 h-6 ${classes.icon}`} />
                  </div>
                </div>
                <p className={`text-sm mt-3 ${
                  stat.change.startsWith('+') ? 'text-green-600' :
                  stat.change.includes('Need') ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Orders */}
          <div className="lg:col-span-2">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">📦 Recent Orders</h2>
                <a href="/supplier/orders" className="text-orange-600 hover:text-orange-800 text-sm">
                  View all →
                </a>
              </div>
              
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{order.restaurant}</h4>
                        <p className="text-sm text-gray-600 mt-1">{order.items}</p>
                        <p className="text-sm font-bold mt-2">{order.amount}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          order.status === 'Ready for Delivery' ? 'bg-green-100 text-green-800' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">{order.time}</p>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700">
                        Confirm
                      </button>
                      <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                        View Details
                      </button>
                      <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200">
                  <div className="text-2xl mb-2">📦</div>
                  <p className="text-sm font-medium">Confirm Orders</p>
                </button>
                <button className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200">
                  <div className="text-2xl mb-2">🚚</div>
                  <p className="text-sm font-medium">Update Delivery</p>
                </button>
                <button className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200">
                  <div className="text-2xl mb-2">💰</div>
                  <p className="text-sm font-medium">Record Payment</p>
                </button>
                <button className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200">
                  <div className="text-2xl mb-2">📱</div>
                  <p className="text-sm font-medium">Broadcast</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold">📢 Low Stock Alert</h3>
              </div>
              
              <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stock} | Min: {item.min}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      item.alert === 'HIGH' ? 'bg-red-100 text-red-800' :
                      item.alert === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {item.alert}
                    </span>
                  </div>
                ))}
              </div>
              
              <button className="w-full bg-red-600 text-white py-2 rounded-lg mt-4 hover:bg-red-700">
                Order More Stock
              </button>
            </div>

            {/* Top Restaurants */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🏆 Top Restaurants</h3>
              <div className="space-y-3">
                {[
                  { name: "Nyama Cafe", orders: 42, amount: "RWF 1.2M" },
                  { name: "Ubumwe Restaurant", orders: 28, amount: "RWF 850K" },
                  { name: "Best Food Ltd", orders: 24, amount: "RWF 720K" },
                  { name: "Kigali Grill", orders: 18, amount: "RWF 540K" },
                ].map((restaurant, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-orange-600 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-xs text-gray-500">{restaurant.orders} orders</p>
                      </div>
                    </div>
                    <p className="font-bold">{restaurant.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Schedule */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🕒 Today's Deliveries</h3>
              <div className="space-y-3">
                {[
                  { time: "8:00 AM", restaurant: "Nyama Cafe", status: "Delivered ✅" },
                  { time: "10:30 AM", restaurant: "Ubumwe Restaurant", status: "On the way 🚚" },
                  { time: "2:00 PM", restaurant: "Best Food Ltd", status: "Scheduled" },
                  { time: "4:30 PM", restaurant: "Kigali Grill", status: "Preparing" },
                ].map((delivery, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{delivery.time}</p>
                      <p className="text-sm text-gray-600">{delivery.restaurant}</p>
                    </div>
                    <span className="text-sm font-medium">{delivery.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}