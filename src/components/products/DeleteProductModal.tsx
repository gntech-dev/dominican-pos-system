'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Package, X } from 'lucide-react'

interface Product {
  id: string
  code: string
  name: string
  price: number
  stock: number
}

interface DeleteProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onDelete: (productId: string) => void
}

export default function DeleteProductModal({ isOpen, onClose, product, onDelete }: DeleteProductModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar producto')
      }

      alert('Producto eliminado correctamente')

      onDelete(product.id)
      onClose()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar producto')
    } finally {
      setLoading(false)
    }
  }

  if (!product || !isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-red-200 shadow-2xl rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-semibold">Confirmar Eliminación</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-800 font-medium">
            Esta acción no se puede deshacer. El producto será eliminado permanentemente.
          </p>

          {/* Product Info */}
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-800 font-medium">Código: {product.code}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 font-medium">Precio: RD$ {product.price.toFixed(2)}</span>
                  <span className="text-gray-800 font-medium">Stock: {product.stock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50/80 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">¿Estás seguro?</p>
                <p>Una vez eliminado, no podrás recuperar este producto ni su historial.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-400 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar Producto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
