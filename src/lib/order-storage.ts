const ORDER_STORAGE_KEY = "groovevie_device_orders"

interface DeviceOrderData {
  [businessId: string]: string[] // Array of order IDs per business
}

// Get all order IDs for the current device
export function getDeviceOrders(businessId?: string): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY)
    if (!stored) return []

    const data: DeviceOrderData = JSON.parse(stored)

    if (businessId) {
      return data[businessId] || []
    }

    // Return all order IDs across all businesses
    return Object.values(data).flat()
  } catch (error) {
    console.error("[v0] Error reading device orders from localStorage:", error)
    return []
  }
}

// Save a new order ID for the current device
export function saveDeviceOrder(businessId: string, orderId: string): void {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY)
    const data: DeviceOrderData = stored ? JSON.parse(stored) : {}

    if (!data[businessId]) {
      data[businessId] = []
    }

    // Add order ID if not already present
    if (!data[businessId].includes(orderId)) {
      data[businessId].push(orderId)
    }

    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data))
    console.log("[v0] Saved order to device:", orderId)
  } catch (error) {
    console.error("[v0] Error saving device order to localStorage:", error)
  }
}

// Check if an order belongs to the current device
export function isDeviceOrder(orderId: string, businessId?: string): boolean {
  const deviceOrders = getDeviceOrders(businessId)
  return deviceOrders.includes(orderId)
}

// Clear all orders for a specific business (optional utility)
export function clearBusinessOrders(businessId: string): void {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY)
    if (!stored) return

    const data: DeviceOrderData = JSON.parse(stored)
    delete data[businessId]

    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data))
    console.log("[v0] Cleared orders for business:", businessId)
  } catch (error) {
    console.error("[v0] Error clearing business orders:", error)
  }
}

/**
 * Link all existing orders to a customer profile
 * Called when a customer profile is created or device is linked
 */
export function linkOrdersToCustomer(customerId: string): void {
  if (typeof window === "undefined") return

  try {
    // Store customer ID association
    localStorage.setItem("groovevie_customer_id", customerId)
    console.log("[v0] Linked orders to customer:", customerId)
  } catch (error) {
    console.error("[v0] Error linking orders to customer:", error)
  }
}
