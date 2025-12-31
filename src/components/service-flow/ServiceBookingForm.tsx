"use client"

import { useState } from "react"
import type { Business, ServiceConfiguration } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { submitServiceBooking } from "@/lib/api"
import { ArrowLeftIcon, CalendarIcon, UserGroupIcon, PhoneIcon, EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline"
import { getContrastColor } from "@/lib/color-utils"
import PreOrderSelector from "./PreOrderSelector"

interface ServiceBookingFormProps {
  business: Business
  serviceConfiguration: ServiceConfiguration
  onBack: () => void
  onBookingComplete: (bookingId: string, transferCode: string, totalAmount: number) => void
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
    selectedDuration,
    preOrderEnabled,
    preOrderItems,
    bookingDetails,
    updateBookingDetails,
    getServiceTotal,
    clearServiceCart,
    setSelectedDuration,
    setPreOrderEnabled,
    addPreOrderItem,
    removePreOrderItem,
    updatePreOrderQuantity,
    updatePreOrderNote,
    getPreOrderTotal,
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
      newErrors.eventDate = "Desired date is required"
    } else {
      const eventDate = new Date(bookingDetails.eventDate)
      const now = new Date()
      if (eventDate <= now) {
        newErrors.eventDate = "Desired date must be in the future"
      }
    }

    if (bookingDetails.numberOfParticipants < 1) {
      newErrors.numberOfParticipants = "At least 1 participant is required"
    }

    if (items.length === 0) {
      newErrors.items = "Please select at least one service option"
    }

    if (serviceConfiguration.pricing_structure.durations.length > 0 && !selectedDuration) {
      newErrors.duration = "Please select a service duration"
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
        totalAmount: getServiceTotal(serviceConfiguration.base_price),
        items: items,
        preOrderEnabled: preOrderEnabled,
        preOrderItems: preOrderEnabled ? preOrderItems : [],
        specialRequests: bookingDetails.specialRequests || undefined,
        bookingDetails: {
          serviceConfiguration: serviceConfiguration.id,
          businessName: business.name,
          businessAddress: business.address,
          selectedDuration: selectedDuration,
        }
      }

      const result = await submitServiceBooking(bookingData)
      
      if (result) {
        clearServiceCart()
        onBookingComplete(result.bookingId, result.transferCode, result.totalAmount)
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  const total = getServiceTotal(serviceConfiguration.base_price)

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
          {/* Base Price */}
          {serviceConfiguration.base_price > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Base Service Price</span>
              <span className="font-semibold">
                {formatPrice(serviceConfiguration.base_price)}
              </span>
            </div>
          )}

          {/* Selected Options */}
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

          {/* Pre-ordered Items */}
          {preOrderEnabled && preOrderItems.length > 0 && (
            <>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Pre-ordered Food & Drinks</h5>
              </div>
              {preOrderItems.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.menuItem.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    {item.note && (
                      <p className="text-sm text-gray-500 mt-1">Note: {item.note}</p>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Duration Multiplier */}
          {selectedDuration && (
            <div className="flex justify-between items-center text-green-600">
              <span className="font-medium">
                Duration: {selectedDuration.label} ({selectedDuration.hours} hours)
              </span>
              <span className="font-semibold">
                ×{selectedDuration.multiplier}
              </span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-bold text-lg">Total Amount</span>
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
              Desired Date & Time *
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

        {/* Service Duration */}
        {serviceConfiguration.pricing_structure.durations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Duration *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviceConfiguration.pricing_structure.durations.map((duration, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedDuration(duration)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedDuration?.label === duration.label
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">{duration.label}</div>
                  <div className="text-sm text-gray-600">{duration.hours} hours</div>
                  <div className="text-sm font-medium text-green-600">
                    {duration.multiplier}x rate
                  </div>
                </button>
              ))}
            </div>
            {errors.duration && (
              <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
            )}
          </div>
        )}

        {/* Pre-Order Toggle */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preOrderEnabled}
              onChange={(e) => setPreOrderEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Pre-order Food and Drinks for the event
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Select food and beverages to be prepared and served during your event
          </p>
        </div>

        {/* Pre-Order Selection */}
        {preOrderEnabled && (
          <PreOrderSelector
            businessId={businessId}
            themeColor={themeColor}
          />
        )}

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