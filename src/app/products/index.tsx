'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/ui/Navigation'
import { formatCurrency } from '@/utils/dominican-validators'

interface Product {
  id: string
  code: string
  name: string
  description?: string
  price: number
  cost?: number
  stock: number
  minStock: number
  isActive: boolean
  taxable: boolean
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    taxable: true,
    categoryId: '',
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('categoryId', selectedCategory)
      if (showLowStock) params.append('lowStock', 'true')
      
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, showLowStock])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProduct,
          categoryId: newProduct.categoryId || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Producto agregado exitosamente')
        setShowAddForm(false)
        setNewProduct({
          code: '',
          name: '',
          description: '',
          price: 0,
          cost: 0,
          stock: 0,
          minStock: 0,
          taxable: true,
          categoryId: '',
        })
        fetchProducts()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Add product error:', error)
      setMessage('Error al agregar producto')
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) return { text: 'Sin stock', color: 'text-red-600 bg-red-50' }
    if (product.stock <= product.minStock) return { text: 'Stock bajo', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'En stock', color: 'text-green-600 bg-green-50' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="products" />

      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-sm text-gray-600">Administrar inventario y productos</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Agregar Producto
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.includes('exitosamente') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lowStock"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="lowStock" className="text-sm text-gray-700">
                Solo stock bajo
              </label>
            </div>
            <div className="text-sm text-gray-600">
              Total: {products.length} productos
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
            const stockStatus = getStockStatus(product)
            return (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">Código: {product.code}</p>
                    {product.category && (
                      <p className="text-xs text-blue-600">{product.category.name}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.cost && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Costo:</span>
                      <span className="text-sm">{formatCurrency(product.cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`font-medium ${
                      product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {product.stock} / {product.minStock} min
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ITBIS:</span>
                    <span className={product.taxable ? 'text-green-600' : 'text-gray-400'}>
                      {product.taxable ? '18%' : 'Exento'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm hover:bg-blue-100">
                    Editar
                  </button>
                  <button className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded text-sm hover:bg-green-100">
                    Stock
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory || showLowStock
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Comienza agregando tu primer producto'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Agregar Nuevo Producto</h2>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.code}
                  onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({...newProduct, cost: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={newProduct.taxable}
                  onChange={(e) => setNewProduct({...newProduct, taxable: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="taxable" className="text-sm text-gray-700">
                  Aplica ITBIS (18%)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
