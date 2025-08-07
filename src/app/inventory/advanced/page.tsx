'use client'

import React, { useState, useEffect } from 'react'
import { useRole } from '@/contexts/RoleContext'

interface InventoryAlert {
  id: string
  productId: string
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'REORDER_POINT'
  currentStock: number
  threshold: number
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  product: {
    id: string
    name: string
    code: string
    stock: number
    minStock: number
    price: number
  }
  createdAt: string
}

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
}

interface PurchaseOrder {
  id: string
  poNumber: string
  status: 'PENDING' | 'ORDERED' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  supplier: {
    name: string
  }
  createdAt: string
}

export default function InventoryAdvancedPage() {
  const { user, hasPermission: checkPermission } = useRole()
  const [selectedTab, setSelectedTab] = useState('alerts')
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if user doesn't have inventory permissions
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!checkPermission('inventory', 'view')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Acceso Denegado
          </div>
          <p className="text-red-700">
            No tienes permisos para acceder al control avanzado de inventario.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      
      // For now, using mock data since APIs aren't fully implemented
      const mockAlerts: InventoryAlert[] = [
        {
          id: '1',
          productId: 'prod1',
          alertType: 'LOW_STOCK',
          currentStock: 5,
          threshold: 10,
          message: 'Stock bajo - requiere reposición',
          severity: 'HIGH',
          product: {
            id: 'prod1',
            name: 'Coca Cola 2L',
            code: 'CC2L001',
            stock: 5,
            minStock: 10,
            price: 85.00,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          productId: 'prod2',
          alertType: 'OUT_OF_STOCK',
          currentStock: 0,
          threshold: 5,
          message: 'Producto agotado',
          severity: 'CRITICAL',
          product: {
            id: 'prod2',
            name: 'Agua Cristal 1L',
            code: 'AC1L001',
            stock: 0,
            minStock: 5,
            price: 25.00,
          },
          createdAt: new Date().toISOString(),
        },
      ]

      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'Distribuidora Nacional',
          email: 'ventas@distnacional.com.do',
          phone: '809-555-0123',
          isActive: true,
        },
        {
          id: '2',
          name: 'Coca Cola Dominicana',
          email: 'pedidos@cocacola.com.do',
          phone: '809-555-0456',
          isActive: true,
        },
      ]

      const mockPurchaseOrders: PurchaseOrder[] = [
        {
          id: '1',
          poNumber: 'PO-2025-001',
          status: 'PENDING',
          totalAmount: 15000.00,
          supplier: { name: 'Distribuidora Nacional' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          poNumber: 'PO-2025-002',
          status: 'ORDERED',
          totalAmount: 8500.00,
          supplier: { name: 'Coca Cola Dominicana' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]

      setAlerts(mockAlerts)
      setSuppliers(mockSuppliers)
      setPurchaseOrders(mockPurchaseOrders)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter alerts based on search and severity
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.product.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Filter purchase orders based on search
  const filteredPurchaseOrders = purchaseOrders.filter(order =>
    order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-900 text-lg">Cargando datos de inventario...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Avanzada de Inventario</h1>
          <p className="text-gray-600">Control inteligente de stock, proveedores y órdenes de compra</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'alerts'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🚨 Alertas de Inventario ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'suppliers'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏪 Proveedores ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'orders'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📋 Órdenes de Compra ({purchaseOrders.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Alertas de Inventario</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="ALL">Todas las severidades</option>
                    <option value="CRITICAL">Crítico</option>
                    <option value="HIGH">Alto</option>
                    <option value="MEDIUM">Medio</option>
                    <option value="LOW">Bajo</option>
                  </select>
                  {(searchTerm || severityFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSeverityFilter('ALL')
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                  🔄 Actualizar Alertas
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-6xl mb-4">
                    {searchTerm || severityFilter !== 'ALL' ? '🔍' : '✅'}
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">
                    {searchTerm || severityFilter !== 'ALL' ? 'No se encontraron alertas' : '¡Todo está en orden!'}
                  </h3>
                  <p>
                    {searchTerm || severityFilter !== 'ALL' 
                      ? 'Intenta ajustar los filtros de búsqueda' 
                      : 'No hay alertas de inventario en este momento'}
                  </p>
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <div key={alert.id} className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{alert.product.name}</h3>
                          <span className="text-sm text-gray-600">({alert.product.code})</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span>Stock Actual: <strong className="text-gray-900">{alert.currentStock}</strong></span>
                          <span>Mínimo: <strong className="text-gray-900">{alert.threshold}</strong></span>
                          <span>Precio: <strong className="text-gray-900">{formatCurrency(alert.product.price)}</strong></span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 shadow-sm">
                          Crear Orden
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 shadow-sm">
                          Resolver
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Proveedores</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar proveedores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {canManageSuppliers && (
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                    ➕ Nuevo Proveedor
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {supplier.email && (
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center space-x-2">
                        <span>📞</span>
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4">
                    {canManageSuppliers && (
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 shadow-sm">
                        Editar
                      </button>
                    )}
                    {canCreateOrders && (
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 shadow-sm">
                        Nueva Orden
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Órdenes de Compra</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar órdenes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {canCreateOrders && (
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                    ➕ Nueva Orden
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredPurchaseOrders.map(order => (
                <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.poNumber}</h3>
                      <p className="text-gray-600 text-sm">{order.supplier.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-semibold">{formatCurrency(order.totalAmount)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Fecha: {formatDate(order.createdAt)}</span>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors duration-200 shadow-sm">
                        Ver Detalles
                      </button>
                      {order.status === 'PENDING' && (
                        <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors duration-200 shadow-sm">
                          Enviar
                        </button>
                      )}
                      {order.status === 'ORDERED' && (
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors duration-200 shadow-sm">
                          Recibir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'CRITICAL').length}
            </div>
            <div className="text-gray-600 text-sm">Alertas Críticas</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.severity === 'HIGH').length}
            </div>
            <div className="text-gray-600 text-sm">Stock Bajo</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {purchaseOrders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-gray-600 text-sm">Órdenes Pendientes</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.isActive).length}
            </div>
            <div className="text-gray-600 text-sm">Proveedores Activos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
