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

interface NavigationGroup {
  title: string
  items: NavigationItem[]
  isExpanded?: boolean
}

export default function NavigationSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Ventas', 'Inventario'])
  const pathname = usePathname()

  const navigationGroups: NavigationGroup[] = [
    {
      title: 'Ventas',
      items: [
        { name: 'Dashboard', href: '/', icon: '🏠', description: 'Panel principal' },
        { name: 'Nueva Venta', href: '/sales/new', icon: '🛒', description: 'Procesar nueva venta' },
        { name: 'Historial', href: '/sales', icon: '📋', description: 'Ver ventas realizadas' },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Productos', href: '/products', icon: '📦', description: 'Gestionar productos' },
        { name: 'Categorías', href: '/categories', icon: '🏷️', description: 'Organizar categorías' },
        { name: 'Inventario Avanzado', href: '/inventory/advanced', icon: '📊', description: 'Control avanzado' },
      ]
    },
    {
      title: 'Personas',
      items: [
        { name: 'Clientes', href: '/customers', icon: '👥', description: 'Gestionar clientes' },
        { name: 'Empleados', href: '/employees', icon: '👨‍💼', description: 'Gestionar empleados' },
        { name: 'Control de Tiempo', href: '/employees/time-clock', icon: '⏰', description: 'Registro de tiempo' },
      ]
    },
    {
      title: 'Sistema',
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

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-white font-bold text-xl">POS System</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {!isCollapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span>{group.title}</span>
                <span className={`transition-transform ${expandedGroups.includes(group.title) ? 'rotate-90' : ''}`}>
                  →
                </span>
              </button>
            )}
            
            {(isCollapsed || expandedGroups.includes(group.title)) && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {!isCollapsed && (
                      <div>
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400">{item.description}</div>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            Sistema POS v1.0
          </div>
        </div>
      )}
    </div>
  )
}
