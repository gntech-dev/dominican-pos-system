'use client'

import React, { useState } from 'react'
import NavigationSidebar from '@/components/ui/NavigationSidebar'
import NavigationTabs from '@/components/ui/NavigationTabs'
import NavigationMinimal from '@/components/ui/NavigationMinimal'
import NavigationCards from '@/components/ui/NavigationCards'

export default function NavigationPreview() {
  const [selectedStyle, setSelectedStyle] = useState('sidebar')

  const styles = [
    {
      id: 'sidebar',
      name: 'Sidebar Navigation',
      description: 'Fixed sidebar with collapsible sections - Professional and organized',
      component: NavigationSidebar,
      preview: '/api/placeholder/sidebar-nav'
    },
    {
      id: 'tabs',
      name: 'Tab Navigation',
      description: 'Horizontal tabs with sub-navigation - Clean and familiar',
      component: NavigationTabs,
      preview: '/api/placeholder/tab-nav'
    },
    {
      id: 'minimal',
      name: 'Minimal Header',
      description: 'Streamlined header with quick actions - Simple and focused',
      component: NavigationMinimal,
      preview: '/api/placeholder/minimal-nav'
    },
    {
      id: 'cards',
      name: 'Dashboard Cards',
      description: 'Card-based dashboard interface - Visual and engaging',
      component: NavigationCards,
      preview: '/api/placeholder/card-nav'
    }
  ]

  const SelectedComponent = styles.find(style => style.id === selectedStyle)?.component

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Style Selector */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Navigation Style Preview</h1>
          <p className="text-gray-600 mb-6">Choose a navigation style for your POS system:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{style.name}</h3>
                <p className="text-sm text-gray-600">{style.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative">
        {selectedStyle === 'sidebar' && (
          <div className="flex">
            <NavigationSidebar />
            <div className="ml-64 flex-1 p-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Sidebar Navigation Preview</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>✅ Professional business application look</li>
                  <li>✅ Collapsible sidebar saves space</li>
                  <li>✅ Organized sections with expandable groups</li>
                  <li>✅ Great for complex applications with many features</li>
                  <li>✅ Shows descriptions for better usability</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedStyle === 'tabs' && (
          <div>
            <NavigationTabs />
            <div className="p-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Tab Navigation Preview</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>✅ Familiar tab-based interface</li>
                  <li>✅ Clear separation of main sections</li>
                  <li>✅ Sub-navigation appears contextually</li>
                  <li>✅ Good for users who prefer traditional layouts</li>
                  <li>✅ Responsive design for mobile</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedStyle === 'minimal' && (
          <div>
            <NavigationMinimal />
            <div className="p-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Minimal Header Preview</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>✅ Clean and uncluttered design</li>
                  <li>✅ Quick access to most important functions</li>
                  <li>✅ Prominent "Nueva Venta" button for main action</li>
                  <li>✅ Contextual breadcrumb shows current location</li>
                  <li>✅ Perfect for fast-paced retail environments</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedStyle === 'cards' && (
          <div>
            <NavigationCards />
          </div>
        )}
      </div>

      {/* Implementation Info */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-semibold text-gray-900 mb-2">Implementation</h3>
        <p className="text-sm text-gray-600 mb-3">
          To use the <strong>{styles.find(s => s.id === selectedStyle)?.name}</strong>, 
          I'll replace your current Navigation component.
        </p>
        <button 
          onClick={() => {
            // This would trigger the implementation
            alert(`Ready to implement ${styles.find(s => s.id === selectedStyle)?.name}? Let me know!`)
          }}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Use This Style
        </button>
      </div>
    </div>
  )
}
