"use client"

import { useState, useEffect } from "react"
import type { Business, ServiceConfiguration, ServiceOption } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { getServiceConfigurations, getServiceOptions } from "@/lib/api"
import ServiceTypeSelection from "./service-flow/ServiceTypeSelection"
import ServiceOptionsGrid from "./service-flow/ServiceOptionsGrid"
import ServiceBookingForm from "./service-flow/ServiceBookingForm"
import ServiceBookingSuccess from "./ServiceBookingSuccess"
import { ErrorBoundary, ServiceErrorFallback } from "./ErrorBoundary"

interface ServiceFlowProps {
  business: Business
  themeColor: string
  initialService?: any
  onBookingComplete?: (bookingId: string) => void
}

type FlowStep = "serviceTypes" | "serviceOptions" | "bookingForm" | "success"

export default function ServiceFlow({ business, themeColor, initialService, onBookingComplete }: ServiceFlowProps) {
  const [step, setStep] = useState<FlowStep>(initialService ? "serviceOptions" : "serviceTypes")
  const [serviceConfigurations, setServiceConfigurations] = useState<ServiceConfiguration[]>([])
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
  const [selectedServiceConfig, setSelectedServiceConfig] = useState<ServiceConfiguration | null>(null)
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { setBusinessId, setServiceType, clearServiceCart } = useServiceStore()

  useEffect(() => {
    setBusinessId(business.id)
    if (initialService) {
      // If we have an initial service, set it and load its options
      setSelectedServiceConfig(initialService)
      const serviceType = initialService.service_type || 'default'
      setServiceType(serviceType)
      loadServiceOptions(serviceType)
    } else {
      // Otherwise load all service configurations
      loadServiceConfigurations()
    }
  }, [business.id, initialService, setBusinessId])

  const loadServiceConfigurations = async () => {
    try {
      setLoading(true)
      const configs = await getServiceConfigurations(business.id)
      setServiceConfigurations(configs)
      
      if (configs.length === 0) {
        setError("No services are currently available.")
      }
    } catch (err) {
      console.error("Error loading service configurations:", err)
      setError("Failed to load services. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadServiceOptions = async (serviceType: string) => {
    try {
      setLoading(true)
      const allOptions = await getServiceOptions(business.id)

      // Filter options based on service configuration's available_options
      let filteredOptions = allOptions
      if (selectedServiceConfig?.available_options && selectedServiceConfig.available_options.length > 0) {
        // Filter options whose names are in the available_options array
        filteredOptions = allOptions.filter(option =>
          selectedServiceConfig.available_options.includes(option.name) ||
          selectedServiceConfig.available_options.includes(option.id)
        )
      }

      setServiceOptions(filteredOptions)
    } catch (err) {
      console.error("Error loading service options:", err)
      setError("Failed to load service options. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleServiceTypeSelect = async (serviceConfig: ServiceConfiguration) => {
    setSelectedServiceConfig(serviceConfig)
    const serviceType = serviceConfig.service_type || 'default'
    setServiceType(serviceType)
    await loadServiceOptions(serviceType)
    setStep("serviceOptions")
  }

  const handleBackToServiceTypes = () => {
    if (initialService) {
      // If we came from a specific service button, go back to menu
      if (onBookingComplete) {
        onBookingComplete("")
      }
    } else {
      // Otherwise go back to service types selection
      setSelectedServiceConfig(null)
      setServiceOptions([])
      clearServiceCart()
      setStep("serviceTypes")
    }
  }

  const handleProceedToBooking = () => {
    setStep("bookingForm")
  }

  const handleBackToOptions = () => {
    setStep("serviceOptions")
  }

  const handleBookingComplete = (bookingId: string) => {
    setCompletedBookingId(bookingId)
    setStep("success")
  }

  const handleSuccessContinue = () => {
    if (onBookingComplete && completedBookingId) {
      onBookingComplete(completedBookingId)
    }
    // Reset to initial state
    setStep("serviceTypes")
    setSelectedServiceConfig(null)
    setServiceOptions([])
    setCompletedBookingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColor }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={loadServiceConfigurations}
          className="px-6 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: themeColor }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={(props) => <ServiceErrorFallback {...props} themeColor={themeColor} />}>
      <div className="w-full">
        {step === "serviceTypes" && (
          <ServiceTypeSelection
            serviceConfigurations={serviceConfigurations}
            onSelectServiceType={handleServiceTypeSelect}
            themeColor={themeColor}
          />
        )}

        {step === "serviceOptions" && selectedServiceConfig && (
          <div className="space-y-6">
            <ServiceOptionsGrid
              serviceConfiguration={selectedServiceConfig}
              serviceOptions={serviceOptions}
              onBack={handleBackToServiceTypes}
              themeColor={themeColor}
            />
            
            {/* Proceed to Booking Button */}
            <div className="flex justify-center">
              <button
                onClick={handleProceedToBooking}
                className="px-8 py-3 rounded-lg text-white font-semibold text-lg transition-all hover:shadow-lg"
                style={{ backgroundColor: themeColor }}
              >
                Proceed to Booking
              </button>
            </div>
          </div>
        )}

        {step === "bookingForm" && selectedServiceConfig && (
          <ServiceBookingForm
            business={business}
            serviceConfiguration={selectedServiceConfig}
            onBack={handleBackToOptions}
            onBookingComplete={handleBookingComplete}
            themeColor={themeColor}
          />
        )}

        {step === "success" && completedBookingId && (
          <ServiceBookingSuccess
            business={business}
            bookingId={completedBookingId}
            onContinue={handleSuccessContinue}
            themeColor={themeColor}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}