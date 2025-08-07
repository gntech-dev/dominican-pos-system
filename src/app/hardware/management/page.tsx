'use client'

import React, { useState, useEffect } from 'react'

interface HardwareDevice {
  id: string
  deviceType: 'THERMAL_PRINTER' | 'BARCODE_SCANNER' | 'CASH_DRAWER' | 'CARD_READER' | 'SCALE' | 'CUSTOMER_DISPLAY'
  deviceName: string
  deviceModel?: string
  connectionType: 'USB' | 'SERIAL' | 'BLUETOOTH' | 'WIFI' | 'ETHERNET'
  isEnabled: boolean
  isOnline: boolean
  lastPing?: string
}

interface PrintJob {
  id: string
  jobType: 'RECEIPT' | 'INVOICE' | 'REPORT' | 'LABEL'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  content: string
  createdAt: string
  processedAt?: string
}

export default function HardwareManagementPage() {
  const [devices, setDevices] = useState<HardwareDevice[]>([])
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'devices' | 'print-queue' | 'settings'>('devices')
  const [testingDevice, setTestingDevice] = useState<string | null>(null)

  useEffect(() => {
    loadHardwareData()
  }, [])

  const loadHardwareData = async () => {
    try {
      setLoading(true)

      // Mock data for demonstration
      const mockDevices: HardwareDevice[] = [
        {
          id: '1',
          deviceType: 'THERMAL_PRINTER',
          deviceName: 'Impresora Principal',
          deviceModel: 'Epson TM-T88V',
          connectionType: 'USB',
          isEnabled: true,
          isOnline: true,
          lastPing: new Date(Date.now() - 30000).toISOString(),
        },
        {
          id: '2',
          deviceType: 'BARCODE_SCANNER',
          deviceName: 'Escáner de Códigos',
          deviceModel: 'Honeywell Voyager 1200g',
          connectionType: 'USB',
          isEnabled: true,
          isOnline: true,
          lastPing: new Date(Date.now() - 15000).toISOString(),
        },
        {
          id: '3',
          deviceType: 'CASH_DRAWER',
          deviceName: 'Cajón de Dinero',
          deviceModel: 'APG Series 100',
          connectionType: 'SERIAL',
          isEnabled: true,
          isOnline: false,
          lastPing: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: '4',
          deviceType: 'CARD_READER',
          deviceName: 'Lector de Tarjetas',
          deviceModel: 'Square Reader',
          connectionType: 'BLUETOOTH',
          isEnabled: false,
          isOnline: false,
        },
      ]

      const mockPrintJobs: PrintJob[] = [
        {
          id: '1',
          jobType: 'RECEIPT',
          status: 'COMPLETED',
          content: 'Recibo #12345 - Total: RD$ 1,250.00',
          createdAt: new Date(Date.now() - 120000).toISOString(),
          processedAt: new Date(Date.now() - 115000).toISOString(),
        },
        {
          id: '2',
          jobType: 'RECEIPT',
          status: 'PENDING',
          content: 'Recibo #12346 - Total: RD$ 850.00',
          createdAt: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: '3',
          jobType: 'REPORT',
          status: 'FAILED',
          content: 'Reporte diario de ventas',
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
      ]

      setDevices(mockDevices)
      setPrintJobs(mockPrintJobs)
    } catch (error) {
      console.error('Error loading hardware data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'THERMAL_PRINTER':
        return '🖨️'
      case 'BARCODE_SCANNER':
        return '📷'
      case 'CASH_DRAWER':
        return '💰'
      case 'CARD_READER':
        return '💳'
      case 'SCALE':
        return '⚖️'
      case 'CUSTOMER_DISPLAY':
        return '📺'
      default:
        return '🔧'
    }
  }

  const getDeviceTypeName = (deviceType: string) => {
    switch (deviceType) {
      case 'THERMAL_PRINTER':
        return 'Impresora Térmica'
      case 'BARCODE_SCANNER':
        return 'Escáner de Códigos'
      case 'CASH_DRAWER':
        return 'Cajón de Dinero'
      case 'CARD_READER':
        return 'Lector de Tarjetas'
      case 'SCALE':
        return 'Balanza'
      case 'CUSTOMER_DISPLAY':
        return 'Pantalla Cliente'
      default:
        return deviceType
    }
  }

  const getStatusColor = (isOnline: boolean, isEnabled: boolean) => {
    if (!isEnabled) return 'bg-gray-100 text-gray-800'
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTestDevice = async (deviceId: string) => {
    setTestingDevice(deviceId)
    
    // Simulate device test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For demo purposes, assume test is successful
    const deviceIndex = devices.findIndex(d => d.id === deviceId)
    if (deviceIndex !== -1) {
      const updatedDevices = [...devices]
      updatedDevices[deviceIndex] = {
        ...updatedDevices[deviceIndex],
        isOnline: true,
        lastPing: new Date().toISOString(),
      }
      setDevices(updatedDevices)
    }
    
    setTestingDevice(null)
  }

  const handleToggleDevice = (deviceId: string) => {
    const deviceIndex = devices.findIndex(d => d.id === deviceId)
    if (deviceIndex !== -1) {
      const updatedDevices = [...devices]
      updatedDevices[deviceIndex] = {
        ...updatedDevices[deviceIndex],
        isEnabled: !updatedDevices[deviceIndex].isEnabled,
      }
      setDevices(updatedDevices)
    }
  }

  const handleOpenCashDrawer = () => {
    // Simulate cash drawer opening
    const drawerDevice = devices.find(d => d.deviceType === 'CASH_DRAWER')
    if (drawerDevice) {
      alert('Cajón de dinero abierto')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-lg">Cargando dispositivos de hardware...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Hardware POS</h1>
            <p className="text-sm text-gray-600">Control y monitoreo de dispositivos del punto de venta</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('devices')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                  activeTab === 'devices'
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🔧 Dispositivos ({devices.length})
            </button>
            <button
              onClick={() => setActiveTab('print-queue')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'print-queue'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🖨️ Cola de Impresión ({printJobs.filter(j => j.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ⚙️ Configuración
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'devices' && (
          <div className="grid md:grid-cols-2 gap-6">
            {devices.map(device => (
              <div key={device.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getDeviceIcon(device.deviceType)}</div>
                    <div>
                      <h3 className="text-white font-semibold">{device.deviceName}</h3>
                      <p className="text-white/70 text-sm">{getDeviceTypeName(device.deviceType)}</p>
                      {device.deviceModel && (
                        <p className="text-white/50 text-xs">{device.deviceModel}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.isOnline, device.isEnabled)}`}>
                    {!device.isEnabled ? 'Deshabilitado' : device.isOnline ? 'En Línea' : 'Desconectado'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-white/70 mb-4">
                  <div className="flex justify-between">
                    <span>Conexión:</span>
                    <span>{device.connectionType}</span>
                  </div>
                  {device.lastPing && (
                    <div className="flex justify-between">
                      <span>Último ping:</span>
                      <span>{formatTimeAgo(device.lastPing)}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTestDevice(device.id)}
                    disabled={testingDevice === device.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                  >
                    {testingDevice === device.id ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Probando...
                      </span>
                    ) : (
                      '🔍 Probar'
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleDevice(device.id)}
                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                      device.isEnabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {device.isEnabled ? '⏸️ Deshabilitar' : '▶️ Habilitar'}
                  </button>
                </div>

                {device.deviceType === 'CASH_DRAWER' && device.isEnabled && (
                  <button
                    onClick={handleOpenCashDrawer}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                  >
                    💰 Abrir Cajón
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'print-queue' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Cola de Impresión</h2>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                🗑️ Limpiar Cola
              </button>
            </div>

            <div className="space-y-4">
              {printJobs.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-medium mb-2">Cola vacía</h3>
                  <p>No hay trabajos de impresión pendientes</p>
                </div>
              ) : (
                printJobs.map(job => (
                  <div key={job.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {job.jobType === 'RECEIPT' ? '🧾' : 
                           job.jobType === 'INVOICE' ? '📄' : 
                           job.jobType === 'REPORT' ? '📊' : '🏷️'}
                        </span>
                        <div>
                          <h3 className="text-white font-medium">{job.jobType}</h3>
                          <p className="text-white/60 text-sm">{job.content}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Creado: {formatTimeAgo(job.createdAt)}</span>
                      {job.processedAt && (
                        <span>Procesado: {formatTimeAgo(job.processedAt)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">Configuración de Hardware</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-medium mb-3">Configuración de Impresora</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Ancho de papel (mm)
                    </label>
                    <select className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white">
                      <option value="80">80mm</option>
                      <option value="58">58mm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Velocidad de impresión
                    </label>
                    <select className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white">
                      <option value="fast">Rápida</option>
                      <option value="normal">Normal</option>
                      <option value="slow">Lenta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-3">Configuración de Escáner</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" defaultChecked />
                    <span className="text-white/80">Sonido al escanear</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" defaultChecked />
                    <span className="text-white/80">Procesamiento automático</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-3">Configuración de Cajón</h3>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Duración de pulso (ms)
                  </label>
                  <input 
                    type="number" 
                    defaultValue="500" 
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                💾 Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400">
              {devices.filter(d => d.isOnline && d.isEnabled).length}
            </div>
            <div className="text-white/70 text-sm">Dispositivos En Línea</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-red-400">
              {devices.filter(d => !d.isOnline && d.isEnabled).length}
            </div>
            <div className="text-white/70 text-sm">Dispositivos Offline</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {printJobs.filter(j => j.status === 'PENDING').length}
            </div>
            <div className="text-white/70 text-sm">Trabajos Pendientes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {printJobs.filter(j => j.status === 'COMPLETED').length}
            </div>
            <div className="text-gray-500 text-sm">Trabajos Completados</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
