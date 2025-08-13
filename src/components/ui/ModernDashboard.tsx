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
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-neutral-200 p-6 rounded-lg border-4 border-neutral-800 shadow-xl">
        <div>
          <h1 className="text-4xl font-black text-neutral-950 drop-shadow-sm">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-neutral-900 font-bold">
            Bienvenido, {user.email} • {formatDate(currentTime)} {currentTime.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="lg" className="font-black border-4 border-neutral-800 hover:bg-neutral-800 hover:text-white">
            📊 Ver Reportes
          </Button>
          <Button size="lg" variant="success" className="font-black shadow-lg">
            🛒 Nueva Venta
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-neutral-100 rounded-lg border-4 border-neutral-800 p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:border-primary-600 hover:bg-neutral-50"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl drop-shadow-sm">{metric.icon}</span>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-lg font-black text-neutral-950 truncate uppercase tracking-wide">
                    {metric.title}
                  </dt>
                  <dd className="text-4xl font-black text-neutral-950 drop-shadow-sm">
                    {metric.value}
                  </dd>
                </dl>
              </div>
            </div>
            
            {metric.change && (
              <div className="mt-4 flex items-center">
                <span
                  className={cn(
                    'text-base font-black px-2 py-1 rounded',
                    metric.changeType === 'increase' && 'text-white bg-green-800',
                    metric.changeType === 'decrease' && 'text-white bg-red-800',
                    metric.changeType === 'neutral' && 'text-white bg-neutral-800',
                    metric.changeType === 'warning' && 'text-white bg-yellow-800'
                  )}
                >
                  {metric.changeType === 'increase' && '↗ +'}
                  {metric.changeType === 'decrease' && '↘ '}
                  {metric.change}%
                </span>
                {metric.description && (
                  <span className="ml-2 text-base font-black text-neutral-950">
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
        <h2 className="text-xl font-bold text-neutral-950 mb-4">
          Acciones Rápidas
        </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuickActions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="group block p-6 bg-neutral-100 border-4 border-neutral-800 rounded-lg hover:bg-neutral-50 hover:border-primary-600 transition-all duration-200 hover:shadow-xl"
            >
              <div className="flex items-center">
                <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-sm">
                  {action.icon}
                </span>
                <div className="ml-4">
                  <h3 className="text-lg font-black text-neutral-950 group-hover:text-primary-800 uppercase tracking-wide">
                    {action.title}
                  </h3>
                  <p className="text-base font-bold text-neutral-900 mt-1">
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
          <h2 className="text-xl font-black text-neutral-950 mb-4 uppercase tracking-wide">
            Actividad Reciente
          </h2>
          <div className="bg-neutral-100 rounded-lg border-4 border-neutral-800 shadow-xl">
            <div className="divide-y-4 divide-neutral-300">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 text-2xl drop-shadow-sm">{activity.icon}</span>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-base font-black text-neutral-950">
                        {activity.description}
                      </p>
                      <div className="mt-2 flex items-center text-sm font-bold text-neutral-900">
                        <span>{activity.time}</span>
                        {activity.amount && (
                          <>
                            <span className="mx-2 text-lg">•</span>
                            <span className="font-black text-green-800 bg-green-100 px-2 py-1 rounded">
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
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-xl font-black text-neutral-950 mb-4 uppercase tracking-wide">
            Resumen Rápido
          </h2>
          <div className="bg-neutral-100 rounded-lg border-4 border-neutral-800 shadow-xl p-6 space-y-6">
            <div className="flex justify-between items-center py-2 border-b-2 border-neutral-300">
              <span className="text-base font-bold text-neutral-950">Productos activos</span>
              <span className="text-xl font-black text-neutral-950 bg-neutral-200 px-3 py-1 rounded">1,247</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-2 border-neutral-300">
              <span className="text-base font-bold text-neutral-950">Clientes registrados</span>
              <span className="text-xl font-black text-neutral-950 bg-neutral-200 px-3 py-1 rounded">589</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-2 border-neutral-300">
              <span className="text-base font-bold text-neutral-950">Ventas este mes</span>
              <span className="text-xl font-black text-white bg-green-800 px-3 py-1 rounded shadow-sm">
                {formatCurrency(347250.00)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-2 border-neutral-300">
              <span className="text-base font-bold text-neutral-950">NCF disponibles</span>
              <span className="text-xl font-black text-white bg-primary-800 px-3 py-1 rounded shadow-sm">49,999,876</span>
            </div>
            
            <div className="pt-6 border-t-4 border-neutral-800">
              <Button variant="outline" className="w-full text-lg font-black border-4 border-neutral-800 hover:bg-neutral-800 hover:text-white">
                📊 Ver Reportes Detallados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
