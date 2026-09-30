import { useState, useCallback, useRef } from 'react'

export type PopupType = 'spinWheel' | 'rewardNotification' | 'couponOffer' | 'premiumDeal' | 'limitedOffer' | 'experiencePrompt'

export type EngagementContext = {
  businessName?: string
  hasCartItems?: boolean
  hasPreviousOrders?: boolean
  hasLinkedDevice?: boolean
}

export type EngagementAction = 'viewCart' | 'exploreMenu' | 'linkDevice'

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
  autoClose?: number
  eyebrow?: string
  actionLabel?: string
  supportingText?: string
  action?: EngagementAction
}

const STORAGE_KEY = 'groovevie-engagement-sequence-v2'
const COOLDOWN_MS = 12 * 60 * 60 * 1000
const LAUNCH_PROMPT_DELAYS = [3500, 15000, 30000]

export const useEngagementPopup = () => {
  const [popups, setPopups] = useState<PopupData[]>([])
  const sequenceScheduled = useRef(false)

  const showPopup = useCallback((popupData: PopupData) => {
    setPopups(prev => [...prev, popupData])
    if (popupData.autoClose) {
      const timeout = setTimeout(() => dismissPopup(), popupData.autoClose)
      return () => clearTimeout(timeout)
    }
  }, [])

  const dismissPopup = useCallback(() => {
    setPopups(prev => {
      const updated = [...prev]
      const last = updated.pop()
      last?.onClose?.()
      return updated
    })
  }, [])

  const confirmPopup = useCallback(() => {
    setPopups(prev => {
      const updated = [...prev]
      const last = updated.pop()
      last?.onConfirm?.()
      return updated
    })
  }, [])

  const scheduleEngagementPopups = useCallback((context: EngagementContext = {}) => {
    if (sequenceScheduled.current || typeof window === 'undefined') return

    const previousState = window.localStorage.getItem(STORAGE_KEY)
    let lastShownAt = 0
    try {
      lastShownAt = previousState ? Number(JSON.parse(previousState).lastShownAt || 0) : 0
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    if (Date.now() - lastShownAt < COOLDOWN_MS) return

    sequenceScheduled.current = true
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastShownAt: Date.now() }))
    const businessName = context.businessName || 'this lounge'
    const prompts: PopupData[] = [
      context.hasCartItems ? {
        type: 'experiencePrompt', eyebrow: 'Your moment is ready', title: 'Make it a full experience',
        subtitle: 'Your picks are waiting in the tray.', supportingText: 'Add a signature drink or service to round out the table.', actionLabel: 'View my tray', action: 'viewCart',
      } : {
        type: 'experiencePrompt', eyebrow: 'A good start', title: 'Find your first favourite',
        subtitle: 'The menu is ready when you are.', supportingText: 'Browse the lounge picks and build a table worth remembering.', actionLabel: 'Explore the menu', action: 'exploreMenu',
      },
      context.hasPreviousOrders ? {
        type: 'experiencePrompt', eyebrow: 'Welcome back to ' + businessName, title: 'Replay a favourite, discover a new mood',
        subtitle: 'Your next good moment is one choice away.', supportingText: 'Start with a favourite or browse what is new tonight.', actionLabel: 'Explore the menu', action: 'exploreMenu',
      } : {
        type: 'experiencePrompt', eyebrow: 'Tonight, your way', title: 'Take a little detour',
        subtitle: 'There may be a new favourite hiding in the menu.', supportingText: 'Start with the house favourites, then make the order your own.', actionLabel: 'Show favourites', action: 'exploreMenu',
      },
      !context.hasLinkedDevice ? {
        type: 'experiencePrompt', eyebrow: 'A smoother visit next time', title: 'Keep your table in sync',
        subtitle: 'Link this device to pick up your order anywhere.', supportingText: 'Your tray and order history stay close, even when the phone changes.', actionLabel: 'Link device', action: 'linkDevice',
      } : {
        type: 'experiencePrompt', eyebrow: 'Keep the good mood going', title: 'Your table, always in sync',
        subtitle: 'Keep your tray close for the next round.', supportingText: 'Your linked device makes returning to this lounge quicker and easier.', actionLabel: 'Explore the menu', action: 'exploreMenu',
      },
    ]

    prompts.forEach((prompt, index) => {
      window.setTimeout(() => {
        setPopups([prompt])
        window.setTimeout(() => setPopups(current => current[0] === prompt ? [] : current), 8500)
      }, LAUNCH_PROMPT_DELAYS[index])
    })
  }, [])

  const triggerRandomPopup = useCallback((context: EngagementContext = {}) => {
    scheduleEngagementPopups(context)
  }, [scheduleEngagementPopups])

  return {
    currentPopup: popups[popups.length - 1], popups, showPopup, dismissPopup, confirmPopup,
    triggerRandomPopup, scheduleEngagementPopups, hasActivePopup: popups.length > 0,
  }
}
