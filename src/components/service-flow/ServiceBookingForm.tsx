"use client"

import { useState } from "react"
import type { Business, ServiceConfiguration } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { submitServiceBooking } from "@/lib/api"
import { ArrowLeftIcon, CalendarIcon, UserGroupIcon, PhoneIcon, EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline"
import { getContrastColor } from "@/lib/color-utils"

interface ServiceBookingFormProps {
  business: Business
  serviceConfiguration: ServiceConfiguration
  onBack: () => void
  onBookingComplete: (bookingId: string) => void
  themeColor: string
}

export default function ServiceBookingForm({ 
  business, 
  serviceConfiguration, 
  onBack, 
  onBookingComplete, 
  themeColor 
}: ServiceBookingFormProps) {
  const { 
    items, 
    bookingDetails, 
    updateBookingDetails, 
    getServiceTotal, 
    clearServiceCart,
    businessId 
  } = useServiceStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!bookingDetails.customerName.trim()) {
      newErrors.customerName = "Name is required"
    }

    if (!bookingDetails.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required"
    }

    if (!bookingDetails.eventDate) {
      newErrors.eventDate = "Event date is required"
    } else {
      const eventDate = new Date(bookingDetails.eventDate)
      const now = new Date()
      if (eventDate <= now) {
        newErrors.eventDate = "Event date must be in the future"
      }
    }

    if (bookingDetails.numberOfParticipants < 1) {
      newErrors.numberOfParticipants = "At least 1 participant is required"
    }

    if (items.length === 0) {
      newErrors.items = "Please select at least one service option"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const bookingData = {
        businessId: businessId,
        customerName: bookingDetails.customerName,
        customerPhone: bookingDetails.customerPhone,
        customerEmail: bookingDetails.customerEmail || undefined,
        serviceType: serviceConfiguration.service_type,
        eventDate: new Date(bookingDetails.eventDate).toISOString(),
        numberOfParticipants: bookingDetails.numberOfParticipants,
        totalAmount: getServiceTotal(),
        items: items,
        specialRequests: bookingDetails.specialRequests || undefined,
        bookingDetails: {
          serviceConfiguration: serviceConfiguration.id,
          businessName: business.name,
          businessAddress: business.address,
        }
      }

      const bookingId = await submitServiceBooking(bookingData)
      
      if (bookingId) {
        clearServiceCart()
        onBookingComplete(bookingId)
      } else {
        setErrors({ submit: "Failed to submit booking. Please try again." })
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      setErrors({ submit: "An unexpected error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const total = getServiceTotal()

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: themeColor }}
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Booking</h2>
          <p className="text-gray-600">{serviceConfiguration.title}</p>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4" style={{ color: themeColor }}>
          Booking Summary
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.serviceOption.id} className="flex justify-between items-center">
              <div>
                <span className="font-medium">{item.serviceOption.name}</span>
                <span className="text-gray-500 ml-2">x{item.quantity}</span>
                {item.note && (
                  <p className="text-sm text-gray-500 mt-1">Note: {item.note}</p>
                )}
              </div>
              <span className="font-semibold">
                {formatPrice(item.serviceOption.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl" style={{ color: themeColor }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-lg" style={{ color: themeColor }}>
          Booking Details
        </h3>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={bookingDetails.customerName}
              onChange={(e) => updateBookingDetails({ customerName: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
              placeholder="Enter your full name"
            />
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhoneIcon className="w-4 h-4 inline mr-1" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={bookingDetails.customerPhone}
              onChange={(e) => updateBookingDetails({ customerPhone: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.customerPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
              placeholder="Enter your phone number"
            />
            {errors.customerPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <EnvelopeIcon className="w-4 h-4 inline mr-1" />
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={bookingDetails.customerEmail}
            onChange={(e) => updateBookingDetails({ customerEmail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
            placeholder="Enter your email address"
          />
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              value={bookingDetails.eventDate}
              onChange={(e) => updateBookingDetails({ eventDate: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.eventDate ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
              min={new Date().toISOString().slice(0, 16)}
            />
            {errors.eventDate && (
              <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="w-4 h-4 inline mr-1" />
              Number of Participants *
            </label>
            <input
              type="number"
              min="1"
              value={bookingDetails.numberOfParticipants}
              onChange={(e) => updateBookingDetails({ numberOfParticipants: parseInt(e.target.value) || 1 })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.numberOfParticipants ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
              placeholder="Number of people"
            />
            {errors.numberOfParticipants && (
              <p className="text-red-500 text-sm mt-1">{errors.numberOfParticipants}</p>
            )}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={bookingDetails.specialRequests}
            onChange={(e) => updateBookingDetails({ specialRequests: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
            placeholder="Any special requests or notes for your booking..."
          />
        </div>

        {/* Error Messages */}
        {errors.items && (
          <p className="text-red-500 text-sm">{errors.items}</p>
        )}
        {errors.submit && (
          <p className="text-red-500 text-sm">{errors.submit}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg text-white font-semibold text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: themeColor }}
        >
          {isSubmitting ? "Submitting Booking..." : `Confirm Booking - ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}