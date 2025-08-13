'use client'

import React, { useState, useEffect } from 'react'
import { useRole } from '@/contexts/RoleContext'
import { Button } from '@/components/ui/base/Button'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

/**
 * Modern Dashboard for Dominican POS System
 * Features:
 * - Real-time metrics and KPIs
 * - Quick action buttons
 * - Recent activity feed
 * - Role-based widget display
 * - Responsive grid layout
 */

interface DashboardMetric {
  id: string
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral' | 'warning'
  icon: string
  description?: string
  roles?: string[]
}

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  roles?: string[]
}

interface RecentActivity {
  id: string
  type: string
  description: string
  time: string
  icon: string
  amount?: number
}

export default function ModernDashboard() {
  const { user, loading } = useRole()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Mock data - Replace with real API calls
  const metrics: DashboardMetric[] = [
    {
      id: 'daily_sales',
      title: 'Ventas del Día',
      value: formatCurrency(15650.00),
      change: 12.5,
      changeType: 'increase',
      icon: '💰',
      description: 'Comparado con ayer',
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'transactions',
      title: 'Transacciones',
      value: 47,
      change: -3.2,
      changeType: 'decrease',
      icon: '🧾',
      description: 'Total de transacciones hoy',
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'avg_ticket',
      title: 'Ticket Promedio',
      value: formatCurrency(332.98),
      change: 8.1,
      changeType: 'increase',
      icon: '📊',
      description: 'Promedio por transacción',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'inventory_alerts',
      title: 'Alertas de Stock',
      value: 5,
      changeType: 'warning',
      icon: '⚠️',
      description: 'Productos con stock bajo',
      roles: ['ADMIN', 'MANAGER'],
    },
  ]

  const quickActions: QuickAction[] = [
    {
      id: 'new_sale',
      title: 'Nueva Venta',
      description: 'Procesar una nueva transacción',
      href: '/sales/new',
      icon: '🛒',
      variant: 'primary',
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'add_product',
      title: 'Agregar Producto',
      description: 'Añadir producto al inventario',
      href: '/products/new',
      icon: '📦',
      variant: 'secondary',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'daily_report',
      title: 'Reporte Diario',
      description: 'Ver resumen del día',
      href: '/reports/daily',
      icon: '📈',
      variant: 'success',
      roles: ['ADMIN', 'MANAGER', 'REPORTER'],
    },
    {
      id: 'ncf_status',
      title: 'Estado NCF',
      description: 'Verificar secuencias NCF',
      href: '/ncf-sequences',
      icon: '🧾',
      variant: 'warning',
      roles: ['ADMIN'],
    },
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'sale',
      description: 'Venta completada - Cliente: Juan Pérez',
      time: '10:30',
      icon: '✅',
      amount: 1250.00,
    },
    {
      id: '2',
      type: 'inventory',
      description: 'Stock actualizado - Producto: Laptop Dell',
      time: '10:15',
      icon: '📦',
    },
    {
      id: '3',
      type: 'sale',
      description: 'Venta completada - Cliente: María García',
      time: '10:05',
      icon: '✅',
      amount: 850.50,
    },
    {
      id: '4',
      type: 'alert',
      description: 'Alerta de stock bajo - Producto: Mouse Logitech',
      time: '09:45',
      icon: '⚠️',
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredMetrics = metrics.filter(metric => 
    !metric.roles || metric.roles.includes(user.role)
  )

  const filteredQuickActions = quickActions.filter(action => 
    !action.roles || action.roles.includes(user.role)
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Bienvenido, {user.email} • {formatDate(currentTime)} {currentTime.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="sm">
            📊 Ver Reportes
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            🛒 Nueva Venta
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">{metric.icon}</span>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 truncate">
                    {metric.title}
                  </dt>
                  <dd className="text-2xl font-bold text-neutral-900">
                    {metric.value}
                  </dd>
                </dl>
              </div>
            </div>
            
            {metric.change && (
              <div className="mt-4 flex items-center">
                <span
                  className={cn(
                    'text-sm font-medium',
                    metric.changeType === 'increase' && 'text-green-600',
                    metric.changeType === 'decrease' && 'text-red-600',
                    metric.changeType === 'neutral' && 'text-neutral-600',
                    metric.changeType === 'warning' && 'text-yellow-600'
                  )}
                >
                  {metric.changeType === 'increase' && '↗ +'}
                  {metric.changeType === 'decrease' && '↘ '}
                  {metric.change}%
                </span>
                {metric.description && (
                  <span className="ml-2 text-xs text-neutral-500">
                    {metric.description}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredQuickActions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="group bg-white rounded-lg border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all"
            >
              <div className="flex items-center">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600">
                    {action.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
            <div className="divide-y divide-neutral-200">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-neutral-50">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 text-lg">{activity.icon}</span>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {activity.description}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-neutral-500">
                        <span>{activity.time}</span>
                        {activity.amount && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(activity.amount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-200">
              <Button variant="outline" size="sm" className="w-full">
                Ver Toda la Actividad
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Resumen Rápido
          </h2>
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Productos activos</span>
              <span className="text-lg font-semibold text-neutral-900">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Clientes registrados</span>
              <span className="text-lg font-semibold text-neutral-900">589</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Ventas este mes</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(347250.00)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">NCF disponibles</span>
              <span className="text-lg font-semibold text-primary-600">49,999,876</span>
            </div>
            
            <div className="pt-4 border-t border-neutral-200">
              <Button variant="outline" className="w-full">
                📊 Ver Reportes Detallados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
