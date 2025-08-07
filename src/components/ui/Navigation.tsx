'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRole, RoleGate } from '@/contexts/RoleContext'
import { ROLE_DESCRIPTIONS } from '@/lib/roles'
import CurrentDateTime from './CurrentDateTime'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, refreshUser, logout } = useRole()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRefHeader = useRef<HTMLDivElement>(null)
  const dropdownRefDashboard = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const headerContains = dropdownRefHeader.current?.contains(event.target as Node)
      const dashboardContains = dropdownRefDashboard.current?.contains(event.target as Node)
      
      if (!headerContains && !dashboardContains) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Clear token and user state regardless of API response
      localStorage.removeItem('token')
      logout() // Clear user context
      
      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear everything and redirect even if API fails
      localStorage.removeItem('token')
      logout()
      router.push('/login')
    }
  }

  // Handle redirect to login if no user is authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login')
    }
  }, [user, loading, pathname, router])

  // Don't render navigation on login page
  if (pathname === '/login') {
    return null
  }

  // Don't render navigation while loading user context
  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect via useEffect)
  if (!user) {
    return null
  }

  const mainSections = [
    {
      title: 'Gestión de Ventas',
      description: 'Procesar transacciones y gestionar operaciones de venta diarias',
      icon: '💼',
      color: 'from-blue-600 to-blue-700',
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      items: [
        { name: 'Panel Principal', href: '/', icon: '📊', desc: 'Resumen y análisis', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'REPORTER'] },
        { name: 'Nueva Venta', href: '/sales/new', icon: '🛒', desc: 'Procesar nueva transacción', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
        { name: 'Historial de Ventas', href: '/sales', icon: '📋', desc: 'Consultar registros de transacciones', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
      ]
    },
    {
      title: 'Centro de Inventario',
      description: 'Sistema completo de gestión de productos y stock',
      icon: '📦',
      color: 'from-emerald-600 to-emerald-700',
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { name: 'Catálogo de Productos', href: '/products', icon: '🏷️', desc: 'Gestionar productos y precios', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Categorías', href: '/categories', icon: '📂', desc: 'Organizar categorías de productos', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Control Avanzado', href: '/inventory/advanced', icon: '📈', desc: 'Alertas de stock y análisis', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    {
      title: 'Relaciones Comerciales',
      description: 'Gestión de clientes y administración de empleados',
      icon: '👥',
      color: 'from-purple-600 to-purple-700',
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { name: 'Base de Clientes', href: '/customers', icon: '🤝', desc: 'Gestionar información de clientes', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
        { name: 'Gestión de Empleados', href: '/employees', icon: '👨‍💼', desc: 'Administración de personal', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Control de Tiempo', href: '/employees/time-clock', icon: '⏰', desc: 'Gestión de tiempo de empleados', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    {
      title: 'Administración del Sistema',
      description: 'Herramientas de configuración y gestión del sistema',
      icon: '⚙️',
      color: 'from-slate-600 to-slate-700',
      roles: ['ADMIN'],
      items: [
        { name: 'Gestión de Usuarios', href: '/users', icon: '👤', desc: 'Administrar cuentas de usuario', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Control de Hardware', href: '/hardware/management', icon: '🖨️', desc: 'Gestión de dispositivos', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Reportes y Análisis', href: '/reports', icon: '📊', desc: 'Inteligencia de negocios', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'REPORTER'] },
        { name: 'Configuración del Sistema', href: '/settings', icon: '⚙️', desc: 'Configuración de aplicación', roles: ['ADMIN'] },
        { name: 'Secuencias NCF', href: '/ncf-sequences', icon: '🧾', desc: 'Control de documentos fiscales', roles: ['ADMIN'] },
      ]
    }
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Check if we're on a specific page (not dashboard)
  const isSpecificPage = pathname !== '/'

  if (isSpecificPage) {
    // Show professional header when on specific pages
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <span className="text-gray-900 font-bold text-xl">Business Suite</span>
                <div className="text-xs text-gray-500 -mt-1">Sistema Punto de Venta</div>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              {mainSections.filter(section => {
                // If user is not loaded yet, don't show any sections
                if (!user) return false
                // If section has no role restrictions, show to everyone
                if (!section.roles || section.roles.length === 0) return true
                // Otherwise check if user role is in allowed roles
                return section.roles.includes(user.role)
              }).map((section) => {
                const visibleItems = section.items.filter(item => {
                  // If user is not loaded yet, don't show any items
                  if (!user) return false
                  // If item has no role restrictions, show to everyone
                  if (!item.roles || item.roles.length === 0) return true
                  // Otherwise check if user role is in allowed roles
                  return item.roles.includes(user.role)
                })
                
                // Don't show section if no items are visible
                if (visibleItems.length === 0) return null
                
                return (
                  <div key={section.title} className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      <span className="text-base">{section.icon}</span>
                      <span className="hidden lg:block">{section.title}</span>
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-100 pb-2">
                          {section.description}
                        </div>
                        {visibleItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-start space-x-3 px-3 py-3 rounded-lg text-sm transition-colors mb-1 last:mb-0 ${
                              isActivePath(item.href)
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-base mt-0.5">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.name}</div>
                              {item.desc && (
                                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Profile Dropdown */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={dropdownRefHeader}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                    <div className="text-xs text-gray-500">
                      {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user?.email}</div>
                          <div className="text-sm text-gray-500">
                            {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mi Perfil</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show professional dashboard cards when on home page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-gray-900 font-bold text-xl">Business Suite</h1>
                <p className="text-gray-500 text-sm -mt-1">Sistema de Gestión Punto de Venta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <CurrentDateTime />
              
              {/* Profile Dropdown for Dashboard */}
              <div className="relative" ref={dropdownRefDashboard}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                    <div className="text-xs text-gray-500">
                      {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user?.email}</div>
                          <div className="text-sm text-gray-500">
                            {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mi Perfil</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Panel de Gestión Empresarial</h2>
          <p className="text-gray-600 text-lg">Suite completa de operaciones y gestión empresarial</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {mainSections.filter(section => {
            // If user is not loaded yet, don't show any sections
            if (!user) return false
            // If section has no role restrictions, show to everyone
            if (!section.roles || section.roles.length === 0) return true
            // Otherwise check if user role is in allowed roles
            return section.roles.includes(user.role)
          }).map((section) => {
            const visibleItems = section.items.filter(item => {
              // If user is not loaded yet, don't show any items
              if (!user) return false
              // If item has no role restrictions, show to everyone  
              if (!item.roles || item.roles.length === 0) return true
              // Otherwise check if user role is in allowed roles
              return item.roles.includes(user.role)
            });
            
            // Don't show section if no items are visible
            if (visibleItems.length === 0) return null;
            
            return (
              <div
                key={section.title}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                  <span className="text-white text-2xl">{section.icon}</span>
                </div>
                
                <h3 className="text-gray-900 font-bold text-lg mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{section.description}</p>
                
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 group"
                    >
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                          {item.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de Estadísticas Profesional */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ingresos de Hoy</p>
                <p className="text-gray-900 text-2xl font-bold">RD$15,750</p>
                <p className="text-emerald-600 text-sm font-medium mt-1">+12.5% desde ayer</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Productos Activos</p>
                <p className="text-gray-900 text-2xl font-bold">1,247</p>
                <p className="text-blue-600 text-sm font-medium mt-1">En inventario</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📦</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Clientes Registrados</p>
                <p className="text-gray-900 text-2xl font-bold">892</p>
                <p className="text-purple-600 text-sm font-medium mt-1">Base de datos</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Estado del Sistema</p>
                <p className="text-gray-900 text-2xl font-bold">En Línea</p>
                <p className="text-green-600 text-sm font-medium mt-1">Todos los sistemas operacionales</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
