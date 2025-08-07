'use client'

import { useState, useEffect } from 'react'
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
  category?: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
}

// Bulk Actions Dropdown Component
function BulkActionsDropdown({ 
  onPriceUpdate, 
  onStockUpdate, 
  onCategoryUpdate, 
  onExport,
  categories 
}: {
  onPriceUpdate: (type: 'percentage' | 'fixed', value: number) => void
  onStockUpdate: (type: 'set' | 'adjust', value: number) => void
  onCategoryUpdate: (categoryId: string) => void
  onExport: () => void
  categories: Category[]
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  
  const [priceType, setPriceType] = useState<'percentage' | 'fixed'>('percentage')
  const [priceValue, setPriceValue] = useState('')
  const [stockType, setStockType] = useState<'set' | 'adjust'>('adjust')
  const [stockValue, setStockValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <span>Acciones</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <button
              onClick={() => {
                setShowPriceModal(true)
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Actualizar Precios
            </button>
            <button
              onClick={() => {
                setShowStockModal(true)
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
              </svg>
              Actualizar Stock
            </button>
            <button
              onClick={() => {
                setShowCategoryModal(true)
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
              </svg>
              Cambiar Categoría
            </button>
            <hr className="my-2" />
            <button
              onClick={() => {
                onExport()
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>
      )}

      {/* Price Update Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actualizar Precios</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de actualización</label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad fija (RD$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {priceType === 'percentage' ? 'Porcentaje (%)' : 'Cantidad (RD$)'}
                </label>
                <input
                  type="number"
                  step={priceType === 'percentage' ? '0.1' : '0.01'}
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={priceType === 'percentage' ? '10' : '50.00'}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onPriceUpdate(priceType, parseFloat(priceValue) || 0)
                  setShowPriceModal(false)
                  setPriceValue('')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actualizar Stock</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de actualización</label>
                <select
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value as 'set' | 'adjust')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="adjust">Ajustar cantidad</option>
                  <option value="set">Establecer cantidad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stockType === 'adjust' ? 'Ajuste (+/-)' : 'Nueva cantidad'}
                </label>
                <input
                  type="number"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={stockType === 'adjust' ? '+10 o -5' : '100'}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowStockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onStockUpdate(stockType, parseInt(stockValue) || 0)
                  setShowStockModal(false)
                  setStockValue('')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Update Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Categoría</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onCategoryUpdate(selectedCategory)
                  setShowCategoryModal(false)
                  setSelectedCategory('')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<'price' | 'category' | 'stock' | null>(null)
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    stockMin: '',
    stockMax: '',
    categoryId: '',
    isActive: '',
    taxable: '',
  })
  
  // Quick filters
  const [quickFilters, setQuickFilters] = useState({
    lowStock: false,
    highValue: false,
    newProducts: false,
    noCategory: false,
    itbisExempt: false,
  })

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    taxable: true,
    categoryId: '',
    isActive: true
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, showLowStock, filters, quickFilters])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (showLowStock) params.append('lowStock', 'true')
      
      // Add advanced filters
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.isActive) params.append('isActive', filters.isActive)
      
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        let filteredProducts = data.data.products

        // Apply client-side filters
        if (filters.priceMin) {
          filteredProducts = filteredProducts.filter((p: Product) => p.price >= parseFloat(filters.priceMin))
        }
        if (filters.priceMax) {
          filteredProducts = filteredProducts.filter((p: Product) => p.price <= parseFloat(filters.priceMax))
        }
        if (filters.stockMin) {
          filteredProducts = filteredProducts.filter((p: Product) => p.stock >= parseInt(filters.stockMin))
        }
        if (filters.stockMax) {
          filteredProducts = filteredProducts.filter((p: Product) => p.stock <= parseInt(filters.stockMax))
        }
        if (filters.taxable) {
          filteredProducts = filteredProducts.filter((p: Product) => p.taxable === (filters.taxable === 'true'))
        }

        // Apply quick filters
        if (quickFilters.lowStock) {
          filteredProducts = filteredProducts.filter((p: Product) => p.stock <= p.minStock)
        }
        if (quickFilters.highValue) {
          filteredProducts = filteredProducts.filter((p: Product) => p.price >= 500) // High value threshold
        }
        if (quickFilters.noCategory) {
          filteredProducts = filteredProducts.filter((p: Product) => !p.category)
        }
        if (quickFilters.itbisExempt) {
          filteredProducts = filteredProducts.filter((p: Product) => !p.taxable)
        }

        setProducts(filteredProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        taxable: formData.taxable,
        categoryId: formData.categoryId || undefined,
        isActive: formData.isActive
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowProductModal(false)
        setEditingProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al guardar producto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar producto')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      taxable: true,
      categoryId: '',
      isActive: true
    })
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      taxable: product.taxable,
      categoryId: product.category?.id || '',
      isActive: product.isActive
    })
    setShowProductModal(true)
  }

  const openAddModal = () => {
    setEditingProduct(null)
    resetForm()
    setShowProductModal(true)
  }

  // Bulk operations functions
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  const selectAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleBulkPriceUpdate = async (type: 'percentage' | 'fixed', value: number) => {
    try {
      const token = localStorage.getItem('token')
      const updates = Array.from(selectedProducts).map(id => {
        const product = products.find(p => p.id === id)
        if (!product) return null
        
        const newPrice = type === 'percentage' 
          ? product.price * (1 + value / 100)
          : product.price + value
        
        return { id, price: Math.max(0, newPrice) }
      }).filter((update): update is { id: string; price: number } => update !== null)

      for (const update of updates) {
        await fetch(`/api/products/${update.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: update.price }),
        })
      }

      setSelectedProducts(new Set())
      fetchProducts()
      alert(`Precios actualizados para ${updates.length} productos`)
    } catch (error) {
      console.error('Error updating prices:', error)
      alert('Error al actualizar precios')
    }
  }

  const handleBulkStockUpdate = async (type: 'set' | 'adjust', value: number) => {
    try {
      const token = localStorage.getItem('token')
      const updates = Array.from(selectedProducts).map(id => {
        const product = products.find(p => p.id === id)
        if (!product) return null
        
        const newStock = type === 'set' ? value : product.stock + value
        return { id, stock: Math.max(0, newStock) }
      }).filter((update): update is { id: string; stock: number } => update !== null)

      for (const update of updates) {
        await fetch(`/api/products/${update.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stock: update.stock }),
        })
      }

      setSelectedProducts(new Set())
      fetchProducts()
      alert(`Stock actualizado para ${updates.length} productos`)
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Error al actualizar stock')
    }
  }

  const handleBulkCategoryUpdate = async (categoryId: string) => {
    try {
      const token = localStorage.getItem('token')
      const updates = Array.from(selectedProducts)

      for (const id of updates) {
        await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categoryId: categoryId || undefined }),
        })
      }

      setSelectedProducts(new Set())
      fetchProducts()
      alert(`Categoría actualizada para ${updates.length} productos`)
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error al actualizar categoría')
    }
  }

  const exportSelectedProducts = () => {
    const selectedProductData = products.filter(p => selectedProducts.has(p.id))
    
    const csvContent = [
      ['Código', 'Nombre', 'Descripción', 'Precio', 'Costo', 'Stock', 'Stock Min', 'Categoría', 'ITBIS', 'Estado'],
      ...selectedProductData.map(p => [
        p.code,
        p.name,
        p.description || '',
        p.price.toString(),
        p.cost?.toString() || '',
        p.stock.toString(),
        p.minStock.toString(),
        p.category?.name || '',
        p.taxable ? 'Sí' : 'No',
        p.isActive ? 'Activo' : 'Inactivo'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) return 'text-rose-700'
    if (product.stock <= product.minStock) return 'text-amber-700'
    return 'text-emerald-700'
  }

  const getStockText = (product: Product) => {
    if (product.stock <= 0) return 'Sin Stock'
    if (product.stock <= product.minStock) return 'Stock Bajo'
    return 'En Stock'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
          <p className="text-base text-gray-600 mt-1">Administrar inventario y productos</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 mb-6">
          {/* Main Filter Row */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar productos por código, nombre o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-700 bg-white/70 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-3 rounded-xl border font-medium transition-all duration-200 ${
                    showAdvancedFilters 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                      : 'bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Filtros
                </button>
                <button 
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="px-6 py-4 border-b border-slate-200/50 bg-slate-50/30">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQuickFilters({...quickFilters, lowStock: !quickFilters.lowStock})}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  quickFilters.lowStock
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Stock Bajo
              </button>
              
              <button
                onClick={() => setQuickFilters({...quickFilters, highValue: !quickFilters.highValue})}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  quickFilters.highValue
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Alto Valor
              </button>
              
              <button
                onClick={() => setQuickFilters({...quickFilters, noCategory: !quickFilters.noCategory})}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  quickFilters.noCategory
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Sin Categoría
              </button>
              
              <button
                onClick={() => setQuickFilters({...quickFilters, itbisExempt: !quickFilters.itbisExempt})}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  quickFilters.itbisExempt
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Sin ITBIS
              </button>

              {(Object.values(quickFilters).some(v => v) || Object.values(filters).some(v => v)) && (
                <button
                  onClick={() => {
                    setQuickFilters({ lowStock: false, highValue: false, newProducts: false, noCategory: false, itbisExempt: false })
                    setFilters({ priceMin: '', priceMax: '', stockMin: '', stockMax: '', categoryId: '', isActive: '', taxable: '' })
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200/50">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Min (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700 placeholder-slate-400"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Max (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700 placeholder-slate-400"
                    placeholder="999.99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Min</label>
                  <input
                    type="number"
                    value={filters.stockMin}
                    onChange={(e) => setFilters({...filters, stockMin: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700 placeholder-slate-400"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Max</label>
                  <input
                    type="number"
                    value={filters.stockMax}
                    onChange={(e) => setFilters({...filters, stockMax: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700 placeholder-slate-400"
                    placeholder="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700"
                  >
                    <option value="">Todas</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 text-slate-700"
                  >
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedProducts.size > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''} seleccionado{selectedProducts.size !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSelectedProducts(new Set())}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Limpiar selección
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <BulkActionsDropdown
                    onPriceUpdate={handleBulkPriceUpdate}
                    onStockUpdate={handleBulkStockUpdate}
                    onCategoryUpdate={handleBulkCategoryUpdate}
                    onExport={exportSelectedProducts}
                    categories={categories}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200/50">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={selectAllProducts}
                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-400 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    ITBIS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200/50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-600">
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando productos...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-600">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                        </svg>
                        <p className="text-lg font-medium text-slate-800 mb-2">No se encontraron productos</p>
                        <p className="text-slate-600">Agrega tu primer producto para comenzar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-all duration-150">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-400 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-slate-600 mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-mono font-medium">
                        {product.code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{formatCurrency(product.price)}</div>
                          {product.cost && (
                            <div className="text-xs text-slate-600 mt-1">
                              Costo: {formatCurrency(product.cost)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{product.stock}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            Min: {product.minStock}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <span className={`${getStockStatus(product)} font-semibold`}>
                            {getStockText(product)}
                          </span>
                          <div className="text-xs text-slate-600 mt-1">
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {product.category?.name || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.taxable 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.taxable ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-all duration-200 hover:bg-blue-50 px-2 py-1 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="font-medium">Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        {!loading && products.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-200/50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-600">Total Productos</div>
                  <div className="text-2xl font-bold text-slate-800">{products.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-200/50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Stock Bajo</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Sin Stock</div>
                  <div className="text-2xl font-bold text-red-600">
                    {products.filter(p => p.stock <= 0).length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Valor Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Precio de Venta (RD$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Costo (RD$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stock Actual *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Categoría
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        checked={formData.taxable}
                        onChange={(e) => setFormData({...formData, taxable: e.target.checked})}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">Sujeto a ITBIS (18%)</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">Producto activo</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false)
                      setEditingProduct(null)
                      resetForm()
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
