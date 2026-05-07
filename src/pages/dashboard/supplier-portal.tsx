import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { Package, Phone, Mail, Plus, Search, Filter, TrendingUp, AlertCircle, User } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  rating: number
  totalOrders: number
  totalSpent: number
  lastOrder: Date
}

interface SupplierItem {
  id: string
  supplierId: string
  name: string
  sku: string
  unit: string
  price: number
  minOrderQty: number
  leadTime: number // days
  inStock: boolean
}

interface Order {
  id: string
  supplierId: string
  supplierName: string
  items: {
    itemId: string
    name: string
    quantity: number
    price: number
  }[]
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'
  orderDate: Date
  expectedDelivery: Date
}

export default function SupplierPortal() {
  const { status } = useSession()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders' | 'catalog'>('suppliers')
  const [searchTerm, setSearchTerm] = useState('')

  const suppliers: Supplier[] = [
    {
      id: '1',
      name: 'Rwanda Fresh Produce Ltd',
      contact: 'John Murenzi',
      email: 'john@rwandafresh.rw',
      phone: '+250788123456',
      address: 'Kigali, Rwanda',
      rating: 4.8,
      totalOrders: 45,
      totalSpent: 2500000,
      lastOrder: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Kigali Meat Suppliers',
      contact: 'Sarah Uwimana',
      email: 'sarah@kigalimeat.rw',
      phone: '+250788234567',
      address: 'Kigali, Rwanda',
      rating: 4.5,
      totalOrders: 32,
      totalSpent: 1800000,
      lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]

  const supplierItems: SupplierItem[] = [
    {
      id: '1',
      supplierId: '1',
      name: 'Fresh Tomatoes',
      sku: 'VEG-TOM-001',
      unit: 'kg',
      price: 1500,
      minOrderQty: 10,
      leadTime: 2,
      inStock: true
    },
    {
      id: '2',
      supplierId: '1',
      name: 'Fresh Lettuce',
      sku: 'VEG-LET-002',
      unit: 'kg',
      price: 2000,
      minOrderQty: 5,
      leadTime: 2,
      inStock: true
    },
    {
      id: '3',
      supplierId: '2',
      name: 'Beef Steak',
      sku: 'MEAT-BEF-001',
      unit: 'kg',
      price: 8000,
      minOrderQty: 20,
      leadTime: 3,
      inStock: false
    }
  ]

  const orders: Order[] = [
    {
      id: 'ORD-001',
      supplierId: '1',
      supplierName: 'Rwanda Fresh Produce Ltd',
      items: [
        { itemId: '1', name: 'Fresh Tomatoes', quantity: 20, price: 1500 },
        { itemId: '2', name: 'Fresh Lettuce', quantity: 10, price: 2000 }
      ],
      total: 50000,
      status: 'PENDING',
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'ORD-002',
      supplierId: '2',
      supplierName: 'Kigali Meat Suppliers',
      items: [
        { itemId: '3', name: 'Beef Steak', quantity: 25, price: 8000 }
      ],
      total: 200000,
      status: 'CONFIRMED',
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expectedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ]

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('supplier.title', 'Supplier Portal')}</h1>
            <p className="text-slate-600">{t('supplier.subtitle', 'Manage suppliers and orders')}</p>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t('supplier.filter', 'Filter')}
            </button>
            <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('supplier.newOrder', 'New Order')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
          {['suppliers', 'orders', 'catalog'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-imboni-blue shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(`supplier.tab.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-imboni-blue/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-imboni-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <TrendingUp className="w-3 h-3" />
                        {supplier.rating} ⭐
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    {supplier.contact}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    {supplier.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    {supplier.email}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('supplier.totalOrders', 'Total Orders')}</span>
                    <span className="font-semibold text-slate-900">{supplier.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600">{t('supplier.totalSpent', 'Total Spent')}</span>
                    <span className="font-semibold text-slate-900">{supplier.totalSpent.toLocaleString()} RWF</span>
                  </div>
                </div>

                <button className="mt-4 w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                  {t('supplier.viewDetails', 'View Details')}
                </button>
              </div>
            ))}

            {/* Add Supplier Card */}
            <button className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-imboni-blue hover:bg-blue-50 transition-colors flex flex-col items-center justify-center min-h-[280px]">
              <Plus className="w-12 h-12 text-slate-400 mb-2" />
              <span className="text-slate-600 font-medium">{t('supplier.addSupplier', 'Add Supplier')}</span>
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('supplier.searchOrders', 'Search orders...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-imboni-blue"
                />
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.orderId', 'Order ID')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.supplier', 'Supplier')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.items', 'Items')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.total', 'Total')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.status', 'Status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('supplier.delivery', 'Delivery')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.supplierName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.items.length} {t('supplier.items', 'items')}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{order.total.toLocaleString()} RWF</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {t(`supplier.status.${order.status.toLowerCase()}`, order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.expectedDelivery.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supplierItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </div>
                  {!item.inStock && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('supplier.price', 'Price')}</span>
                    <span className="font-semibold text-slate-900">{item.price.toLocaleString()} RWF/{item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('supplier.minOrder', 'Min Order')}</span>
                    <span className="font-medium text-slate-900">{item.minOrderQty} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('supplier.leadTime', 'Lead Time')}</span>
                    <span className="font-medium text-slate-900">{item.leadTime} {t('supplier.days', 'days')}</span>
                  </div>
                </div>

                <button
                  disabled={!item.inStock}
                  className="mt-4 w-full py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.inStock ? t('supplier.addToOrder', 'Add to Order') : t('supplier.outOfStock', 'Out of Stock')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
