/**
 * Device Identity Management
 * Generates and manages unique device identifiers for customer tracking
 */

const DEVICE_ID_KEY = "groovevie_device_id"
const CUSTOMER_ID_KEY = "groovevie_customer_id"

// Cookie helpers for backup storage
function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

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
 * Checks both localStorage and cookie for reliability
 */
export function getCustomerId(): string | null {
  if (typeof window === "undefined") return null
  
  try {
    // Try localStorage first
    let customerId = localStorage.getItem(CUSTOMER_ID_KEY)
    
    // If not in localStorage, check cookie
    if (!customerId) {
      customerId = getCookie(CUSTOMER_ID_KEY)
      if (customerId) {
        console.log("[DeviceIdentity] Customer ID found in cookie, restoring to localStorage:", customerId)
        // Restore to localStorage
        localStorage.setItem(CUSTOMER_ID_KEY, customerId)
      }
    }
    
    console.log("[DeviceIdentity] Getting customer ID:", customerId)
    return customerId
  } catch (error) {
    console.error("[DeviceIdentity] Error getting customer ID:", error)
    // Fallback to cookie if localStorage fails
    return getCookie(CUSTOMER_ID_KEY)
  }
}

/**
 * Set customer ID for this device
 * Saves to both localStorage and cookie for reliability
 */
export function setCustomerId(customerId: string): void {
  if (typeof window === "undefined") return
  
  try {
    // Save to localStorage
    localStorage.setItem(CUSTOMER_ID_KEY, customerId)
    console.log("[DeviceIdentity] Set customer ID in localStorage:", customerId)
    
    // Also save to cookie as backup
    setCookie(CUSTOMER_ID_KEY, customerId, 365)
    console.log("[DeviceIdentity] Set customer ID in cookie:", customerId)
    
    // Immediately verify both
    const savedLS = localStorage.getItem(CUSTOMER_ID_KEY)
    const savedCookie = getCookie(CUSTOMER_ID_KEY)
    
    if (savedLS === customerId && savedCookie === customerId) {
      console.log("[DeviceIdentity] ✅ Customer ID verified in both localStorage and cookie")
    } else {
      console.error("[DeviceIdentity] ❌ Customer ID NOT saved correctly!")
      console.error("  localStorage:", savedLS)
      console.error("  cookie:", savedCookie)
    }
  } catch (error) {
    console.error("[DeviceIdentity] Error setting customer ID:", error)
    // Try cookie as fallback
    try {
      setCookie(CUSTOMER_ID_KEY, customerId, 365)
      console.log("[DeviceIdentity] Saved to cookie as fallback")
    } catch (e) {
      console.error("[DeviceIdentity] Cookie fallback also failed:", e)
    }
  }
}

/**
 * Clear customer ID (unlink device)
 * Clears from both localStorage and cookie
 */
export function clearCustomerId(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(CUSTOMER_ID_KEY)
    deleteCookie(CUSTOMER_ID_KEY)
    console.log("[DeviceIdentity] Cleared customer ID from localStorage and cookie")
  } catch (error) {
    console.error("[DeviceIdentity] Error clearing customer ID:", error)
  }
}
