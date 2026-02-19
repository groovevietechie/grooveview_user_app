/**
 * Customer Profile & Device Sync API
 * Handles customer profile management, device linking, and activity tracking
 */

import type { Customer, CustomerDevice, CustomerActivity, Order, ServiceBooking } from "@/types/database"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Generate a unique 6-digit passcode
 */
function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Create a new customer profile with passcode
 */
export async function createCustomerProfile(
  deviceId: string,
  deviceFingerprint: string,
  deviceName: string
): Promise<{ customer: Customer; device: CustomerDevice } | null> {
  try {
    const passcode = generatePasscode()
    
    const response = await fetch(`${API_BASE}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sync_passcode: passcode,
        device_id: deviceId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
      }),
    })

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to create customer profile:", response.statusText)
      return null
    }

    const data = await response.json()
    console.log("[CustomerAPI] Created customer profile:", data.customer.id)
    return data
  } catch (error) {
    console.error("[CustomerAPI] Error creating customer profile:", error)
    return null
  }
}

/**
 * Get customer by passcode
 */
export async function getCustomerByPasscode(passcode: string): Promise<Customer | null> {
  try {
    const response = await fetch(`${API_BASE}/api/customers/by-passcode/${passcode}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      console.error("[CustomerAPI] Failed to get customer:", response.statusText)
      return null
    }

    const customer = await response.json()
    return customer
  } catch (error) {
    console.error("[CustomerAPI] Error getting customer by passcode:", error)
    return null
  }
}

/**
 * Link a device to an existing customer profile
 */
export async function linkDeviceToCustomer(
  customerId: string,
  deviceId: string,
  deviceFingerprint: string,
  deviceName: string
): Promise<CustomerDevice | null> {
  try {
    const response = await fetch(`${API_BASE}/api/customers/${customerId}/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
      }),
    })

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to link device:", response.statusText)
      return null
    }

    const device = await response.json()
    console.log("[CustomerAPI] Linked device to customer:", customerId)
    return device
  } catch (error) {
    console.error("[CustomerAPI] Error linking device:", error)
    return null
  }
}

/**
 * Get all devices for a customer
 */
export async function getCustomerDevices(customerId: string): Promise<CustomerDevice[]> {
  try {
    const response = await fetch(`${API_BASE}/api/customers/${customerId}/devices`)

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to get devices:", response.statusText)
      return []
    }

    const devices = await response.json()
    return devices
  } catch (error) {
    console.error("[CustomerAPI] Error getting devices:", error)
    return []
  }
}

/**
 * Unlink a device from customer profile
 */
export async function unlinkDevice(customerId: string, deviceId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/customers/${customerId}/devices/${deviceId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to unlink device:", response.statusText)
      return false
    }

    console.log("[CustomerAPI] Unlinked device:", deviceId)
    return true
  } catch (error) {
    console.error("[CustomerAPI] Error unlinking device:", error)
    return false
  }
}

/**
 * Track customer activity
 */
export async function trackActivity(
  customerId: string,
  deviceId: string,
  activityType: "order" | "booking" | "view" | "cart",
  activityData: Record<string, unknown>,
  businessId?: string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/customers/${customerId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        business_id: businessId,
        activity_type: activityType,
        activity_data: activityData,
      }),
    })
  } catch (error) {
    console.error("[CustomerAPI] Error tracking activity:", error)
  }
}

/**
 * Get customer activities
 */
export async function getCustomerActivities(
  customerId: string,
  businessId?: string
): Promise<CustomerActivity[]> {
  try {
    const url = businessId
      ? `${API_BASE}/api/customers/${customerId}/activities?businessId=${businessId}`
      : `${API_BASE}/api/customers/${customerId}/activities`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to get activities:", response.statusText)
      return []
    }

    const activities = await response.json()
    return activities
  } catch (error) {
    console.error("[CustomerAPI] Error getting activities:", error)
    return []
  }
}

/**
 * Get all orders for a customer across all devices
 */
export async function getCustomerOrders(
  customerId: string,
  businessId?: string
): Promise<Order[]> {
  try {
    const url = businessId
      ? `${API_BASE}/api/customers/${customerId}/orders?businessId=${businessId}`
      : `${API_BASE}/api/customers/${customerId}/orders`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to get orders:", response.statusText)
      return []
    }

    const orders = await response.json()
    return orders
  } catch (error) {
    console.error("[CustomerAPI] Error getting orders:", error)
    return []
  }
}

/**
 * Get all service bookings for a customer across all devices
 */
export async function getCustomerBookings(
  customerId: string,
  businessId?: string
): Promise<ServiceBooking[]> {
  try {
    const url = businessId
      ? `${API_BASE}/api/customers/${customerId}/bookings?businessId=${businessId}`
      : `${API_BASE}/api/customers/${customerId}/bookings`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to get bookings:", response.statusText)
      return []
    }

    const bookings = await response.json()
    return bookings
  } catch (error) {
    console.error("[CustomerAPI] Error getting bookings:", error)
    return []
  }
}

/**
 * Regenerate passcode for a customer
 */
export async function regeneratePasscode(customerId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/customers/${customerId}/regenerate-passcode`, {
      method: "POST",
    })

    if (!response.ok) {
      console.error("[CustomerAPI] Failed to regenerate passcode:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.sync_passcode
  } catch (error) {
    console.error("[CustomerAPI] Error regenerating passcode:", error)
    return null
  }
}

/**
 * Update device last active timestamp
 */
export async function updateDeviceActivity(customerId: string, deviceId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/customers/${customerId}/devices/${deviceId}/activity`, {
      method: "PUT",
    })
  } catch (error) {
    console.error("[CustomerAPI] Error updating device activity:", error)
  }
}
