import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Package, AlertTriangle, Star, Edit, Save, X } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Card from '@/components/ui/Card'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type MenuItem = {
  id: string
  name: string
  description: string
  priceCents: number
  category: string
  isAvailable: boolean
  isSpecial: boolean
}

export default function DynamicMenuEditPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({})
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    setLoading(true)
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDesc, setNewDesc] = useState('')

  async function createItem() {
    if (!newName || !newPrice || !newCategory) {
      setMessage({ text: 'Name, price and category are required', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: '' }), 2500)
      return
    }
    const priceCents = Math.round(Number(newPrice) * 100)
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setMessage({ text: 'Enter a valid price', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: '' }), 2500)
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc, priceCents, costCents: 0, category: newCategory })
      })
      if (res.ok) {
        const item = await res.json()
        setItems([item, ...items])
        setNewName('')
        setNewPrice('')
        setNewCategory('')
        setNewDesc('')
        setMessage({ text: 'Item created', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 2000)
      } else {
        const e = await res.json().catch(() => ({}))
        setMessage({ text: e.error || 'Failed to create item', type: 'error' })
        setTimeout(() => setMessage({ text: '', type: '' }), 2500)
      }
    } catch {
      setMessage({ text: 'Failed to create item', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: '' }), 2500)
    } finally {
      setCreating(false)
    }
  }

  async function toggleAvailability(itemId: string, isAvailable: boolean) {
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      })

      if (res.ok) {
        setItems(items.map(item => 
          item.id === itemId ? { ...item, isAvailable } : item
        ))
        setMessage({ 
          text: `Item ${isAvailable ? 'marked available' : 'marked sold out'}`, 
          type: 'success' 
        })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      }
    } catch (error) {
      setMessage({ text: 'Failed to update', type: 'error' })
    }
  }

  async function toggleSpecial(itemId: string, isSpecial: boolean) {
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpecial })
      })

      if (res.ok) {
        setItems(items.map(item => 
          item.id === itemId ? { ...item, isSpecial } : item
        ))
        setMessage({ 
          text: `Item ${isSpecial ? 'marked as special' : 'removed from specials'}`, 
          type: 'success' 
        })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      }
    } catch (error) {
      setMessage({ text: 'Failed to update', type: 'error' })
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditForm({
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      category: item.category
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit(itemId: string) {
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        setItems(items.map(item => 
          item.id === itemId ? { ...item, ...editForm } : item
        ))
        setMessage({ text: 'Item updated successfully', type: 'success' })
        setEditingId(null)
        setEditForm({})
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      }
    } catch (error) {
      setMessage({ text: 'Failed to update', type: 'error' })
    }
  }

  const availableCount = items.filter(i => i.isAvailable).length
  const soldOutCount = items.filter(i => !i.isAvailable).length
  const specialsCount = items.filter(i => i.isSpecial).length

  const stats = [
    { label: 'Total Items', value: items.length, icon: Package, color: 'blue' },
    { label: 'Available', value: availableCount, icon: Package, color: 'green' },
    { label: 'Sold Out', value: soldOutCount, icon: AlertTriangle, color: 'red' },
    { label: 'Specials', value: specialsCount, icon: Star, color: 'orange' }
  ]

  const categories = Array.from(new Set(items.map(i => i.category)))

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Edit className="w-6 h-6 text-imboni-blue" />
              Dynamic Menu Editing
            </h1>
            <p className="text-sm text-slate-500 mt-1">Update availability and prices in real-time</p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (RWF)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={createItem}
            disabled={creating}
            className="px-4 py-2 bg-imboni-blue text-white rounded-lg disabled:opacity-50"
          >
            {creating ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </Card>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Menu Items by Category */}
      {categories.map(category => {
        const categoryItems = items.filter(i => i.category === category)
        return (
          <Card key={category} className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{category}</h2>
            <div className="space-y-3">
              {categoryItems.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border-2 transition-all ${
                  !item.isAvailable ? 'border-red-200 bg-red-50' : 
                  item.isSpecial ? 'border-orange-200 bg-orange-50' : 
                  'border-slate-200 bg-white'
                }`}>
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Price (RWF)</label>
                          <input
                            type="number"
                            value={(editForm.priceCents || 0) / 100}
                            onChange={(e) => setEditForm({ ...editForm, priceCents: parseFloat(e.target.value) * 100 })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{item.name}</h3>
                          {item.isSpecial && (
                            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                          )}
                          {!item.isAvailable && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                              SOLD OUT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        <p className="text-lg font-bold text-imboni-blue">
                          RWF {(item.priceCents / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAvailability(item.id, !item.isAvailable)}
                          className={`p-2 rounded-lg ${
                            item.isAvailable
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleSpecial(item.id, !item.isSpecial)}
                          className={`p-2 rounded-lg ${
                            item.isSpecial
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title={item.isSpecial ? 'Remove from Specials' : 'Mark as Special'}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </DashboardLayout>
  )
}
