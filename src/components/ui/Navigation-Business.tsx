'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRole, RoleGate } from '@/contexts/RoleContext'
import { ROLE_DESCRIPTIONS } from '@/lib/roles'
import CurrentDateTime from './CurrentDateTime'

export default function NavigationBusiness() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, refreshUser, logout } = useRole()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
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

      localStorage.removeItem('token')
      logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
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

  // 🎯 NEW BUSINESS-ORIENTED MENU STRUCTURE
  const businessModules = [
    {
      title: 'Operaciones',
      description: 'Actividades diarias y transacciones del negocio',
      icon: '🏪',
      color: 'from-emerald-600 to-emerald-700',
      priority: 1,
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      items: [
        { name: 'Dashboard Principal', href: '/', icon: '📊', desc: 'Resumen del negocio', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'REPORTER'] },
        { name: 'Punto de Venta', href: '/sales/new', icon: '💳', desc: 'Procesar ventas', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
        { name: 'Historial de Ventas', href: '/sales', icon: '📋', desc: 'Consultar transacciones', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
      ]
    },
    {
      title: 'Inventario',
      description: 'Gestión completa de productos y stock',
      icon: '📦',
      color: 'from-blue-600 to-blue-700',
      priority: 2,
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { name: 'Productos', href: '/products', icon: '🏷️', desc: 'Catálogo y precios', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Categorías', href: '/categories', icon: '📂', desc: 'Organizar productos', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Proveedores', href: '/suppliers', icon: '🏭', desc: 'Gestión de proveedores', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Control Avanzado', href: '/inventory/advanced', icon: '📈', desc: 'Alertas de stock y análisis', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    {
      title: 'Clientes',
      description: 'Relaciones comerciales y gestión de clientes',
      icon: '🤝',
      color: 'from-purple-600 to-purple-700',
      priority: 3,
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      items: [
        { name: 'Base de Clientes', href: '/customers', icon: '👥', desc: 'Información y RNC', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
      ]
    },
    {
      title: 'Personal y Gestión',
      description: 'Empleados, reportes y administración del sistema',
      icon: '👨‍💼',
      color: 'from-orange-600 to-orange-700',
      priority: 4,
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { name: 'Empleados', href: '/employees', icon: '👤', desc: 'Gestión de personal', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Control de Horarios', href: '/employees/time-clock', icon: '⏰', desc: 'Asistencia y tiempo', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Usuarios del Sistema', href: '/users', icon: '🔐', desc: 'Cuentas y permisos', roles: ['ADMIN'] },
        { name: 'Reportes Financieros', href: '/reports', icon: '📈', desc: 'Análisis de ventas', roles: ['ADMIN', 'MANAGER', 'REPORTER'] },
        { name: 'Reportes DGII 606/607', href: '/dgii', icon: '📋', desc: 'Compras y Ventas XML', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Documentos Fiscales', href: '/ncf-sequences', icon: '🧾', desc: 'NCF y DGII', roles: ['ADMIN'] },
        { name: 'Configuración', href: '/settings', icon: '⚙️', desc: 'Parámetros del sistema y DGII', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Hardware', href: '/hardware/management', icon: '🖨️', desc: 'Impresoras y equipos', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    {
      title: 'Business Analytics',
      description: 'Análisis avanzado de datos y tendencias del negocio',
      icon: '📈',
      color: 'from-indigo-600 to-indigo-700',
      priority: 5,
      roles: ['ADMIN', 'MANAGER', 'REPORTER'],
      items: [
        { name: 'Tendencias de Ventas', href: '/analytics/sales-trends', icon: '📊', desc: 'Análisis de ventas y patrones', roles: ['ADMIN', 'MANAGER', 'REPORTER'] },
        { name: 'Rendimiento de Productos', href: '/analytics/product-performance', icon: '🏷️', desc: 'Análisis de inventario y rentabilidad', roles: ['ADMIN', 'MANAGER', 'REPORTER'] },
        { name: 'Insights de Clientes', href: '/analytics/customer-insights', icon: '👥', desc: 'Comportamiento y segmentación', roles: ['ADMIN', 'MANAGER', 'REPORTER'] },
      ]
    },
    {
      title: 'Finanzas',
      description: 'Gestión financiera y control de flujo de efectivo',
      icon: '💰',
      color: 'from-green-600 to-green-700',
      priority: 6,
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { name: 'Panel Financiero', href: '/finance', icon: '📊', desc: 'Dashboard financiero completo', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Flujo de Efectivo', href: '/finance/cashflow', icon: '💵', desc: 'Monitoreo de ingresos y gastos', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Gastos Operativos', href: '/finance/expenses', icon: '💸', desc: 'Control de gastos del negocio', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Impuestos DGII', href: '/finance/taxes', icon: '🏛️', desc: 'ITBIS y obligaciones fiscales', roles: ['ADMIN'] },
      ]
    }
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const toggleCardExpansion = (moduleTitle: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(moduleTitle)) {
      newExpanded.delete(moduleTitle)
    } else {
      newExpanded.add(moduleTitle)
    }
    setExpandedCards(newExpanded)
  }

  // Check if we're on a specific page (not dashboard)
  const isSpecificPage = pathname !== '/'

  if (isSpecificPage) {
    // Show responsive professional header when on specific pages
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Branding */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-sm sm:text-lg">P</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <span className="text-gray-900 font-bold text-lg lg:text-xl truncate">POS Business</span>
                <div className="text-xs sm:text-sm text-gray-500 -mt-1 hidden lg:block">Sistema Empresarial</div>
              </div>
            </Link>
            
            {/* Main Navigation Menu - Hidden on small screens */}
            <nav className="hidden xl:flex items-center space-x-1">
              {businessModules
                .filter(module => {
                  if (!user) return false
                  if (!module.roles || module.roles.length === 0) return true
                  return module.roles.includes(user.role)
                })
                .sort((a, b) => a.priority - b.priority)
                .slice(0, 4) // Reduce to 4 modules to prevent overflow
                .map((module) => {
                  const visibleItems = module.items.filter(item => {
                    if (!user) return false
                    if (!item.roles || item.roles.length === 0) return true
                    return item.roles.includes(user.role)
                  })
                  
                  if (visibleItems.length === 0) return null
                  
                  return (
                    <div key={module.title} className="relative group">
                      <button className="flex items-center space-x-1 px-2 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                        <span className="text-base">{module.icon}</span>
                        <span className="font-medium truncate max-w-20">{module.title}</span>
                        <svg className="w-3 h-3 transition-transform group-hover:rotate-180 duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Compact Dropdown */}
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-1 z-50">
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
                            <div className={`w-6 h-6 bg-gradient-to-br ${module.color} rounded-md flex items-center justify-center`}>
                              <span className="text-white text-sm">{module.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                              <p className="text-xs text-gray-500">{module.description}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1">
                            {visibleItems.slice(0, 5).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                                  isActivePath(item.href)
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-sm">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{item.name}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </nav>

            {/* Quick Actions - Responsive */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/sales/new"
                className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-md sm:rounded-lg hover:bg-emerald-700 transition-colors font-medium text-xs sm:text-sm shadow-sm hover:shadow-md"
              >
                <span className="text-sm sm:text-base">💳</span>
                <span className="hidden sm:inline">POS</span>
              </Link>
            </div>

            {/* Enhanced Profile Section - Responsive */}
            <div className="flex items-center space-x-2">
              {/* Notifications - Hidden on small screens */}
              <button className="hidden lg:block relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown - Responsive */}
              <div className="relative" ref={dropdownRefHeader}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.email}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Responsive Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg sm:rounded-xl shadow-2xl border border-gray-100 z-50 transform transition-all duration-200">
                    {/* Profile Header */}
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-t-lg sm:rounded-t-xl border-b border-emerald-200">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm sm:text-lg">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user?.email}</div>
                          <div className="text-xs sm:text-sm text-emerald-700 font-medium truncate">
                            {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Conectado</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2 sm:py-3">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 sm:px-6 py-2 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Mi Perfil</div>
                          <div className="text-xs text-gray-500">Configuración de cuenta</div>
                        </div>
                      </Link>
                      
                      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                        <Link
                          href="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 sm:px-6 py-2 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">Configuración</div>
                            <div className="text-xs text-gray-500">Preferencias del sistema</div>
                          </div>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 sm:px-6 py-2 sm:py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Cerrar Sesión</div>
                          <div className="text-xs text-red-500">Salir del sistema</div>
                        </div>
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

  // Show compact business dashboard when on home page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h1 className="text-gray-900 font-semibold text-lg">POS Business</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CurrentDateTime />
              
              {/* Compact Profile */}
              <div className="relative" ref={dropdownRefDashboard}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                  </div>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Compact Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                      <div className="text-xs text-gray-500">
                        {user?.role ? ROLE_DESCRIPTIONS[user.role]?.name : 'Usuario'}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Mi Perfil
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-emerald-600 text-lg">💰</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Ventas Hoy</p>
                <p className="text-gray-900 text-xl font-bold">RD$18,750</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">📦</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Stock</p>
                <p className="text-gray-900 text-xl font-bold">1,247</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 text-lg">🏛️</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">DGII</p>
                <p className="text-gray-900 text-xl font-bold">Activo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Business Modules */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {businessModules
            .filter(module => {
              if (!user) return false
              if (!module.roles || module.roles.length === 0) return true
              return module.roles.includes(user.role)
            })
            .sort((a, b) => a.priority - b.priority)
            .map((module) => {
              const visibleItems = module.items.filter(item => {
                if (!user) return false
                if (!item.roles || item.roles.length === 0) return true
                return item.roles.includes(user.role)
              });
              
              if (visibleItems.length === 0) return null;
              
              const isExpanded = expandedCards.has(module.title)
              const itemsToShow = isExpanded ? visibleItems : visibleItems.slice(0, 2)
              const hasMoreItems = visibleItems.length > 2
              
              return (
                <div
                  key={module.title}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center mb-3`}>
                    <span className="text-white text-xl">{module.icon}</span>
                  </div>
                  
                  <h3 className="text-gray-900 font-semibold text-base mb-2">{module.title}</h3>
                  
                  <div className="space-y-1">
                    {itemsToShow.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </Link>
                    ))}
                    
                    {hasMoreItems && (
                      <button
                        onClick={() => toggleCardExpansion(module.title)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors pt-1 w-full"
                      >
                        <span>
                          {isExpanded 
                            ? `Mostrar menos` 
                            : `+${visibleItems.length - 2} más`
                          }
                        </span>
                        <svg 
                          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  )
}
