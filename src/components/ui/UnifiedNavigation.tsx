'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { Button } from './base/Button'
import { cn } from '@/lib/utils'

/**
 * Modern unified navigation component for Dominican POS system
 * Features:
 * - Collapsible sidebar for desktop
 * - Bottom navigation for mobile
 * - Role-based menu filtering
 * - Responsive design with proper touch targets
 * - WCAG accessibility compliance
 */

interface NavigationItem {
  id: string
  name: string
  href: string
  icon: string
  description?: string
  roles?: string[]
  badge?: number
}

interface NavigationSection {
  id: string
  title: string
  icon: string
  items: NavigationItem[]
  roles?: string[]
}

const navigationSections: NavigationSection[] = [
  {
    id: 'dashboard',
    title: 'Panel Principal',
    icon: '📊',
    items: [
      {
        id: 'home',
        name: 'Dashboard',
        href: '/',
        icon: '🏠',
        description: 'Resumen general del negocio',
      },
    ],
  },
  {
    id: 'sales',
    title: 'Ventas',
    icon: '💰',
    roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    items: [
      {
        id: 'new-sale',
        name: 'Nueva Venta',
        href: '/sales/new',
        icon: '🛒',
        description: 'Procesar nueva transacción',
        roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      },
      {
        id: 'sales-history',
        name: 'Historial',
        href: '/sales',
        icon: '📋',
        description: 'Ver transacciones anteriores',
        roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventario',
    icon: '📦',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      {
        id: 'products',
        name: 'Productos',
        href: '/products',
        icon: '🏷️',
        description: 'Gestionar catálogo de productos',
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        id: 'categories',
        name: 'Categorías',
        href: '/categories',
        icon: '📂',
        description: 'Organizar productos por categorías',
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'customers',
    title: 'Clientes',
    icon: '👥',
    roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    items: [
      {
        id: 'customers-list',
        name: 'Base de Clientes',
        href: '/customers',
        icon: '🤝',
        description: 'Gestionar información de clientes',
        roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      },
    ],
  },
  {
    id: 'dgii',
    title: 'DGII',
    icon: '🧾',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      {
        id: 'ncf-sequences',
        name: 'Secuencias NCF',
        href: '/ncf-sequences',
        icon: '🔢',
        description: 'Controlar documentos fiscales',
        roles: ['ADMIN'],
      },
      {
        id: 'dgii-reports',
        name: 'Reportes DGII',
        href: '/dgii-reports',
        icon: '📊',
        description: 'Informes para la DGII',
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reportes',
    icon: '📈',
    roles: ['ADMIN', 'MANAGER', 'REPORTER'],
    items: [
      {
        id: 'reports',
        name: 'Análisis',
        href: '/reports',
        icon: '📊',
        description: 'Reportes y análisis de negocio',
        roles: ['ADMIN', 'MANAGER', 'REPORTER'],
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administración',
    icon: '⚙️',
    roles: ['ADMIN'],
    items: [
      {
        id: 'users',
        name: 'Usuarios',
        href: '/users',
        icon: '👤',
        description: 'Gestionar cuentas de usuario',
        roles: ['ADMIN'],
      },
      {
        id: 'settings',
        name: 'Configuración',
        href: '/settings',
        icon: '⚙️',
        description: 'Configuración del sistema',
        roles: ['ADMIN'],
      },
    ],
  },
]

export default function UnifiedNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useRole()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't render on login page
  if (pathname === '/login') return null

  // Loading state
  if (loading) {
    return (
      <div className="flex h-16 items-center justify-center bg-white border-b border-neutral-200">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  // Not authenticated
  if (!user) return null

  const filteredSections = navigationSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.roles) return true
        return item.roles.includes(user.role)
      })
    }))
    .filter(section => {
      // Show section if user role matches or if section has visible items
      if (!section.roles) return section.items.length > 0
      return section.roles.includes(user.role) && section.items.length > 0
    })

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white border-r-2 border-neutral-300 shadow-lg transition-all duration-300 hidden lg:block',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b-2 border-neutral-300 bg-neutral-50">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 shadow-md">
                <span className="text-base font-bold text-white">POS</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-neutral-950">POS Dominicana</h1>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredSections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              {!sidebarCollapsed && (
                <div className="px-3 py-3 text-sm font-black text-neutral-900 uppercase tracking-wide">
                  <span className="mr-2 text-lg">{section.icon}</span>
                  {section.title}
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-3 text-base font-semibold rounded-lg transition-all duration-200',
                      'hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1',
                      'min-h-[44px]', // Accessibility touch target
                      pathname === item.href
                        ? 'bg-primary-100 text-primary-800 border-l-4 border-primary-600 shadow-sm'
                        : 'text-neutral-800 hover:text-neutral-900 hover:bg-neutral-50'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <span className="text-xl mr-3 shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-neutral-950">{item.name}</div>
                        {item.description && (
                          <div className="text-sm font-medium text-neutral-800 mt-0.5">{item.description}</div>
                        )}
                      </div>
                    )}
                    {item.badge && !sidebarCollapsed && (
                      <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-neutral-300 p-4">
          <div className="flex items-center space-x-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 shadow-sm">
              <span className="text-base font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-lg font-black text-neutral-950 truncate">
                  {user.email}
                </div>
                <div className="text-base font-bold text-primary-800">{user.role}</div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 hover:bg-neutral-200 hover:text-neutral-900"
              title="Cerrar sesión"
            >
              <span className="text-lg">🚪</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b-2 border-neutral-300 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="hover:bg-neutral-100"
            >
              <span className="text-xl">☰</span>
            </Button>
            <h1 className="text-xl font-black text-neutral-950">POS Dominicana</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="hover:bg-neutral-100"
          >
            <span className="text-lg">🚪</span>
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same sidebar content but for mobile */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <h1 className="text-lg font-semibold">POS Dominicana</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl">✕</span>
              </Button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredSections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <div className="px-3 py-3 text-sm font-black text-neutral-900 uppercase tracking-wide">
                    <span className="mr-2 text-lg">{section.icon}</span>
                    {section.title}
                  </div>
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-3 text-base font-semibold rounded-lg transition-all duration-200',
                        'min-h-[44px]', // Accessibility touch target
                        pathname === item.href
                          ? 'bg-primary-100 text-primary-800 border-l-4 border-primary-600 shadow-sm'
                          : 'text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900'
                      )}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      <div>
                        <div className="font-black text-neutral-950">{item.name}</div>
                        {item.description && (
                          <div className="text-sm font-medium text-neutral-800 mt-0.5">{item.description}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className={cn('lg:ml-72', sidebarCollapsed && 'lg:ml-16')}>
        {/* Add padding for mobile header */}
        <div className="lg:hidden h-16" />
      </div>
    </>
  )
}
