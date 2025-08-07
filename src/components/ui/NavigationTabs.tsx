'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationItem {
  name: string
  href: string
  icon: string
  description?: string
}

export default function NavigationTabs() {
  const [activeTab, setActiveTab] = useState('ventas')
  const pathname = usePathname()

  const tabs = [
    {
      id: 'ventas',
      name: 'Ventas',
      icon: '💰',
      items: [
        { name: 'Dashboard', href: '/', icon: '🏠', description: 'Panel principal' },
        { name: 'Nueva Venta', href: '/sales/new', icon: '🛒', description: 'Procesar nueva venta' },
        { name: 'Historial', href: '/sales', icon: '📋', description: 'Ver ventas realizadas' },
      ]
    },
    {
      id: 'inventario',
      name: 'Inventario',
      icon: '📦',
      items: [
        { name: 'Productos', href: '/products', icon: '📦', description: 'Gestionar productos' },
        { name: 'Categorías', href: '/categories', icon: '🏷️', description: 'Organizar categorías' },
        { name: 'Inventario Avanzado', href: '/inventory/advanced', icon: '📊', description: 'Control avanzado' },
      ]
    },
    {
      id: 'personas',
      name: 'Personas',
      icon: '👥',
      items: [
        { name: 'Clientes', href: '/customers', icon: '👥', description: 'Gestionar clientes' },
        { name: 'Empleados', href: '/employees', icon: '👨‍💼', description: 'Gestionar empleados' },
        { name: 'Control de Tiempo', href: '/employees/time-clock', icon: '⏰', description: 'Registro de tiempo' },
      ]
    },
    {
      id: 'sistema',
      name: 'Sistema',
      icon: '⚙️',
      items: [
        { name: 'Usuarios', href: '/users', icon: '👤', description: 'Gestionar usuarios' },
        { name: 'Hardware', href: '/hardware/management', icon: '🔧', description: 'Control de hardware' },
        { name: 'NCF Sequences', href: '/ncf-sequences', icon: '🔢', description: 'Secuencias NCF' },
        { name: 'Reportes', href: '/reports', icon: '📊', description: 'Ver reportes' },
        { name: 'Configuración', href: '/settings', icon: '⚙️', description: 'Configuración del sistema' },
      ]
    }
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Determine active tab based on current path
  React.useEffect(() => {
    const currentTab = tabs.find(tab => 
      tab.items.some(item => isActivePath(item.href))
    )
    if (currentTab) {
      setActiveTab(currentTab.id)
    }
  }, [pathname])

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header with Logo */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-xl">POS System</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">Sistema POS Dominicano</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 py-3 overflow-x-auto">
            {tabs.find(tab => tab.id === activeTab)?.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActivePath(item.href)
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
