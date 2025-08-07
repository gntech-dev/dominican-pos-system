'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Employee {
  id: string
  employeeCode: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  position: string
  department?: string
  isActive: boolean
}

interface TimeEntry {
  id: string
  employeeId: string
  clockIn: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours: number
  status: 'ACTIVE' | 'COMPLETED' | 'BREAK' | 'OVERTIME'
  employee: {
    employeeCode: string
    user: {
      firstName: string
      lastName: string
    }
  }
}

export default function EmployeeTimeClockPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activeEntries, setActiveEntries] = useState<TimeEntry[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Load employees and active time entries
  useEffect(() => {
    loadEmployees()
    loadActiveEntries()
  }, [])

  // Update current time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('es-DO'))
    }
    
    // Set initial time
    updateTime()
    
    // Update time every minute
    const interval = setInterval(updateTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees?isActive=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setEmployees(result.data || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Error al cargar empleados')
    }
  }

  const loadActiveEntries = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/employees/time-tracking', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setActiveEntries(result.data?.activeEntries || [])
      }
    } catch (error) {
      console.error('Error loading active entries:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleClockIn = async () => {
    if (!selectedEmployeeId) {
      toast.error('Por favor selecciona un empleado')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/employees/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'CLOCK_IN',
          employeeId: selectedEmployeeId,
          location: 'POS Terminal',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Entrada registrada exitosamente')
        setSelectedEmployeeId('')
        loadActiveEntries()
      } else {
        toast.error(result.error || 'Error al registrar entrada')
      }
    } catch (error) {
      console.error('Clock in error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async (employeeId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/employees/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'CLOCK_OUT',
          employeeId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Salida registrada exitosamente')
        loadActiveEntries()
      } else {
        toast.error(result.error || 'Error al registrar salida')
      }
    } catch (error) {
      console.error('Clock out error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleBreak = async (employeeId: string, breakType: 'START' | 'END') => {
    setLoading(true)
    try {
      const response = await fetch('/api/employees/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'BREAK',
          employeeId,
          breakType,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Descanso actualizado exitosamente')
        loadActiveEntries()
      } else {
        toast.error(result.error || 'Error al actualizar descanso')
      }
    } catch (error) {
      console.error('Break error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateHoursWorked = (clockIn: string) => {
    const start = new Date(clockIn)
    const now = new Date()
    const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60)
    return hours.toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'BREAK':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERTIME':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Trabajando'
      case 'BREAK':
        return 'En Descanso'
      case 'OVERTIME':
        return 'Tiempo Extra'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Control de Tiempo - Empleados</h1>
                <p className="text-sm text-gray-600">Sistema de registro de entrada y salida</p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span>Volver</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Clock In Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Registrar Entrada</h2>
                <div className="text-gray-500 text-sm">
                  {currentTime || 'Cargando...'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Seleccionar Empleado
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">-- Seleccionar Empleado --</option>
                    {employees
                      .filter(emp => !activeEntries.some(entry => 
                        entry.employee.user.firstName === emp.user.firstName && 
                        entry.employee.user.lastName === emp.user.lastName
                      ))
                      .map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employeeCode} - {employee.user.firstName} {employee.user.lastName} ({employee.position})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleClockIn}
                  disabled={loading || !selectedEmployeeId}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Registrando...
                  </span>
                ) : (
                  '🕐 Registrar Entrada'
                )}
              </button>
            </div>
          </div>

          {/* Active Employees */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Empleados Activos ({activeEntries.length})
              </h2>
              <button
                onClick={loadActiveEntries}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-colors"
              >
                <div className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}>
                  🔄
                </div>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeEntries.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">😴</div>
                  <p>No hay empleados registrados actualmente</p>
                </div>
              ) : (
                activeEntries.map(entry => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-gray-900 font-medium">
                          {entry.employee.user.firstName} {entry.employee.user.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Código: {entry.employee.employeeCode}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusText(entry.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Entrada: {formatTime(entry.clockIn)}</span>
                      <span>Horas: {calculateHoursWorked(entry.clockIn)}h</span>
                    </div>

                    <div className="flex gap-2">
                      {entry.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleBreak(entry.employeeId, 'START')}
                          disabled={loading}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          ☕ Descanso
                        </button>
                      )}
                      
                      {entry.status === 'BREAK' && (
                        <button
                          onClick={() => handleBreak(entry.employeeId, 'END')}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          ▶️ Continuar
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleClockOut(entry.employeeId)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        🏁 Salida
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{activeEntries.length}</div>
            <div className="text-gray-600 text-sm">Empleados Activos</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {activeEntries.filter(e => e.status === 'BREAK').length}
            </div>
            <div className="text-gray-600 text-sm">En Descanso</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {activeEntries.filter(e => parseFloat(calculateHoursWorked(e.clockIn)) > 8).length}
            </div>
            <div className="text-gray-600 text-sm">Tiempo Extra</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
