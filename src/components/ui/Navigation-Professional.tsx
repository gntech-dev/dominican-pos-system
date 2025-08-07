'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const mainSections = [
    {
      title: 'Sales Management',
      description: 'Process transactions and manage daily sales operations',
      icon: '💼',
      color: 'from-blue-600 to-blue-700',
      items: [
        { name: 'Dashboard', href: '/', icon: '📊', desc: 'Overview and analytics' },
        { name: 'New Sale', href: '/sales/new', icon: '🛒', desc: 'Process new transaction' },
        { name: 'Sales History', href: '/sales', icon: '📋', desc: 'View transaction records' },
      ]
    },
    {
      title: 'Inventory Control',
      description: 'Complete product and stock management system',
      icon: '📦',
      color: 'from-emerald-600 to-emerald-700',
      items: [
        { name: 'Product Catalog', href: '/products', icon: '🏷️', desc: 'Manage products and pricing' },
        { name: 'Categories', href: '/categories', icon: '📂', desc: 'Organize product categories' },
        { name: 'Advanced Control', href: '/inventory/advanced', icon: '📈', desc: 'Stock alerts and analytics' },
      ]
    },
    {
      title: 'Customer Relations',
      description: 'Client management and employee administration',
      icon: '👥',
      color: 'from-purple-600 to-purple-700',
      items: [
        { name: 'Customer Database', href: '/customers', icon: '🤝', desc: 'Manage customer information' },
        { name: 'Employee Management', href: '/employees', icon: '👨‍💼', desc: 'Staff administration' },
        { name: 'Time Tracking', href: '/employees/time-clock', icon: '⏰', desc: 'Employee time management' },
      ]
    },
    {
      title: 'System Administration',
      description: 'Configuration and system management tools',
      icon: '⚙️',
      color: 'from-slate-600 to-slate-700',
      items: [
        { name: 'User Management', href: '/users', icon: '👤', desc: 'Manage user accounts' },
        { name: 'Hardware Control', href: '/hardware/management', icon: '🖨️', desc: 'Device management' },
        { name: 'Reports & Analytics', href: '/reports', icon: '📊', desc: 'Business intelligence' },
        { name: 'System Settings', href: '/settings', icon: '⚙️', desc: 'Application configuration' },
        { name: 'NCF Sequences', href: '/ncf-sequences', icon: '🧾', desc: 'Fiscal document control' },
      ]
    },
    {
      title: 'Business Analytics',
      description: 'Advanced analytics and business intelligence tools',
      icon: '📈',
      color: 'from-indigo-600 to-indigo-700',
      items: [
        { name: 'Sales Trends', href: '/analytics/sales-trends', icon: '📊', desc: 'Sales pattern analysis' },
        { name: 'Product Performance', href: '/analytics/product-performance', icon: '🏷️', desc: 'Product analytics & inventory insights' },
        { name: 'Customer Insights', href: '/analytics/customers', icon: '👥', desc: 'Customer behavior (Coming Soon)' },
        { name: 'Financial Reports', href: '/analytics/financial', icon: '💰', desc: 'Profit analysis (Coming Soon)' },
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
                <div className="text-xs text-gray-500 -mt-1">Point of Sale System</div>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              {mainSections.map((section) => (
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
                      {section.items.map((item) => (
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
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
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
                <p className="text-gray-500 text-sm -mt-1">Point of Sale Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-gray-900 text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-gray-500 text-sm">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Business Management Dashboard</h2>
          <p className="text-gray-600 text-lg">Complete business operations and management suite</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {mainSections.map((section) => (
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
                {section.items.map((item) => (
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
          ))}
        </div>

        {/* Professional Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Today's Revenue</p>
                <p className="text-gray-900 text-2xl font-bold">$15,750</p>
                <p className="text-emerald-600 text-sm font-medium mt-1">+12.5% from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Products</p>
                <p className="text-gray-900 text-2xl font-bold">1,247</p>
                <p className="text-blue-600 text-sm font-medium mt-1">In inventory</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📦</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Registered Customers</p>
                <p className="text-gray-900 text-2xl font-bold">892</p>
                <p className="text-purple-600 text-sm font-medium mt-1">Customer database</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">System Status</p>
                <p className="text-gray-900 text-2xl font-bold">Online</p>
                <p className="text-green-600 text-sm font-medium mt-1">All systems operational</p>
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
