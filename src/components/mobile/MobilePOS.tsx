'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRole } from '@/contexts/RoleContext'

interface Product {
  id: string
  code: string
  name: string
  price: number
  stock: number
  categoryId?: string
  category?: {
    name: string
  }
  image?: string
  description?: string
  isActive: boolean
}

interface CartItem {
  product: Product
  quantity: number
  subtotal: number
  notes?: string
  discount?: number
}

interface Category {
  id: string
  name: string
  icon?: string
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  rnc?: string
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  type: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK'
}

export default function MobilePOS() {
  const { user } = useRole()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [amountReceived, setAmountReceived] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    checkOnlineStatus()
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load offline cart if exists
    loadOfflineCart()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkOnlineStatus = () => {
    setIsOffline(!navigator.onLine)
  }

  const handleOnline = () => {
    setIsOffline(false)
    syncOfflineData()
  }

  const handleOffline = () => {
    setIsOffline(true)
    saveCartOffline()
  }

  const loadOfflineCart = () => {
    const offlineCart = localStorage.getItem('mobile_pos_cart')
    if (offlineCart) {
      try {
        const parsedCart = JSON.parse(offlineCart)
        setCart(parsedCart)
      } catch (error) {
        console.error('Error loading offline cart:', error)
      }
    }
  }

  const saveCartOffline = () => {
    localStorage.setItem('mobile_pos_cart', JSON.stringify(cart))
  }

  const syncOfflineData = async () => {
    const offlineSales = localStorage.getItem('mobile_pos_offline_sales')
    if (offlineSales) {
      try {
        const sales = JSON.parse(offlineSales)
        for (const sale of sales) {
          await processSale(sale, true) // Process as sync
        }
        localStorage.removeItem('mobile_pos_offline_sales')
        alert('Ventas offline sincronizadas exitosamente')
      } catch (error) {
        console.error('Error syncing offline data:', error)
      }
    }
  }

  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Efectivo', icon: '💵', type: 'CASH' },
    { id: 'card', name: 'Tarjeta', icon: '💳', type: 'CARD' },
    { id: 'transfer', name: 'Transferencia', icon: '📱', type: 'TRANSFER' },
    { id: 'check', name: 'Cheque', icon: '📄', type: 'CHECK' }
  ]

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/categories', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (productsRes.ok && categoriesRes.ok) {
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        
        setProducts(productsData.products || [])
        setCategories([{ id: 'all', name: 'Todos' }, ...(categoriesData.categories || [])])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
            : item
        )
      } else {
        return [...prevCart, { product, quantity: 1, subtotal: product.price }]
      }
    })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
          : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const processSale = async (saleData?: any, isSync: boolean = false) => {
    if (cart.length === 0 && !isSync) return

    setProcessing(true)
    try {
      const finalSaleData = saleData || {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discount: item.discount || 0,
          notes: item.notes || ''
        })),
        paymentMethod: paymentMethod?.type || 'CASH',
        paymentMethodName: paymentMethod?.name || 'Efectivo',
        amountReceived: amountReceived,
        customerId: customer?.id || null,
        customerName: customer?.name || 'Cliente General',
        customerPhone: customer?.phone || null,
        customerRNC: customer?.rnc || null,
        notes: notes,
        cashierName: user?.email || 'Cajero',
        timestamp: new Date().toISOString(),
        isOfflineSale: isOffline && !isSync
      }

      if (isOffline && !isSync) {
        // Save sale offline
        const offlineSales = JSON.parse(localStorage.getItem('mobile_pos_offline_sales') || '[]')
        offlineSales.push(finalSaleData)
        localStorage.setItem('mobile_pos_offline_sales', JSON.stringify(offlineSales))
        
        clearCart()
        alert('Venta guardada offline. Se sincronizará cuando regrese la conexión.')
        return
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(finalSaleData)
      })

      if (response.ok) {
        const sale = await response.json()
        if (!isSync) {
          clearCart()
          setShowPaymentModal(false)
          setCustomer(null)
          setPaymentMethod(null)
          setAmountReceived(0)
          setNotes('')
        }
        
        // Show success message
        alert(`Venta procesada exitosamente. NCF: ${sale.ncf || 'N/A'}`)
        
        // Send WhatsApp notification if customer has phone
        if (customer?.phone && !isSync) {
          sendWhatsAppNotification(sale, customer)
        }
      } else {
        throw new Error('Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      if (!isSync) {
        alert('Error al procesar la venta. Intente nuevamente.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const sendWhatsAppNotification = async (sale: any, customer: Customer) => {
    try {
      await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone: customer.phone,
          message: `¡Hola ${customer.name}! Tu compra #${sale.ncf} por RD$${sale.total.toLocaleString()} ha sido procesada exitosamente. ¡Gracias por tu preferencia!`,
          type: 'ORDER_CONFIRMATION'
        })
      })
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
    }
  }

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
        : item
    ))
    saveCartOffline()
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && product.stock > 0
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando POS Móvil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">POS Móvil</h1>
            <p className="text-sm text-gray-600">Hola, {user?.email}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button className="bg-blue-600 text-white p-2 rounded-full relative">
                <span className="text-lg">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Search and Categories */}
          <div className="bg-white shadow-sm p-4 space-y-3">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      Stock: {product.stock}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      RD${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-white shadow-lg border-l">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
              <button
                onClick={clearCart}
                className="text-red-600 text-sm font-medium hover:text-red-800"
                disabled={cart.length === 0}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64 lg:max-h-96">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🛒</div>
                <p>Carrito vacío</p>
                <p className="text-sm">Selecciona productos para agregar</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm flex-1">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        RD${item.product.price.toFixed(2)} c/u
                      </p>
                      <p className="font-semibold text-gray-900">
                        RD${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary and Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  RD${cartTotal.toFixed(2)}
                </span>
              </div>
              
              <button
                onClick={processSale}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  'Procesar Venta'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
