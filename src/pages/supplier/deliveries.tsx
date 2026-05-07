import { Truck, MapPin, Clock, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function SupplierDeliveries() {
  const [filterStatus, setFilterStatus] = useState('all')

  const deliveries = [
    { id: 1, orderNumber: "SUP-001-2024", restaurant: "Nyama Cafe", address: "KN 5 Ave, Kigali", status: "DELIVERED", driver: "Jean", time: "8:00 AM" },
    { id: 2, orderNumber: "SUP-002-2024", restaurant: "Ubumwe Restaurant", address: "KG 12 St, Kigali", status: "IN_TRANSIT", driver: "Marie", time: "10:30 AM" },
    { id: 3, orderNumber: "SUP-003-2024", restaurant: "Best Food Ltd", address: "KK 45 Rd, Kigali", status: "SCHEDULED", driver: "Patrick", time: "2:00 PM" },
  ]

  const filteredDeliveries = filterStatus === 'all' ? deliveries : deliveries.filter(d => d.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800'
      case 'SCHEDULED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-gray-600">Track and manage all deliveries</p>
          </div>
          <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            🚚 Schedule Delivery
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Today</p>
            <p className="text-2xl font-bold text-blue-600">{deliveries.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{deliveries.filter(d => d.status === 'DELIVERED').length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">{deliveries.filter(d => d.status === 'IN_TRANSIT').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            <option value="DELIVERED">Delivered</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{delivery.restaurant}</h3>
                  <p className="text-sm text-gray-600">{delivery.orderNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                  <p>{delivery.address}</p>
                </div>
                <div className="flex items-center">
                  <Truck className="w-5 h-5 text-gray-400 mr-2" />
                  <p>Driver: {delivery.driver}</p>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <p>{delivery.time}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Track</button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Contact</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
