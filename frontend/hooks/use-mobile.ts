"use client"

import { useState, useEffect } from "react"

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Initial check
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    // Run on mount
    checkIfMobile()

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }

      resizeTimeout = setTimeout(() => {
        checkIfMobile()
      }, 100)
    }

    // Add event listener with passive flag for better performance
    window.addEventListener("resize", handleResize, { passive: true })

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  }, [])

  return isMobile
}
