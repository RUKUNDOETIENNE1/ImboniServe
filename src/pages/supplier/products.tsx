import { Plus, Edit, Trash2, Search, Package } from 'lucide-react'
import { useState } from 'react'

export default function SupplierProducts() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const products = [
    { id: 1, name: "Fresh Chicken", category: "Meat", unit: "kg", price: 8000, stock: 150, minStock: 50, status: "In Stock" },
    { id: 2, name: "Beef", category: "Meat", unit: "kg", price: 12000, stock: 80, minStock: 40, status: "In Stock" },
    { id: 3, name: "Potatoes", category: "Vegetables", unit: "kg", price: 500, stock: 200, minStock: 100, status: "In Stock" },
    { id: 4, name: "Onions", category: "Vegetables", unit: "kg", price: 600, stock: 120, minStock: 80, status: "In Stock" },
    { id: 5, name: "Tomatoes", category: "Vegetables", unit: "kg", price: 800, stock: 90, minStock: 60, status: "In Stock" },
    { id: 6, name: "Fanta", category: "Beverages", unit: "bottle", price: 800, stock: 300, minStock: 200, status: "In Stock" },
    { id: 7, name: "Coca Cola", category: "Beverages", unit: "bottle", price: 800, stock: 250, minStock: 200, status: "In Stock" },
    { id: 8, name: "Fish", category: "Seafood", unit: "kg", price: 10000, stock: 30, minStock: 50, status: "Low Stock" },
  ]

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add New Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Low Stock Items</p>
            <p className="text-2xl font-bold text-red-600">
              {products.filter(p => p.stock < p.minStock).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              RWF {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg">
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  product.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                  product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold">RWF {product.price.toLocaleString()}/{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-bold ${product.stock < product.minStock ? 'text-red-600' : 'text-green-600'}`}>
                    {product.stock} {product.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Stock:</span>
                  <span className="text-gray-900">{product.minStock} {product.unit}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
