'use client'

import { useState, useEffect } from 'react'
import { RoleGate } from '@/contexts/RoleContext'
import type { BusinessSettings, CreateBusinessSettingsForm } from '@/types'

interface RncSyncStatus {
  totalRecords: number;
  lastSync: string | null;
  isStale: boolean;
}

interface RncScheduleSettings {
  enabled: boolean;
  scheduleTime: string;
  timezone: string;
  lastScheduledRun: string | null;
  autoSyncEnabled: boolean;
}

export default function SettingsPage() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('business')

  // RNC-related state
  const [syncStatus, setSyncStatus] = useState<RncSyncStatus | null>(null)
  const [scheduleSettings, setScheduleSettings] = useState<RncScheduleSettings | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateBusinessSettingsForm>({
    name: '',
    rnc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    slogan: '',
    city: '',
    province: '',
    country: 'República Dominicana',
    postalCode: '',
    taxRegime: 'Régimen Ordinario',
    economicActivity: '',
    receiptFooter: '',
    invoiceTerms: '',
    warrantyInfo: ''
  })

  // Fetch business settings on component mount
  useEffect(() => {
    fetchBusinessSettings()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/business-settings')
      
      if (response.ok) {
        const settings = await response.json()
        setBusinessSettings(settings)
        
        // Populate form with current settings
        setFormData({
          name: settings.name || '',
          rnc: settings.rnc || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          website: settings.website || '',
          slogan: settings.slogan || '',
          city: settings.city || '',
          province: settings.province || '',
          country: settings.country || 'República Dominicana',
          postalCode: settings.postalCode || '',
          taxRegime: settings.taxRegime || 'Régimen Ordinario',
          economicActivity: settings.economicActivity || '',
          receiptFooter: settings.receiptFooter || '',
          invoiceTerms: settings.invoiceTerms || '',
          warrantyInfo: settings.warrantyInfo || ''
        })
      }
    } catch (err) {
      setError('Error al cargar la configuración del negocio')
      console.error('Error fetching business settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setBusinessSettings(updatedSettings)
        setSuccess('Configuración del negocio actualizada exitosamente')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar la configuración')
      }
    } catch (err) {
      setError('Error de conexión al actualizar la configuración')
      console.error('Error updating business settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // RNC-related functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/rnc/sync', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadScheduleSettings = async () => {
    try {
      const response = await fetch('/api/rnc/schedule', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setScheduleSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading schedule settings:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/rnc/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Sincronización exitosa: ${result.data.recordsProcessed} registros procesados`);
        loadSyncStatus();
      } else {
        const error = await response.json();
        alert(`Error en sincronización: ${error.error}`);
      }
    } catch (error) {
      alert('Error de conexión durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const saveScheduleSettings = async () => {
    if (!scheduleSettings) return;
    
    setSavingSchedule(true);
    try {
      const response = await fetch('/api/rnc/schedule', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleSettings)
      });

      if (response.ok) {
        alert('Configuración de sincronización guardada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error de conexión al guardar configuración');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Load RNC data when RNC tab is selected
  useEffect(() => {
    if (activeTab === 'rnc') {
      loadSyncStatus();
      loadScheduleSettings();
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-800">Cargando configuraciones...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RoleGate roles={['ADMIN', 'MANAGER']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
            <p className="mt-2 text-gray-800">
              Gestiona la configuración de tu punto de venta
            </p>
          </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('business')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Información del Negocio
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'receipt'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Configuración de Recibos
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'legal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Información Legal
            </button>
            <button
              onClick={() => setActiveTab('rnc')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rnc'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              🏛️ Base DGII (RNC)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit} className="mt-8">
          {activeTab === 'business' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Información del Negocio
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="rnc" className="block text-sm font-medium text-gray-900 mb-2">
                    RNC *
                  </label>
                  <input
                    type="text"
                    id="rnc"
                    name="rnc"
                    required
                    value={formData.rnc}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="130123456789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-900 mb-2">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    required
                    value={formData.province}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-900 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-900 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(809) 555-0123"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-900 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.empresa.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="slogan" className="block text-sm font-medium text-gray-900 mb-2">
                    Eslogan/Lema
                  </label>
                  <input
                    type="text"
                    id="slogan"
                    name="slogan"
                    value={formData.slogan}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu punto de venta confiable"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Información Legal y Fiscal
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="taxRegime" className="block text-sm font-medium text-gray-900 mb-2">
                    Régimen Tributario
                  </label>
                  <input
                    type="text"
                    id="taxRegime"
                    name="taxRegime"
                    value={formData.taxRegime}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="economicActivity" className="block text-sm font-medium text-gray-900 mb-2">
                    Actividad Económica
                  </label>
                  <input
                    type="text"
                    id="economicActivity"
                    name="economicActivity"
                    value={formData.economicActivity}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Venta al por menor de productos varios"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="warrantyInfo" className="block text-sm font-medium text-gray-900 mb-2">
                    Información de Garantías
                  </label>
                  <textarea
                    id="warrantyInfo"
                    name="warrantyInfo"
                    rows={3}
                    value={formData.warrantyInfo}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Garantía de 30 días en productos electrónicos..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Configuración de Recibos e Invoices
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="receiptFooter" className="block text-sm font-medium text-gray-900 mb-2">
                    Mensaje de Pie de Recibo
                  </label>
                  <textarea
                    id="receiptFooter"
                    name="receiptFooter"
                    rows={3}
                    value={formData.receiptFooter}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Gracias por su compra. ¡Esperamos verle pronto!"
                  />
                </div>

                <div>
                  <label htmlFor="invoiceTerms" className="block text-sm font-medium text-gray-900 mb-2">
                    Términos y Condiciones de Facturación
                  </label>
                  <textarea
                    id="invoiceTerms"
                    name="invoiceTerms"
                    rows={4}
                    value={formData.invoiceTerms}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pago a 30 días. Intereses por mora del 2% mensual..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* RNC/DGII Tab */}
          {activeTab === 'rnc' && (
            <RoleGate roles={['ADMIN']}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    🏛️ Gestión de Base de Datos DGII
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Administra la sincronización de la base de datos de RNC de la Dirección General de Impuestos Internos.
                  </p>

                  {/* Sync Status */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Estado de Sincronización</h4>
                    {syncStatus ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="text-2xl font-bold text-blue-600">{syncStatus.totalRecords.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Registros en Base</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="text-sm font-medium text-gray-900">
                            {syncStatus.lastSync 
                              ? new Date(syncStatus.lastSync).toLocaleString('es-DO')
                              : 'Nunca'
                            }
                          </div>
                          <div className="text-sm text-gray-600">Última Sincronización</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className={`text-sm font-medium ${syncStatus.isStale ? 'text-red-600' : 'text-green-600'}`}>
                            {syncStatus.isStale ? '⚠️ Desactualizada' : '✅ Actualizada'}
                          </div>
                          <div className="text-sm text-gray-600">Estado</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando estado...</p>
                      </div>
                    )}
                  </div>

                  {/* Manual Sync */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Sincronización Manual</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Descarga y actualiza la base de datos con los registros más recientes de DGII.
                    </p>
                    <button
                      onClick={handleManualSync}
                      disabled={syncing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {syncing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sincronizando...</span>
                        </>
                      ) : (
                        <>
                          <span>🔄</span>
                          <span>Sincronizar Ahora</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Schedule Settings */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Sincronización Automática</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configura la sincronización automática diaria de la base de datos.
                    </p>
                    
                    {scheduleSettings && (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="autoSyncEnabled"
                            checked={scheduleSettings.autoSyncEnabled}
                            onChange={(e) => setScheduleSettings({
                              ...scheduleSettings,
                              autoSyncEnabled: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="autoSyncEnabled" className="ml-2 text-sm text-gray-900">
                            Habilitar sincronización automática
                          </label>
                        </div>

                        {scheduleSettings.autoSyncEnabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hora de Sincronización
                              </label>
                              <input
                                type="time"
                                value={scheduleSettings.scheduleTime}
                                onChange={(e) => setScheduleSettings({
                                  ...scheduleSettings,
                                  scheduleTime: e.target.value
                                })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Zona Horaria
                              </label>
                              <select
                                value={scheduleSettings.timezone}
                                onChange={(e) => setScheduleSettings({
                                  ...scheduleSettings,
                                  timezone: e.target.value
                                })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="America/Santo_Domingo">República Dominicana (AST)</option>
                                <option value="America/New_York">Nueva York (EST/EDT)</option>
                                <option value="UTC">UTC</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <button
                            onClick={saveScheduleSettings}
                            disabled={savingSchedule}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingSchedule ? 'Guardando...' : 'Guardar Configuración'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RoleGate>
          )}

          {/* Save Button - Only for non-RNC tabs */}
          {activeTab !== 'rnc' && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
    </RoleGate>
  )
}
