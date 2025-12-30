"use client"

import { useState } from "react"
import type { Business } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { TrashIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline"
import { getContrastColor } from "@/lib/color-utils"

interface ServiceSidebarProps {
  business: Business
}

export default function ServiceSidebar({ business }: ServiceSidebarProps) {
  const { 
    items, 
    bookingDetails,
    getServiceTotal, 
    getServiceItemCount, 
    updateServiceQuantity, 
    removeServiceItem,
    updateServiceNote 
  } = useServiceStore()
  
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const themeColor = business.theme_color_hex
  const textColor = getContrastColor(themeColor)
  const total = getServiceTotal()
  const itemCount = getServiceItemCount()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  const toggleNoteExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedNotes(newExpanded)
  }

  const handleNoteChange = (itemId: string, note: string) => {
    updateServiceNote(itemId, note)
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-4">
        <h3 className="font-semibold text-lg mb-4" style={{ color: themeColor }}>
          Service Booking
        </h3>
        <div className="text-center py-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${themeColor}10` }}
          >
            <span className="text-2xl" style={{ color: themeColor }}>🛎️</span>
          </div>
          <p className="text-gray-500 text-sm">
            Select service options to start your booking
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg" style={{ color: themeColor }}>
          Service Booking
        </h3>
        <span className="text-sm text-gray-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Service Items */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.serviceOption.id} className="border-b border-gray-100 pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                  {item.serviceOption.name}
                </h4>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {item.serviceOption.category}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: themeColor }}>
                  {formatPrice(item.serviceOption.price)}
                </p>
              </div>
              <button
                onClick={() => removeServiceItem(item.serviceOption.id)}
                className="text-red-500 hover:text-red-700 p-1 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateServiceQuantity(item.serviceOption.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: themeColor, color: themeColor }}
                >
                  <MinusIcon className="w-3 h-3" />
                </button>
                <span className="font-semibold text-sm min-w-[1.5rem] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateServiceQuantity(item.serviceOption.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: themeColor }}
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
              <span className="font-semibold text-sm">
                {formatPrice(item.serviceOption.price * item.quantity)}
              </span>
            </div>

            {/* Notes */}
            <div>
              <button
                onClick={() => toggleNoteExpansion(item.serviceOption.id)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expandedNotes.has(item.serviceOption.id) ? 'Hide note' : 'Add note'}
              </button>
              {expandedNotes.has(item.serviceOption.id) && (
                <textarea
                  value={item.note || ''}
                  onChange={(e) => handleNoteChange(item.serviceOption.id, e.target.value)}
                  placeholder="Special requests for this item..."
                  className="w-full mt-2 p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
                  rows={2}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Details Summary */}
      {bookingDetails.customerName && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Booking Details</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Name:</span> {bookingDetails.customerName}</p>
            <p><span className="font-medium">Phone:</span> {bookingDetails.customerPhone}</p>
            {bookingDetails.eventDate && (
              <p><span className="font-medium">Date:</span> {new Date(bookingDetails.eventDate).toLocaleDateString()}</p>
            )}
            <p><span className="font-medium">Participants:</span> {bookingDetails.numberOfParticipants}</p>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-xl" style={{ color: themeColor }}>
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  )
}