"use client"

import { useEffect, useState } from "react"
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid"

interface SuccessToastProps {
  message: string
  orderId: string
  businessSlug: string
  onDismiss: () => void
}

export default function SuccessToast({ message, orderId, businessSlug, onDismiss }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Allow fade animation to complete
    }, 4000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-green-100 overflow-hidden">
        <div className="flex items-start gap-4 p-4">
          <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{message}</h3>
            <p className="text-sm text-gray-600 mb-3">
              Order ID: <span className="font-mono font-medium">{orderId}</span>
            </p>
            <a
              href={`/b/${businessSlug}/orders`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View Orders →
            </a>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
