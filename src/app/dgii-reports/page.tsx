'use client'

import { useState } from 'react'

export default function DGIIReportsPage() {
  const [reportType, setReportType] = useState('607')
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes DGII</h1>
          <p className="mt-2 text-gray-600">
            Genera reportes para cumplir con las normativas de la DGII
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuración del Reporte</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="607">607 - Comprobantes Fiscales</option>
              <option value="606">606 - Compras</option>
              <option value="608">608 - Cancelaciones</option>
            </select>
          </div>

          <button
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}
