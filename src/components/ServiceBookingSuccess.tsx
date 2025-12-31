"use client"

import { CheckCircleIcon, CalendarIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/solid"
import type { Business } from "@/types/database"

interface ServiceBookingSuccessProps {
  business: Business
  bookingId: string
  onContinue: () => void
  themeColor: string
}

export default function ServiceBookingSuccess({ 
  business, 
  bookingId, 
  onContinue, 
  themeColor 
}: ServiceBookingSuccessProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${themeColor}20` }}
        >
          <CheckCircleIcon 
            className="w-12 h-12" 
            style={{ color: themeColor }} 
          />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Payment Confirmed!
        </h2>
        <p className="text-gray-600">
          Your service booking and payment have been successfully processed.
        </p>
      </div>

      {/* Booking Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left space-y-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${themeColor}10` }}
          >
            <span className="text-lg font-bold" style={{ color: themeColor }}>
              #
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Booking ID</p>
            <p className="font-semibold text-gray-900">{bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="font-semibold text-gray-900">What's Next?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CalendarIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
              <p>Your booking is confirmed and we'll prepare everything for your event.</p>
            </div>
            <div className="flex items-start gap-2">
              <PhoneIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
              <p>We'll contact you 24 hours before your event to confirm final details.</p>
            </div>
            <div className="flex items-start gap-2">
              <EnvelopeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
              <p>Check your email for booking confirmation and event details.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Contact Info */}
      <div className="bg-gray-50 rounded-2xl p-4 text-left">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Business:</span> {business.name}</p>
          {business.phone && (
            <p><span className="font-medium">Phone:</span> {business.phone}</p>
          )}
          {business.address && (
            <p><span className="font-medium">Address:</span> {business.address}</p>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        Continue Browsing
      </button>
    </div>
  )
}