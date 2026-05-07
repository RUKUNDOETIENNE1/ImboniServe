import React, { useState } from 'react'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Truck, Star, Clock, Package, TrendingUp, ShoppingCart } from 'lucide-react'

export default function RestaurantSupplier() {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  
  const suppliers = [
    {
      id: 'meat1',
      name: 'Kigali Meat Supply',
      type: 'Meat Supplier',
      rating: 4.8,
      responseTime: '15 mins',
      deliveryFee: 2000,
      minOrder: 10000,
      products: ['Chicken', 'Beef', 'Goat', 'Fish'],
      contact: '+250788111222',
      isFavorite: true
    },
    {
      id: 'veg1',
      name: 'Green Fields Vegetables',
      type: 'Vegetable Supplier',
      rating: 4.5,
      responseTime: '30 mins',
      deliveryFee: 1500,
      minOrder: 5000,
      products: ['Potatoes', 'Onions', 'Tomatoes', 'Carrots'],
      contact: '+250788333444',
      isFavorite: false
    },
    {
      id: 'drink1',
      name: 'Beverage Rwanda Ltd',
      type: 'Beverage Supplier',
      rating: 4.9,
      responseTime: '20 mins',
      deliveryFee: 1000,
      minOrder: 15000,
      products: ['Fanta', 'Coca-Cola', 'Sprite', 'Water'],
      contact: '+250788555666',
      isFavorite: true
    }
  ]

  const recentOrders = [
    { supplier: 'Kigali Meat Supply', items: '10kg Chicken, 5kg Beef', amount: 180000, status: 'Delivered', time: 'Today, 2:00 PM' },
    { supplier: 'Green Fields Vegetables', items: '20kg Potatoes, 10kg Onions', amount: 45000, status: 'Processing', time: 'Today, 1:30 PM' },
    { supplier: 'Beverage Rwanda Ltd', items: '50 Fanta, 30 Coke', amount: 65000, status: 'Confirmed', time: 'Yesterday, 4:00 PM' },
  ]

  const quickOrderItems = [
    { name: 'Chicken', supplier: 'Kigali Meat Supply', price: 8000, lastOrder: '10kg' },
    { name: 'Beef', supplier: 'Kigali Meat Supply', price: 12000, lastOrder: '5kg' },
    { name: 'Potatoes', supplier: 'Green Fields', price: 800, lastOrder: '20kg' },
    { name: 'Fanta 500ml', supplier: 'Beverage Rwanda', price: 1000, lastOrder: '50 bottles' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">🛒 Supplier Management</h3>
          <p className="text-gray-600">Order from verified suppliers</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center">
          <ShoppingCart className="w-4 h-4 mr-2" />
          New Order
        </button>
      </div>

      {/* Quick Order */}
      <div className="mb-8">
        <h4 className="font-semibold mb-4">⚡ Quick Re-order</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickOrderItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 hover:border-orange-300 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.supplier}</p>
                </div>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-sm font-bold mt-2"><CurrencyDisplay amount={item.price} /></p>
              <p className="text-xs text-gray-500">Last order: {item.lastOrder}</p>
              <button className="w-full mt-3 bg-orange-100 text-orange-700 py-1 rounded text-sm hover:bg-orange-200">
                Re-order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier List */}
      <div className="mb-8">
        <h4 className="font-semibold mb-4">🤝 Your Suppliers</h4>
        <div className="space-y-4">
          {suppliers.map(supplier => (
            <div
              key={supplier.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedSupplier === supplier.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedSupplier(supplier.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h5 className="font-semibold">{supplier.name}</h5>
                    {supplier.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{supplier.type}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{supplier.rating}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {supplier.responseTime}
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {supplier.products.map((product, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {product}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-600">Delivery: </span>
                    <span className="font-medium"><CurrencyDisplay amount={supplier.deliveryFee} /></span>
                  </div>
                  <div>
                    <span className="text-gray-600">Min Order: </span>
                    <span className="font-medium"><CurrencyDisplay amount={supplier.minOrder} /></span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  Order Now
                </button>
                <button className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50">
                  WhatsApp
                </button>
                <button className="px-3 border border-gray-300 rounded hover:bg-gray-50">
                  ⋮
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h4 className="font-semibold mb-4">📦 Recent Orders</h4>
        <div className="space-y-3">
          {recentOrders.map((order, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h6 className="font-medium">{order.supplier}</h6>
                  <p className="text-sm text-gray-600 mt-1">{order.items}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold"><CurrencyDisplay amount={order.amount} /></p>
                  <p className={`text-sm ${
                    order.status === 'Delivered' ? 'text-green-600' :
                    order.status === 'Processing' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {order.status}
                  </p>
                  <p className="text-xs text-gray-500">{order.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">📊 Supplier Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-sm text-gray-600">On-time Delivery</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">4.8</div>
            <p className="text-sm text-gray-600">Avg. Rating</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">15m</div>
            <p className="text-sm text-gray-600">Avg. Response</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-sm text-gray-600">Active Suppliers</p>
          </div>
        </div>
      </div>
    </div>
  )
}