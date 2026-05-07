import { useState } from 'react'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  available: boolean
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuBuilderProps {
  businessId: string
  onSave: (categories: MenuCategory[]) => void
  onCancel: () => void
}

export function MenuBuilder({ businessId, onSave, onCancel }: MenuBuilderProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      items: []
    }

    setCategories([...categories, newCategory])
    setNewCategoryName('')
  }

  const deleteCategory = (categoryId: string) => {
    if (!confirm('Delete this category and all its items?')) return
    setCategories(categories.filter(c => c.id !== categoryId))
  }

  const addItem = (categoryId: string) => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      description: '',
      price: 0,
      imageUrl: '',
      available: true
    }

    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ))
    setEditingItem(newItem.id)
  }

  const updateItem = (categoryId: string, itemId: string, updates: Partial<MenuItem>) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : cat
    ))
  }

  const deleteItem = (categoryId: string, itemId: string) => {
    if (!confirm('Delete this item?')) return
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
        : cat
    ))
  }

  const handleSave = () => {
    if (categories.length === 0) {
      alert('Please add at least one category')
      return
    }

    const hasItems = categories.some(cat => cat.items.length > 0)
    if (!hasItems) {
      alert('Please add at least one item')
      return
    }

    onSave(categories)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Build Your Menu</h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Save Menu
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCategory()}
          placeholder="New category name..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={addCategory}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                {editingCategory === category.id ? (
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => setCategories(categories.map(c =>
                      c.id === category.id ? { ...c, name: e.target.value } : c
                    ))}
                    onBlur={() => setEditingCategory(null)}
                    onKeyPress={(e) => e.key === 'Enter' && setEditingCategory(null)}
                    className="flex-1 px-2 py-1 border rounded"
                    autoFocus
                  />
                ) : (
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category.id)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {category.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(category.id, item.id, { name: e.target.value })}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border rounded"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(category.id, item.id, { description: e.target.value })}
                          placeholder="Description"
                          className="w-full px-3 py-2 border rounded"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={item.price / 100}
                            onChange={(e) => updateItem(category.id, item.id, { price: parseFloat(e.target.value) * 100 })}
                            placeholder="Price"
                            step="0.01"
                            className="px-3 py-2 border rounded"
                          />
                          <input
                            type="text"
                            value={item.imageUrl}
                            onChange={(e) => updateItem(category.id, item.id, { imageUrl: e.target.value })}
                            placeholder="Image URL (optional)"
                            className="px-3 py-2 border rounded"
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={(e) => updateItem(category.id, item.id, { available: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Available</span>
                        </label>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="w-full px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-600">{item.description}</div>
                          )}
                          <div className="text-sm font-semibold text-teal-600 mt-1">
                            {(item.price / 100).toFixed(2)} RWF
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteItem(category.id, item.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addItem(category.id)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 text-gray-600 hover:text-teal-600 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
