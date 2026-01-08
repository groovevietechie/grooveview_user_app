"use client"

import { useState, useEffect } from "react"
import type { Business, ServiceConfiguration, ServiceOption } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { getServiceConfigurations, getServiceOptionsFromCustomFields } from "@/lib/api"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import ServiceTypeSelection from "./service-flow/ServiceTypeSelection"
import ServiceOptionsGrid from "./service-flow/ServiceOptionsGrid"
import ServiceBookingForm from "./service-flow/ServiceBookingForm"
import ServiceBookingSuccess from "./ServiceBookingSuccess"
import ServicePaymentPage from "./ServicePaymentPage"
import { ErrorBoundary, ServiceErrorFallback } from "./ErrorBoundary"

interface ServiceFlowProps {
  business: Business
  themeColor: string
  initialService?: any
  onBookingComplete?: (bookingId: string) => void
  onBackToMenu?: () => void
}

type FlowStep = "serviceTypes" | "serviceOptions" | "bookingForm" | "payment" | "success"

export default function ServiceFlow({ business, themeColor, initialService, onBookingComplete, onBackToMenu }: ServiceFlowProps) {
  const [step, setStep] = useState<FlowStep>(initialService ? "serviceOptions" : "serviceTypes")
  const [serviceConfigurations, setServiceConfigurations] = useState<ServiceConfiguration[]>([])
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
  const [selectedServiceConfig, setSelectedServiceConfig] = useState<ServiceConfiguration | null>(null)
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null)
  const [transferCode, setTransferCode] = useState<string | null>(null)
  const [bookingTotal, setBookingTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { setBusinessId, setServiceType, clearServiceCart } = useServiceStore()

  // Use the back navigation hook
  useBackNavigation({
    fallbackRoute: `/b/${business.slug}`,
    onBack: () => {
      // Custom back behavior for service flow
      if (step === "payment") {
        setStep("bookingForm")
      } else if (step === "bookingForm") {
        setStep("serviceOptions")
      } else if (step === "serviceOptions") {
        if (initialService && onBackToMenu) {
          onBackToMenu() // Use the callback to return to services tab
        } else {
          setStep("serviceTypes")
        }
      } else if (onBackToMenu) {
        onBackToMenu() // Use the callback to return to services tab
      }
    }
  })

  useEffect(() => {
    setBusinessId(business.id)
    if (initialService) {
      // If we have an initial service, set it (options will be loaded in separate useEffect)
      setSelectedServiceConfig(initialService)
      const serviceType = initialService.service_type || 'default'
      setServiceType(serviceType)
    } else {
      // Otherwise load all service configurations
      loadServiceConfigurations()
    }
  }, [business.id, initialService, setBusinessId])

  // Separate useEffect to load options when selectedServiceConfig changes
  useEffect(() => {
    if (selectedServiceConfig && step === "serviceOptions") {
      const serviceType = selectedServiceConfig.service_type || 'default'
      loadServiceOptions(serviceType, selectedServiceConfig)
    }
  }, [selectedServiceConfig, step])

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

  const loadServiceOptions = async (serviceType: string, serviceConfig?: ServiceConfiguration) => {
    try {
      setLoading(true)
      const configToUse = serviceConfig || selectedServiceConfig
      if (!configToUse) {
        setServiceOptions([])
        return
      }
      
      const allOptions = await getServiceOptionsFromCustomFields(configToUse.id)

      // Filter options based on service configuration's available_options
      let filteredOptions = allOptions
      if (configToUse.available_options && configToUse.available_options.length > 0) {
        // Filter options whose names are in the available_options array
        filteredOptions = allOptions.filter(option =>
          configToUse.available_options.includes(option.name)
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
      // If we came from a specific service button, go back to menu with services tab
      if (onBackToMenu) {
        onBackToMenu()
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

  const handleBookingComplete = (bookingId: string, transferCode: string, totalAmount: number) => {
    setCompletedBookingId(bookingId)
    setTransferCode(transferCode)
    setBookingTotal(totalAmount)
    setStep("payment")
  }

  const handlePaymentComplete = () => {
    setStep("success")
  }

  const handleBackToBookingForm = () => {
    setStep("bookingForm")
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
    setTransferCode(null)
    setBookingTotal(0)
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

        {step === "payment" && completedBookingId && transferCode && (
          <ServicePaymentPage
            business={business}
            bookingId={completedBookingId}
            totalAmount={bookingTotal}
            transferCode={transferCode}
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackToBookingForm}
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