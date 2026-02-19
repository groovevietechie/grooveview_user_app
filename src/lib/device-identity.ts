/**
 * Device Identity Management
 * Generates and manages unique device identifiers for customer tracking
 */

const DEVICE_ID_KEY = "groovevie_device_id"
const CUSTOMER_ID_KEY = "groovevie_customer_id"

export interface DeviceFingerprint {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `dev_${timestamp}_${randomStr}`
}

/**
 * Get or create device ID
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return ""

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
      console.log("[DeviceIdentity] Generated new device ID:", deviceId)
    }
    
    return deviceId
  } catch (error) {
    console.error("[DeviceIdentity] Error getting device ID:", error)
    return generateDeviceId() // Fallback to session-only ID
  }
}

/**
 * Generate device fingerprint for verification
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === "undefined") {
    return {
      userAgent: "",
      screenResolution: "",
      timezone: "",
      language: "",
      platform: "",
    }
  }

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
  }
}

/**
 * Get device name for display
 */
export function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device"

  const ua = navigator.userAgent
  
  // Mobile devices
  if (/iPhone/i.test(ua)) return "iPhone"
  if (/iPad/i.test(ua)) return "iPad"
  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Android Phone"
    return "Android Tablet"
  }
  
  // Desktop browsers
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return "Chrome Browser"
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari Browser"
  if (/Firefox/i.test(ua)) return "Firefox Browser"
  if (/Edge/i.test(ua)) return "Edge Browser"
  
  return "Web Browser"
}

/**
 * Check if device has a customer profile
 */
export function isDeviceRegistered(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const customerId = localStorage.getItem(CUSTOMER_ID_KEY)
    return !!customerId
  } catch (error) {
    console.error("[DeviceIdentity] Error checking registration:", error)
    return false
  }
}

/**
 * Get customer ID for this device
 */
export function getCustomerId(): string | null {
  if (typeof window === "undefined") return null
  
  try {
    return localStorage.getItem(CUSTOMER_ID_KEY)
  } catch (error) {
    console.error("[DeviceIdentity] Error getting customer ID:", error)
    return null
  }
}

/**
 * Set customer ID for this device
 */
export function setCustomerId(customerId: string): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(CUSTOMER_ID_KEY, customerId)
    console.log("[DeviceIdentity] Set customer ID:", customerId)
  } catch (error) {
    console.error("[DeviceIdentity] Error setting customer ID:", error)
  }
}

/**
 * Clear customer ID (unlink device)
 */
export function clearCustomerId(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(CUSTOMER_ID_KEY)
    console.log("[DeviceIdentity] Cleared customer ID")
  } catch (error) {
    console.error("[DeviceIdentity] Error clearing customer ID:", error)
  }
}
