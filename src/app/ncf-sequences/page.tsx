'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface NCFSequence {
  id: string
  type: string
  currentNumber: number
  maxNumber: number
  expiryDate: string | null
  isActive: boolean
  createdAt: string
  usagePercentage?: number
  remaining?: number
  status?: 'active' | 'warning' | 'critical' | 'exhausted'
  isExpired?: boolean
}

// Standard Dominican Republic NCF types

// Standard Dominican Republic NCF Types as per DGII regulations
const STANDARD_NCF_TYPES = [
  {
    code: 'B01',
    name: 'Crédito Fiscal',
    description: 'Comprobante válido para crédito fiscal'
  },
  {
    code: 'B02', 
    name: 'Consumo',
    description: 'Comprobante para consumidor final'
  },
  {
    code: 'B03',
    name: 'Nota de Débito', 
    description: 'Nota de débito'
  },
  {
    code: 'B04',
    name: 'Nota de Crédito',
    description: 'Nota de crédito'
  },
  {
    code: 'B11',
    name: 'Proveedores Informales',
    description: 'Comprobante para proveedores informales'
  },
  {
    code: 'B12',
    name: 'Registro Único',
    description: 'Comprobante para contribuyentes del registro único'
  },
  {
    code: 'B13', 
    name: 'Consumidor Final',
    description: 'Comprobante simplificado para consumidor final'
  },
  {
    code: 'B14',
    name: 'Regímenes Especiales',
    description: 'Comprobante para regímenes especiales'
  },
  {
    code: 'B15',
    name: 'Gubernamental',
    description: 'Comprobante para entidades gubernamentales'
  }
]

export default function NCFSequencesPage() {
  const [sequences, setSequences] = useState<NCFSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSequence, setEditingSequence] = useState<NCFSequence | null>(null)
  const [creatingSequence, setCreatingSequence] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    currentNumber: 0,
    maxNumber: 99999999,
    expiryDate: '',
    isActive: true
  })

  const fetchSequences = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ncf-sequences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch sequences')
      const data = await response.json()
      setSequences(data.data || [])
    } catch (error) {
      console.error('Error fetching sequences:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await fetchSequences()
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const endpoint = editingSequence 
        ? `/api/ncf-sequences/${editingSequence.id}`
        : '/api/ncf-sequences'
      
      const method = editingSequence ? 'PUT' : 'POST'
      
      // For updates, don't send the type field (it shouldn't change)
      const submitData = editingSequence 
        ? {
            currentNumber: formData.currentNumber,
            maxNumber: formData.maxNumber,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
            isActive: formData.isActive
          }
        : {
            ...formData,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
          }
      
      const token = localStorage.getItem('token')
      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        
        // Show detailed validation errors if available
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details.map((detail: any) => 
            `${detail.path?.join('.')}: ${detail.message}`
          ).join('\n')
          throw new Error(`Datos de entrada inválidos:\n${errorMessages}`)
        }
        
        throw new Error(error.error || 'Failed to save sequence')
      }

      await fetchSequences()
      handleCancel()
    } catch (error) {
      console.error('Error saving sequence:', error)
      alert(error instanceof Error ? error.message : 'Error saving sequence')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro que desea eliminar/desactivar esta secuencia?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/ncf-sequences/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete sequence')
      }

      const result = await response.json()
      alert(result.message)
      await fetchSequences()
    } catch (error) {
      console.error('Error deleting sequence:', error)
      alert(error instanceof Error ? error.message : 'Error deleting sequence')
    }
  }

  const handleEdit = (sequence: NCFSequence) => {
    setEditingSequence(sequence)
    setFormData({
      type: sequence.type,
      currentNumber: sequence.currentNumber,
      maxNumber: sequence.maxNumber,
      expiryDate: sequence.expiryDate ? sequence.expiryDate.split('T')[0] : '',
      isActive: sequence.isActive
    })
    setCreatingSequence(true)
  }

  const handleCancel = () => {
    setEditingSequence(null)
    setCreatingSequence(false)
    setFormData({
      type: '',
      currentNumber: 0,
      maxNumber: 99999999,
      expiryDate: '',
      isActive: true
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      case 'exhausted': return 'text-red-800'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status?: string, isExpired?: boolean) => {
    if (isExpired) return <XCircle className="w-5 h-5 text-red-600" />
    
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'exhausted': return <XCircle className="w-5 h-5 text-red-800" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Secuencias NCF</h1>
            <p className="text-sm text-gray-600">Administrar secuencias de Números de Comprobante Fiscal</p>
          </div>
          <button
            onClick={() => setCreatingSequence(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Secuencia
          </button>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-800">Total Secuencias</h3>
          <p className="text-2xl font-bold text-gray-900">{sequences.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-800">Activas</h3>
          <p className="text-2xl font-bold text-green-600">
            {sequences.filter(s => s.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-800">Críticas</h3>
          <p className="text-2xl font-bold text-red-600">
            {sequences.filter(s => s.status === 'critical' || s.status === 'exhausted').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-800">Expiradas</h3>
          <p className="text-2xl font-bold text-red-800">
            {sequences.filter(s => s.isExpired).length}
          </p>
        </div>
      </div>

      {/* Sequences Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Tipo NCF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Números
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sequences.map((sequence) => (
                <tr key={sequence.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sequence.type}
                        </div>
                        <div className="text-sm text-gray-800">
                          {STANDARD_NCF_TYPES.find(t => t.code === sequence.type)?.name || 'Tipo desconocido'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sequence.status, sequence.isExpired)}
                      <span className={`text-sm font-medium ${getStatusColor(sequence.status)}`}>
                        {sequence.isExpired ? 'Expirada' : 
                         sequence.status === 'active' ? 'Activa' :
                         sequence.status === 'warning' ? 'Advertencia' :
                         sequence.status === 'critical' ? 'Crítica' :
                         sequence.status === 'exhausted' ? 'Agotada' : 'Inactiva'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (sequence.usagePercentage || 0) >= 90 ? 'bg-red-600' :
                          (sequence.usagePercentage || 0) >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${sequence.usagePercentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {sequence.usagePercentage || 0}% usado
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Actual: {sequence.currentNumber.toLocaleString()}</div>
                      <div>Máximo: {sequence.maxNumber.toLocaleString()}</div>
                      <div className="text-gray-700">Restantes: {(sequence.remaining || 0).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sequence.expiryDate ? (
                      <div className={sequence.isExpired ? 'text-red-600' : ''}>
                        {new Date(sequence.expiryDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-600">Sin vencimiento</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(sequence)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sequence.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sequences.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-700">No hay secuencias NCF configuradas</div>
          <button
            onClick={() => setCreatingSequence(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Crear Primera Secuencia
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {creatingSequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingSequence ? 'Editar Secuencia NCF' : 'Nueva Secuencia NCF'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tipo NCF
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={!!editingSequence}
                >
                  <option value="">Seleccionar tipo</option>
                  {STANDARD_NCF_TYPES.map(type => (
                    <option key={type.code} value={type.code}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
                {editingSequence && (
                  <p className="text-sm text-gray-600 mt-1">
                    El tipo NCF no puede modificarse una vez creado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Número Actual
                </label>
                <input
                  type="number"
                  min="0"
                  max="99999999"
                  value={formData.currentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentNumber: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Número Máximo
                </label>
                <input
                  type="number"
                  min="1"
                  max="99999999"
                  value={formData.maxNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxNumber: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Fecha de Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                  Secuencia Activa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingSequence ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
