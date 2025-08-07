'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  type: 'OPERATIONAL' | 'INVENTORY' | 'UTILITIES' | 'RENT' | 'SALARIES' | 'OTHER'
  paymentMethod: string
  vendor?: string
  reference?: string
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'OPERATIONAL' as const,
    paymentMethod: 'CASH',
    vendor: '',
    reference: ''
  })

  // Mock data for now
  useEffect(() => {
    const mockExpenses: Expense[] = [
      {
        id: '1',
        category: 'Salarios',
        description: 'Pago de empleados - julio 2025',
        amount: 45000,
        date: new Date().toISOString(),
        type: 'SALARIES',
        paymentMethod: 'Transferencia',
        vendor: 'Nómina',
        reference: 'PAY-2025-07'
      },
      {
        id: '2',
        category: 'Alquiler',
        description: 'Renta del local comercial',
        amount: 25000,
        date: new Date().toISOString(),
        type: 'RENT',
        paymentMethod: 'Efectivo',
        vendor: 'Inmobiliaria Central',
        reference: 'RENT-001'
      },
      {
        id: '3',
        category: 'Servicios',
        description: 'Electricidad y agua',
        amount: 8500,
        date: new Date().toISOString(),
        type: 'UTILITIES',
        paymentMethod: 'Transferencia',
        vendor: 'Edesur',
        reference: 'ELEC-2025-07'
      },
      {
        id: '4',
        category: 'Inventario',
        description: 'Compra de productos',
        amount: 35000,
        date: new Date().toISOString(),
        type: 'INVENTORY',
        paymentMethod: 'Efectivo',
        vendor: 'Proveedor ABC',
        reference: 'INV-001'
      },
      {
        id: '5',
        category: 'Marketing',
        description: 'Publicidad en redes sociales',
        amount: 5500,
        date: new Date().toISOString(),
        type: 'OTHER',
        paymentMethod: 'Tarjeta',
        vendor: 'Facebook Ads',
        reference: 'FB-ADS-001'
      }
    ]
    
    setExpenses(mockExpenses)
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString(),
      type: formData.type,
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor || undefined,
      reference: formData.reference || undefined
    }

    setExpenses([newExpense, ...expenses])
    setShowAddForm(false)
    setFormData({
      category: '',
      description: '',
      amount: '',
      type: 'OPERATIONAL',
      paymentMethod: 'CASH',
      vendor: '',
      reference: ''
    })
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      SALARIES: '👥',
      RENT: '🏢',
      UTILITIES: '⚡',
      INVENTORY: '📦',
      OPERATIONAL: '⚙️',
      OTHER: '📝'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      SALARIES: 'bg-blue-100 text-blue-800',
      RENT: 'bg-purple-100 text-purple-800',
      UTILITIES: 'bg-yellow-100 text-yellow-800',
      INVENTORY: 'bg-green-100 text-green-800',
      OPERATIONAL: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-indigo-100 text-indigo-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
          <p className="text-gray-600 font-medium">
            Total gastos: RD${totalExpenses.toLocaleString()} • {expenses.length} transacciones
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Agregar Gasto</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 text-sm font-semibold">Gastos del Mes</div>
            <div className="text-2xl">💸</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            RD${totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 text-sm font-semibold">Gastos Operativos</div>
            <div className="text-2xl">⚙️</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            RD${expenses.filter(e => e.type === 'OPERATIONAL').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 text-sm font-semibold">Promedio por Gasto</div>
            <div className="text-2xl">📊</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            RD${expenses.length > 0 ? Math.round(totalExpenses / expenses.length).toLocaleString() : '0'}
          </div>
        </div>
      </div>

      {/* Add Expense Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Nuevo Gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Gasto</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                >
                  <option value="OPERATIONAL">Operativo</option>
                  <option value="INVENTORY">Inventario</option>
                  <option value="UTILITIES">Servicios</option>
                  <option value="RENT">Alquiler</option>
                  <option value="SALARIES">Salarios</option>
                  <option value="OTHER">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CHECK">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Referencia (Opcional)</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gastos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gasto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{expense.category}</div>
                      <div className="text-sm text-gray-600">{expense.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(expense.type)}`}>
                      <span>{getTypeIcon(expense.type)}</span>
                      <span>{expense.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-gray-900">RD${expense.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700">{expense.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{expense.vendor || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
