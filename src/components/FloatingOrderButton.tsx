"use client"

import { useRouter } from "next/navigation"
import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid"

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
      className="fixed bottom-8 left-6 z-30 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 hover:shadow-3xl active:scale-95 flex items-center gap-2"
      aria-label="Track your orders"
      title="Track your orders"
    >
      <ClipboardDocumentListIcon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap">My Orders</span>
    </button>
  )
}
