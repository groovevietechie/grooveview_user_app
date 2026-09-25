"use client"

import { PopupData } from '@/hooks/useEngagementPopup'
import SpinWheelPopup from './SpinWheelPopup'
import RewardNotificationPopup from './RewardNotificationPopup'
import CouponOfferPopup from './CouponOfferPopup'
import LimitedOfferPopup from './LimitedOfferPopup'
import PremiumDealPopup from './PremiumDealPopup'

interface EngagementPopupProps {
  popupData?: PopupData
  themeColor?: string
  onClose: () => void
  onConfirm: () => void
}

export default function EngagementPopup({
  popupData,
  themeColor = '#f6c945',
  onClose,
  onConfirm,
}: EngagementPopupProps) {
  if (!popupData) return null

  switch (popupData.type) {
    case 'spinWheel':
      return (
        <SpinWheelPopup
          title={popupData.title || 'Spin to get ₦300,000'}
          subtitle={popupData.subtitle || 'Coupon bundle'}
          onClose={onClose}
          onConfirm={onConfirm}
          themeColor={themeColor}
        />
      )

    case 'rewardNotification':
      return (
        <RewardNotificationPopup
          title={popupData.title || "Congrats! You've hit the jackpot!"}
          subtitle={popupData.subtitle || 'Premium user deal!'}
          onClose={onClose}
          autoClose={popupData.autoClose}
          themeColor={themeColor}
        />
      )

    case 'couponOffer':
      return (
        <CouponOfferPopup
          title={popupData.title || 'Get it with just 1 order'}
          amount={popupData.amount || 300000}
          description={popupData.description || 'Coupon bundle'}
          expiresIn={popupData.expiresIn || '09/25/2026'}
          onClose={onClose}
          onConfirm={onConfirm}
          themeColor={themeColor}
        />
      )

    case 'limitedOffer':
      return (
        <LimitedOfferPopup
          title={popupData.title || 'Get it with just 1 order'}
          amount={popupData.amount || 300000}
          description={popupData.description || 'Coupon bundle'}
          expiresIn={popupData.expiresIn || '03:59:15'}
          onClose={onClose}
          onConfirm={onConfirm}
          themeColor={themeColor}
        />
      )

    case 'premiumDeal':
      return (
        <PremiumDealPopup
          title={popupData.title || 'Premium user deal!'}
          subtitle={popupData.subtitle || 'Get it with orders'}
          amount={popupData.amount || 300000}
          onClose={onClose}
          autoClose={popupData.autoClose}
          themeColor={themeColor}
        />
      )

    default:
      return null
  }
}
