import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import FormModal from '@/components/FormModal'
import ConfirmModal from '@/components/ConfirmModal'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { useToast } from '@/components/Toast'
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, Save } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export default function Inventory() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: 0,
    minStockLevel: 0,
    unitCostCents: 0
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.add === '1') {
      setShowAddModal(true)
      // Clear the query to prevent reopening on back/forward
      router.replace('/dashboard/inventory', undefined, { shallow: true })
    }
  }, [router.isReady, router.query.add])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      if (res.ok) {
        const data = await res.json()
        // Ensure data is an array
        setItems(Array.isArray(data) ? data : [])
      } else {
        setItems([])
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      showToast('error', t('inventory.failed_fetch', 'Failed to fetch inventory'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.category || !formData.unit) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    const stockNum = Number(formData.currentStock)
    const minNum = Number(formData.minStockLevel)
    const costNum = Number(formData.unitCostCents)

    if (isNaN(stockNum) || isNaN(minNum) || isNaN(costNum)) {
      showToast('error', 'Please enter valid numbers for stock and cost')
      return
    }

    const validatedData = {
      ...formData,
      currentStock: stockNum,
      minStockLevel: minNum,
      unitCostCents: Math.round(costNum)
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      })

      if (res.ok) {
        showToast('success', t('inventory.item_added', 'Item added successfully!'))
        setShowAddModal(false)
        setFormData({ name: '', category: '', unit: '', currentStock: 0, minStockLevel: 0, unitCostCents: 0 })
        fetchInventory()
      } else {
        const error = await res.json()
        showToast('error', error.error || t('inventory.failed_add', 'Failed to add item'))
      }
    } catch (error) {
      showToast('error', t('inventory.failed_add', 'Failed to add item'))
    }
  }

  const handleEdit = async () => {
    if (!selectedItem) return

    if (!formData.name || !formData.category || !formData.unit) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    const stockNum = Number(formData.currentStock)
    const minNum = Number(formData.minStockLevel)
    const costNum = Number(formData.unitCostCents)

    if (isNaN(stockNum) || isNaN(minNum) || isNaN(costNum)) {
      showToast('error', 'Please enter valid numbers for stock and cost')
      return
    }

    const validatedData = {
      ...formData,
      currentStock: stockNum,
      minStockLevel: minNum,
      unitCostCents: Math.round(costNum)
    }

    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      })

      if (res.ok) {
        showToast('success', t('inventory.item_updated', 'Item updated successfully!'))
        setShowEditModal(false)
        setSelectedItem(null)
        fetchInventory()
      } else {
        const error = await res.json()
        showToast('error', error.error || t('inventory.failed_update', 'Failed to update item'))
      }
    } catch (error) {
      showToast('error', t('inventory.failed_update', 'Failed to update item'))
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showToast('success', t('inventory.item_deleted', 'Item deleted successfully!'))
        setSelectedItem(null)
        fetchInventory()
      } else {
        showToast('error', t('inventory.failed_delete', 'Failed to delete item'))
      }
    } catch (error) {
      showToast('error', t('inventory.failed_delete', 'Failed to delete item'))
    }
  }

  const openEditModal = (item: any) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      category: item.category || '',
      unit: item.unit,
      currentStock: item.currentStock,
      minStockLevel: item.minStockLevel,
      unitCostCents: item.unitCostCents
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (item: any) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))]

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStockStatus = (current: number, min: number) => {
    if (min <= 0) return { status: 'good', color: 'green', classes: 'bg-green-100 text-green-600' }
    const ratio = current / Math.max(min, 1)
    if (ratio <= 0.5) return { status: 'low', color: 'red', classes: 'bg-red-100 text-red-600' }
    if (ratio <= 1) return { status: 'medium', color: 'yellow', classes: 'bg-yellow-100 text-yellow-600' }
    return { status: 'good', color: 'green', classes: 'bg-green-100 text-green-600' }
  }

  const stats = [
    { label: t('inventory.total_items', 'Total Items'), value: items.length, color: 'blue' },
    { label: t('inventory.low_stock', 'Low Stock'), value: items.filter(i => getStockStatus(i.currentStock, i.minStockLevel).status === 'low').length, color: 'red' },
    { label: t('inventory.medium_stock', 'Medium Stock'), value: items.filter(i => getStockStatus(i.currentStock, i.minStockLevel).status === 'medium').length, color: 'yellow' },
    { label: t('inventory.good_stock', 'Good Stock'), value: items.filter(i => getStockStatus(i.currentStock, i.minStockLevel).status === 'good').length, color: 'green' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('inventory.title', 'Inventory Management')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('inventory.subtitle', 'Track and manage your business inventory')}</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('inventory.add_item', 'Add Item')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            red: { bg: 'bg-red-100', text: 'text-red-600' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            green: { bg: 'bg-green-100', text: 'text-green-600' }
          }[stat.color] || { bg: 'bg-slate-100', text: 'text-slate-600' }

          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
                  <Package className={`w-5 h-5 ${colorClasses.text}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterCategory === category
                    ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('inventory.search_placeholder', 'Search items...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 w-64"
            />
          </div>
        </div>
      </div>

      {items.filter(i => getStockStatus(i.currentStock, i.minStockLevel).status === 'low').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">{t('inventory.low_stock_alert', 'Low Stock Alert!')}</h3>
              <p className="text-sm text-red-700">
                {items.filter(i => getStockStatus(i.currentStock, i.minStockLevel).status === 'low').length} {t('inventory.items_need_restocking', 'items need immediate restocking')}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const stockInfo = getStockStatus(item.currentStock, item.minStockLevel)
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.category}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    stockInfo.status === 'low' ? 'bg-red-100 text-red-700' :
                    stockInfo.status === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {stockInfo.status.charAt(0).toUpperCase() + stockInfo.status.slice(1)}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Stock Level</span>
                    <div className="text-sm text-slate-600 mb-1">
                      {item.currentStock} / {item.minStockLevel} units
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        stockInfo.color === 'red' ? 'bg-red-500' :
                        stockInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(Math.max((item.currentStock / Math.max(item.minStockLevel, 1)) * 100, 0), 100)}%` }}
                    />
                  </div>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${stockInfo.classes}`}>
                    {stockInfo.status === 'low' ? 'Low Stock' : stockInfo.status === 'medium' ? 'Medium' : 'Good'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500">Cost per {item.unit}</p>
                    <p className="text-sm font-bold text-slate-800"><CurrencyDisplay amount={item.unitCostCents || 0} /></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      aria-label="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No inventory items found</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-gradient-to-r from-imboni-green to-green-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all"
              >
                Add Your First Item
              </button>
            </div>
          )}
        </div>
      )}

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Inventory Item"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., Vegetables"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., kg, L, pieces"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (RWF)</label>
              <input
                type="number"
                value={formData.unitCostCents / 100}
                onChange={(e) => setFormData({ ...formData, unitCostCents: parseFloat(e.target.value) * 100 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., 500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Stock</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Stock Level</label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., 20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAdd}
              className="flex-1 bg-gradient-to-r from-imboni-green to-green-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center justify-center transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('dashboard.inventory.save_item', 'Save Item')}
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Inventory Item"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (RWF)</label>
              <input
                type="number"
                value={formData.unitCostCents / 100}
                onChange={(e) => setFormData({ ...formData, unitCostCents: parseFloat(e.target.value) * 100 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Stock</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Stock Level</label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEdit}
              className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </DashboardLayout>
  )
}
