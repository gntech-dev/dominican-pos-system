'use client'

import { useState, useEffect } from 'react'
import { Loader2, Package, DollarSign, BarChart3, Tag, X } from 'lucide-react'

interface Product {
  id?: string
  code: string
  name: string
  description?: string
  price: number
  cost: number
  stock: number
  minStock: number
  taxable: boolean
  categoryId?: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  onSave: (product: Product) => void
}

export default function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<Product>({
    code: '',
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    taxable: true,
    categoryId: '',
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (product) {
        setFormData({
          ...product,
          description: product.description || '',
          categoryId: product.categoryId || '',
        })
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          price: 0,
          cost: 0,
          stock: 0,
          minStock: 0,
          taxable: true,
          categoryId: '',
          isActive: true,
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Código es requerido'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre es requerido'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Precio debe ser mayor a 0'
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock no puede ser negativo'
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'Stock mínimo no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        onSave(data.data)
        onClose()
      } else {
        const errorData = await response.json()
        if (errorData.details) {
          const fieldErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.path[0]] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: errorData.error || 'Error al guardar el producto' })
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      setErrors({ general: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const profitMargin = formData.cost > 0 ? ((formData.price - formData.cost) / formData.price * 100) : 0
  const profitAmount = formData.price - formData.cost

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <Package className="h-6 w-6" />
            <h2 className="text-xl font-bold">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <label htmlFor="code" className="block text-gray-800 font-semibold">
                Código *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.code ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="SKU-001"
                />
              </div>
              {errors.code && <p className="text-red-600 text-sm font-medium">{errors.code}</p>}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-gray-800 font-semibold">
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                placeholder="Nombre del producto"
              />
              {errors.name && <p className="text-red-600 text-sm font-medium">{errors.name}</p>}
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <label htmlFor="price" className="block text-gray-800 font-semibold">
                Precio de Venta (RD$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="text-red-600 text-sm font-medium">{errors.price}</p>}
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <label htmlFor="cost" className="block text-gray-800 font-semibold">
                Costo (RD$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.cost ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
              </div>
              {errors.cost && <p className="text-red-600 text-sm font-medium">{errors.cost}</p>}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label htmlFor="stock" className="block text-gray-800 font-semibold">
                Stock Actual *
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.stock ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="0"
                />
              </div>
              {errors.stock && <p className="text-red-600 text-sm font-medium">{errors.stock}</p>}
            </div>

            {/* Stock Mínimo */}
            <div className="space-y-2">
              <label htmlFor="minStock" className="block text-gray-800 font-semibold">
                Stock Mínimo *
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all ${errors.minStock ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="0"
                />
              </div>
              {errors.minStock && <p className="text-red-600 text-sm font-medium">{errors.minStock}</p>}
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-gray-800 font-semibold">
              Categoría
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="w-full px-3 py-3 border-2 rounded-xl bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium transition-all"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-gray-800 font-semibold">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-3 border-2 rounded-xl bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all min-h-[100px]"
              placeholder="Descripción del producto (opcional)"
            />
          </div>

          {/* Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ITBIS */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div>
                <label className="text-gray-800 font-semibold">Gravado con ITBIS</label>
                <p className="text-sm text-gray-700 font-medium">Aplicar 18% de impuesto sobre las ventas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.taxable}
                  onChange={(e) => handleInputChange('taxable', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Activo */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div>
                <label className="text-gray-800 font-semibold">Producto Activo</label>
                <p className="text-sm text-gray-700 font-medium">Disponible para ventas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Profit Analysis */}
          {formData.cost > 0 && formData.price > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <h4 className="font-semibold text-gray-800 mb-2">Análisis de Rentabilidad</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Margen:</span>
                  <span className={`ml-2 font-bold ${profitMargin >= 30 ? 'text-green-600' : profitMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Ganancia:</span>
                  <span className={`ml-2 font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    RD$ {profitAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? 'Actualizar' : 'Crear'} Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
