'use client'

import { useState, useEffect } from 'react'

export default function CurrentDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on client mount
    setCurrentTime(new Date())

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Don't render anything on server-side to prevent hydration mismatch
  if (!currentTime) {
    return (
      <div className="text-right">
        <div className="text-gray-900 text-sm font-medium">
          Loading...
        </div>
        <div className="text-gray-500 text-sm">
          --:--
        </div>
      </div>
    )
  }

  return (
    <div className="text-right">
      <div className="text-gray-900 text-sm font-medium">
        {currentTime.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
      <div className="text-gray-500 text-sm">
        {currentTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  )
}
