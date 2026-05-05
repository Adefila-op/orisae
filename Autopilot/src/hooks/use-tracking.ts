/**
 * useTracking - React hook for event tracking
 * Now with safe conversion tracking that validates legitimate purchases
 */

import { useEffect, useCallback } from 'react'
import { trackClick, trackView, trackConversion, setupLinkTracking } from '@/lib/tracking'

export function useTracking(linkCode: string | null) {
  useEffect(() => {
    if (!linkCode) return

    // Setup tracking for this link
    setupLinkTracking(linkCode)

    // Track page view
    trackView(linkCode)
  }, [linkCode])

  const handleConversion = useCallback(
    async (amount: number, orderInfo?: any) => {
      if (!linkCode) return
      const result = await trackConversion(linkCode, amount, orderInfo)
      return result
    },
    [linkCode]
  )

  return {
    trackClick: () => linkCode && trackClick(linkCode),
    trackConversion: handleConversion,
  }
}

/**
 * Track link clicks on elements
 */
export function useLinkClickTracking(linkCode: string | null) {
  return {
    onClick: () => {
      if (linkCode) {
        trackClick(linkCode)
      }
    },
  }
}

export default useTracking
