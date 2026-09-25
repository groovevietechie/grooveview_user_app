import { useState, useCallback, useEffect } from 'react'

export type PopupType = 'spinWheel' | 'rewardNotification' | 'couponOffer' | 'premiumDeal' | 'limitedOffer'

export interface PopupData {
  type: PopupType
  title?: string
  subtitle?: string
  amount?: number
  description?: string
  couponCode?: string
  expiresIn?: string
  onConfirm?: () => void
  onClose?: () => void
  autoClose?: number // milliseconds
}

export const useEngagementPopup = () => {
  const [popups, setPopups] = useState<PopupData[]>([])
  const [completedPopups, setCompletedPopups] = useState<Set<string>>(new Set())

  const showPopup = useCallback((popupData: PopupData) => {
    setPopups(prev => [...prev, popupData])

    // Auto close if specified
    if (popupData.autoClose) {
      const timeout = setTimeout(() => {
        dismissPopup()
      }, popupData.autoClose)
      return () => clearTimeout(timeout)
    }
  }, [])

  const dismissPopup = useCallback(() => {
    setPopups(prev => {
      const updated = [...prev]
      const last = updated.pop()
      if (last?.onClose) {
        last.onClose()
      }
      return updated
    })
  }, [])

  const confirmPopup = useCallback(() => {
    setPopups(prev => {
      const updated = [...prev]
      const last = updated.pop()
      if (last?.onConfirm) {
        last.onConfirm()
      }
      return updated
    })
  }, [])

  // Trigger random engagement popup based on user activity
  const triggerRandomPopup = useCallback((userContext?: any) => {
    const popupTypes: PopupType[] = ['spinWheel', 'couponOffer', 'limitedOffer', 'premiumDeal']
    const randomType = popupTypes[Math.floor(Math.random() * popupTypes.length)]

    const popupConfigs: Record<PopupType, PopupData> = {
      spinWheel: {
        type: 'spinWheel',
        title: 'Spin to get ₦300,000',
        subtitle: 'Coupon bundle',
      },
      rewardNotification: {
        type: 'rewardNotification',
        title: "Congrats! You've hit the jackpot!",
        subtitle: 'Premium user deal!',
        autoClose: 4000,
      },
      couponOffer: {
        type: 'couponOffer',
        title: 'Get it with just 1 order',
        amount: 300000,
        description: 'Coupon bundle',
        expiresIn: '03:59:15',
      },
      limitedOffer: {
        type: 'limitedOffer',
        title: 'Limited Time Offer',
        subtitle: 'Buy 1 item to get',
        amount: 300000,
        description: 'Coupon bundle',
        expiresIn: '03:59:15',
      },
      premiumDeal: {
        type: 'premiumDeal',
        title: 'Premium user deal!',
        subtitle: 'Get it with orders',
        amount: 300000,
        autoClose: 3000,
      },
    }

    showPopup(popupConfigs[randomType])
  }, [showPopup])

  return {
    currentPopup: popups[popups.length - 1],
    popups,
    showPopup,
    dismissPopup,
    confirmPopup,
    triggerRandomPopup,
    hasActivePopup: popups.length > 0,
  }
}
