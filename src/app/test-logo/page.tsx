'use client'

import LogoSection from '@/components/ui/LogoSection'

export default function LogoTestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Logo Detection Test</h1>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-4">Test 1: No businessLogo prop (should auto-detect)</h2>
        <LogoSection 
          className="h-20 mb-4" 
          size="large"
          fallbackText="AUTO-DETECT TEST"
          showFallback={true}
        />
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-4">Test 2: With businessLogo prop</h2>
        <LogoSection 
          businessLogo="/logo.svg"
          className="h-20 mb-4" 
          size="large"
          fallbackText="BUSINESS LOGO TEST"
          showFallback={true}
        />
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-4">Test 3: Thermal Receipt Size</h2>
        <LogoSection 
          className="h-8 mb-1 justify-center" 
          size="small"
          fallbackText="THERMAL TEST"
          showFallback={true}
        />
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-4">Test 4: Direct Image Test</h2>
        <img src="/logo.svg" alt="Direct SVG test" className="h-20 w-auto" />
      </div>
    </div>
  )
}
