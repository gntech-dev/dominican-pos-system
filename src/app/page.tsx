'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from './dashboard'

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return <Dashboard />
  }

  // If not authenticated, show welcome page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            POS <span className="text-blue-600">Dominicana</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Sistema de Punto de Venta Completo con Cumplimiento DGII
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Cumplimiento DGII</h3>
              <p className="text-gray-600">NCF automáticos, validación RNC, e impuestos ITBIS</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Gestión Completa</h3>
              <p className="text-gray-600">Inventario, ventas, clientes y reportes avanzados</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                // Clear any existing data and show dashboard in demo mode
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setIsAuthenticated(true)
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Ver Demo
            </button>
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cuentas de Prueba</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-red-50 p-3 rounded-lg">
                <strong className="text-red-700">Administrador</strong><br/>
                admin@pos.do<br/>
                admin123
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <strong className="text-yellow-700">Gerente</strong><br/>
                manager@pos.do<br/>
                manager123
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <strong className="text-green-700">Cajero</strong><br/>
                cashier@pos.do<br/>
                cashier123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
