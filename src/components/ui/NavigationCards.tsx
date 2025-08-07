'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavigationCards() {
  const pathname = usePathname()

  const mainSections = [
    {
      title: 'Centro de Ventas',
      description: 'Procesar transacciones y gestionar ventas diarias',
      icon: '🛒',
      color: 'from-emerald-500 to-teal-600',
      items: [
        { name: 'Panel Principal', href: '/', icon: '🏠', desc: 'Vista general del sistema' },
        { name: 'Nueva Venta', href: '/sales/new', icon: '💳', desc: 'Procesar venta con NCF' },
        { name: 'Historial de Ventas', href: '/sales', icon: '📋', desc: 'Ver transacciones realizadas' },
      ]
    },
    {
      title: 'Gestión de Inventario',
      description: 'Control completo de productos, stock y categorías',
      icon: '📦',
      color: 'from-blue-500 to-indigo-600',
      items: [
        { name: 'Catálogo de Productos', href: '/products', icon: '📦', desc: 'Gestionar productos y precios' },
        { name: 'Categorías', href: '/categories', icon: '🏷️', desc: 'Organizar clasificaciones' },
        { name: 'Control Avanzado', href: '/inventory/advanced', icon: '📊', desc: 'Alertas y análisis de stock' },
      ]
    },
    {
      title: 'Recursos Humanos',
      description: 'Administración de personal y control de tiempo',
      icon: '👥',
      color: 'from-violet-500 to-purple-600',
      items: [
        { name: 'Base de Clientes', href: '/customers', icon: '🤝', desc: 'Gestionar clientes y RNC' },
        { name: 'Equipo de Trabajo', href: '/employees', icon: '👨‍💼', desc: 'Administrar empleados' },
        { name: 'Control de Asistencia', href: '/employees/time-clock', icon: '⏰', desc: 'Registro de horarios' },
      ]
    },
    {
      title: 'Centro de Control',
      description: 'Configuración del sistema y herramientas administrativas',
      icon: '⚙️',
      color: 'from-orange-500 to-amber-600',
      items: [
        { name: 'Usuarios del Sistema', href: '/users', icon: '👤', desc: 'Gestionar accesos y roles' },
        { name: 'Hardware POS', href: '/hardware/management', icon: '🖨️', desc: 'Impresoras y dispositivos' },
        { name: 'Reportes y Análisis', href: '/reports', icon: '📈', desc: 'Informes de negocio' },
        { name: 'Configuraciones', href: '/settings', icon: '⚙️', desc: 'Ajustes del sistema' },
        { name: 'Secuencias NCF', href: '/ncf-sequences', icon: '🔢', desc: 'Control fiscal DGII' },
      ]
    }
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Check if we're on a specific page (not dashboard)
  const isSpecificPage = pathname !== '/'

  if (isSpecificPage) {
    // Show minimal header when on specific pages
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-gray-900 font-bold text-xl">POS System</span>
            </Link>
            
            <nav className="flex items-center space-x-4">
              {mainSections.map((section) => (
                <div key={section.title} className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <span className="text-lg">{section.icon}</span>
                    <span>{section.title}</span>
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {section.description}
                      </div>
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-start space-x-3 px-3 py-3 rounded-lg text-sm transition-colors mb-1 last:mb-0 ${
                            isActivePath(item.href)
                              ? 'bg-blue-100 text-blue-700'
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
              ))}
            </nav>
          </div>
        </div>
      </div>
    )
  }

  // Show dashboard cards when on home page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl">Sistema POS</h1>
                <p className="text-blue-200 text-sm">República Dominicana - DGII Compliant</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white text-sm">
                {new Date().toLocaleDateString('es-DO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-blue-200 text-sm">
                {new Date().toLocaleTimeString('es-DO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Centro de Control POS</h2>
          <p className="text-blue-200 text-lg">Sistema integral para gestión comercial dominicana</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mainSections.map((section) => (
            <div
              key={section.title}
              className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-white text-2xl">{section.icon}</span>
              </div>
              
              <h3 className="text-white font-bold text-xl mb-2">{section.title}</h3>
              <p className="text-blue-200 text-sm mb-6">{section.description}</p>
              
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                  >
                    <span className="text-lg mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Ventas de Hoy</p>
                <p className="text-white text-2xl font-bold">RD$ 15,750</p>
                <p className="text-green-400 text-xs mt-1">+12% vs ayer</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Productos Activos</p>
                <p className="text-white text-2xl font-bold">1,247</p>
                <p className="text-blue-400 text-xs mt-1">En inventario</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-xl">📦</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Clientes Registrados</p>
                <p className="text-white text-2xl font-bold">892</p>
                <p className="text-purple-400 text-xs mt-1">Base de datos</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">NCF Disponibles</p>
                <p className="text-white text-2xl font-bold">B01: 250</p>
                <p className="text-orange-400 text-xs mt-1">Comprobantes fiscales</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 text-xl">🧾</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
