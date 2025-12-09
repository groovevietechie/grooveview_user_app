"use client"

import { useRouter } from "next/navigation"
import { ShoppingBagIcon } from "@heroicons/react/24/solid"

interface FloatingOrderButtonProps {
  businessSlug: string
  primaryColor: string
}

export default function FloatingOrderButton({ businessSlug, primaryColor }: FloatingOrderButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/b/${businessSlug}/orders`)}
      style={{ backgroundColor: primaryColor }}
      className="fixed bottom-8 right-8 z-30 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 animate-pulse"
      aria-label="View orders"
      title="View your orders"
    >
      <ShoppingBagIcon className="w-6 h-6" />
    </button>
  )
}
