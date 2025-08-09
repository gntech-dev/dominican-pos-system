'use client';

import React, { useState, useEffect } from 'react';

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

export default function RncManagementPage() {
  const [syncStatus, setSyncStatus] = useState<RncSyncStatus | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<RncScheduleSettings | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    loadSyncStatus();
    loadScheduleSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/rnc/sync');
      
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleSettings = async () => {
    try {
      const response = await fetch('/api/rnc/schedule');
      
      if (response.ok) {
        const data = await response.json();
        setScheduleSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading schedule settings:', error);
    }
  };

  const syncRncData = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/rnc/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Éxito: ${result.message}`);
        loadSyncStatus(); // Refresh status
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Error sincronizando datos RNC');
    } finally {
      setSyncing(false);
    }
  };

  const updateScheduleSettings = async (newSettings: Partial<RncScheduleSettings>) => {
    setSavingSchedule(true);
    try {
      const response = await fetch('/api/rnc/schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        const result = await response.json();
        setScheduleSettings(result.settings);
        alert('Configuración de horario actualizada exitosamente');
        
        if (result.setupInstructions) {
          console.log('Setup instructions:', result.setupInstructions);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Schedule update error:', error);
      alert('Error actualizando configuración de horario');
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de RNC DGII</h1>
          <p className="text-gray-600">Sincronización de base de datos de RNC de la DGII</p>
        </div>

        {/* Sync Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">📊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Estado de Sincronización</h2>
          </div>

          {syncStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Records */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-800">{syncStatus.totalRecords.toLocaleString()}</div>
                <div className="text-sm text-green-600">Registros RNC</div>
              </div>

              {/* Last Sync */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-lg font-semibold text-blue-800">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Nunca'
                  }
                </div>
                <div className="text-sm text-blue-600">Última Sincronización</div>
              </div>

              {/* Status */}
              <div className={`border rounded-lg p-4 ${
                syncStatus.isStale 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className={`text-lg font-semibold ${
                  syncStatus.isStale ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  {syncStatus.isStale ? '⚠️ Desactualizado' : '✅ Actualizado'}
                </div>
                <div className={`text-sm ${
                  syncStatus.isStale ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  Estado de los datos
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">🔄</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Sincronización Manual</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Proceso de Sincronización</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Descarga el archivo ZIP desde el sitio oficial de la DGII</li>
              <li>• Extrae y procesa el archivo CSV de contribuyentes</li>
              <li>• Actualiza la base de datos local con los nuevos registros</li>
              <li>• Valida formato y limpia datos duplicados</li>
            </ul>
          </div>

          <button
            onClick={syncRncData}
            disabled={syncing}
            className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
              syncing
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Sincronizando con DGII...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🔄 Sincronizar Datos RNC
              </span>
            )}
          </button>

          {syncStatus?.isStale && (
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
              ⚠️ Los datos tienen más de 24 horas. Se recomienda sincronizar para obtener información actualizada.
            </div>
          )}
        </div>

        {/* Automatic Synchronization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">⏰</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Sincronización Automática</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Habilitar sincronización automática
                </label>
                <p className="text-sm text-gray-600">
                  Sincronizar datos RNC automáticamente todos los días
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleSettings(prev => prev ? { ...prev, enabled: !prev.enabled } : { enabled: false, scheduleTime: '02:00', timezone: 'America/Santo_Domingo', lastScheduledRun: null, autoSyncEnabled: false })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  scheduleSettings?.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    scheduleSettings?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {scheduleSettings?.enabled && (
              <div className="pl-4 border-l-2 border-blue-200 space-y-4">
                <div>
                  <label htmlFor="sync-time" className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de sincronización
                  </label>
                  <input
                    type="time"
                    id="sync-time"
                    value={scheduleSettings?.scheduleTime || '02:00'}
                    onChange={(e) => setScheduleSettings(prev => prev ? { ...prev, scheduleTime: e.target.value } : { enabled: false, scheduleTime: e.target.value, timezone: 'America/Santo_Domingo', lastScheduledRun: null, autoSyncEnabled: false })}
                    className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Los datos se sincronizarán automáticamente a esta hora todos los días
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => updateScheduleSettings({})}
                    disabled={!scheduleSettings?.scheduleTime}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar Configuración
                  </button>
                  
                  <button
                    onClick={() => setScheduleSettings({ enabled: false, scheduleTime: '02:00', timezone: 'America/Santo_Domingo', lastScheduledRun: null, autoSyncEnabled: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Configuración del Sistema</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>Para habilitar la sincronización automática, se requiere configuración del servidor:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Ejecutar el script de configuración: <code className="bg-blue-100 px-1 rounded">./scripts/setup-rnc-cron.sh</code></li>
                      <li>El sistema creará una tarea programada (cron job)</li>
                      <li>La sincronización se ejecutará automáticamente a la hora configurada</li>
                    </ol>
                    <p className="mt-3 text-xs">
                      <strong>Nota:</strong> Los archivos .sh son necesarios solo para la automatización. 
                      El sistema puede funcionar completamente con sincronización manual si no se requiere automatización.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-semibold">ℹ️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Información Importante</h2>
          </div>

                    <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📈 Frecuencia de Actualización</h3>
              <p>La DGII actualiza la base de datos de RNC diariamente. Se recomienda sincronizar al menos una vez al día.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">🔐 Validación de RNC</h3>
              <p>El sistema valida RNC contra esta base de datos local para facturas B01. Los RNC deben estar activos y registrados en la DGII.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">🌐 Fuente de Datos</h3>
              <p>Los datos se obtienen directamente del sitio oficial de la DGII: <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  https://dgii.gov.do/app/WebApps/Consultas/RNC/RNC_CONTRIBUYENTES.zip
                </code>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">🛠️ Opciones de Implementación</h3>
              <div className="ml-4 space-y-2">
                <p><strong>Sincronización Manual:</strong> El sistema funciona completamente sin archivos .sh. Los administradores pueden sincronizar manualmente cuando sea necesario.</p>
                <p><strong>Sincronización Automática:</strong> Requiere archivos .sh para configurar tareas programadas del servidor (cron jobs). Opcional pero recomendado para producción.</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">⚡ Rendimiento</h3>
              <p>La sincronización puede tomar varios minutos dependiendo del tamaño del archivo de la DGII y la velocidad de internet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
