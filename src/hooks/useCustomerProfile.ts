/**
 * Hook for managing customer profile data
 * Pre-loads customer data on mount for instant access
 */

import { useState, useEffect } from "react"
import { getCustomerId, getDeviceId, setCustomerId } from "@/lib/device-identity"
import { getCustomerDevices, updateDeviceActivity, getCustomerByDeviceId } from "@/lib/customer-api"
import type { Customer, CustomerDevice } from "@/types/database"

export function useCustomerProfile() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [devices, setDevices] = useState<CustomerDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomerData = async () => {
    let customerId = getCustomerId()
    
    // If no customerId in storage, try to find customer by device ID
    if (!customerId) {
      const deviceId = getDeviceId()
      if (deviceId) {
        const customerByDevice = await getCustomerByDeviceId(deviceId)
        if (customerByDevice) {
          setCustomerId(customerByDevice.id) // persist it
          customerId = customerByDevice.id
        }
      }
    }

    if (!customerId) {
      setCustomer(null)
      setDevices([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch customer and devices
      const [customerData, devicesData] = await Promise.all([
        fetch(`/api/customers/${customerId}`).then(res => res.ok ? res.json() : null),
        getCustomerDevices(customerId),
      ])

      if (customerData) {
        setCustomer(customerData)
        setDevices(devicesData)

        // Update device activity
        const deviceId = getDeviceId()
        await updateDeviceActivity(customerId, deviceId)
      } else {
        setCustomer(null)
        setDevices([])
        setError("Customer profile not found")
      }
    } catch (err) {
      console.error("[useCustomerProfile] Error loading customer data:", err)
      setCustomer(null)
      setDevices([])
      setError("Failed to load customer data")
    } finally {
      setLoading(false)
    }
  }

  // Load customer data on mount
  useEffect(() => {
    loadCustomerData()
  }, [])

  const refreshCustomerData = () => {
    loadCustomerData()
  }

  return {
    customer,
    devices,
    loading,
    error,
    refreshCustomerData,
    hasProfile: !!customer,
  }
}
