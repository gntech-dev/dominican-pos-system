'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavigationMinimal() {
  const pathname = usePathname()

  const quickActions = [
    { name: 'Nueva Venta', href: '/sales/new', icon: '🛒', primary: true },
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Productos', href: '/products', icon: '📦' },
    { name: 'Clientes', href: '/customers', icon: '👥' },
    { name: 'Reportes', href: '/reports', icon: '📊' },
  ]

  const secondaryActions = [
    { name: 'Empleados', href: '/employees', icon: '👨‍💼' },
    { name: 'Hardware', href: '/hardware/management', icon: '🔧' },
    { name: 'Config', href: '/settings', icon: '⚙️' },
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div>
              <div className="text-gray-900 font-bold text-xl">POS System</div>
              <div className="text-xs text-gray-500 -mt-1">República Dominicana</div>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  action.primary
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : isActivePath(action.href)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="hidden sm:block">{action.name}</span>
              </Link>
            ))}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {/* Secondary Actions */}
            {secondaryActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActivePath(action.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title={action.name}
              >
                <span>{action.icon}</span>
                <span className="hidden lg:block">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb / Context Bar */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>📍</span>
              <span className="font-medium">
                {pathname === '/' ? 'Dashboard Principal' : 
                 pathname === '/sales/new' ? 'Nueva Venta' :
                 pathname === '/sales' ? 'Historial de Ventas' :
                 pathname === '/products' ? 'Gestión de Productos' :
                 pathname === '/customers' ? 'Gestión de Clientes' :
                 pathname === '/employees' ? 'Gestión de Empleados' :
                 pathname === '/reports' ? 'Reportes y Análisis' :
                 'Sistema POS'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>🕒 {new Date().toLocaleTimeString('es-DO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
              <span>📅 {new Date().toLocaleDateString('es-DO')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
