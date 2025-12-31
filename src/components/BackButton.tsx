"use client"

import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useBackNavigation } from "@/hooks/useBackNavigation"

interface BackButtonProps {
  label?: string
  className?: string
  style?: React.CSSProperties
  onBack?: () => void
  fallbackRoute?: string
  disabled?: boolean
}

/**
 * Reusable back button component with consistent styling and behavior
 */
export default function BackButton({ 
  label = "Back", 
  className = "",
  style = {},
  onBack,
  fallbackRoute,
  disabled = false
}: BackButtonProps) {
  const { goBack } = useBackNavigation({ 
    fallbackRoute, 
    onBack,
    disabled 
  })

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else {
      goBack()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={style}
    >
      <ArrowLeftIcon className="w-5 h-5" />
      {label}
    </button>
  )
}