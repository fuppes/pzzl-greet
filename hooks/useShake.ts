'use client'

import { useEffect, useState } from 'react'

export function useShake(onShake: () => void, threshold = 15) {
  const [lastShake, setLastShake] = useState(0)

  useEffect(() => {
    // Only works on devices with motion sensors
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
      return
    }

    let lastX = 0
    let lastY = 0
    let lastZ = 0

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return

      const x = acceleration.x || 0
      const y = acceleration.y || 0
      const z = acceleration.z || 0

      const deltaX = Math.abs(x - lastX)
      const deltaY = Math.abs(y - lastY)
      const deltaZ = Math.abs(z - lastZ)

      // Check if shake is strong enough
      if (deltaX + deltaY + deltaZ > threshold) {
        const now = Date.now()
        // Debounce: only trigger once per second
        if (now - lastShake > 1000) {
          setLastShake(now)
          onShake()
        }
      }

      lastX = x
      lastY = y
      lastZ = z
    }

    window.addEventListener('devicemotion', handleDeviceMotion)

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion)
    }
  }, [onShake, threshold, lastShake])
}
