/**
 * Settings Events Manager
 * Handles broadcasting settings changes across browser tabs and components
 */

type SettingChangeListener = (key: string, value: string) => void

const listeners = new Set<SettingChangeListener>()

/**
 * Broadcast a settings change to all listeners and across browser tabs
 */
export function broadcastSettingChange(settingKey: string, settingValue: string): void {
  console.log(`[SettingsEvents] Broadcasting change: ${settingKey}=${settingValue}`)

  // Notify local listeners
  listeners.forEach((listener) => {
    try {
      listener(settingKey, settingValue)
    } catch (error) {
      console.error("[SettingsEvents] Error in listener:", error)
    }
  })

  // Broadcast to other tabs via localStorage
  try {
    const event = {
      type: "setting_changed",
      key: settingKey,
      value: settingValue,
      timestamp: Date.now(),
    }
    localStorage.setItem(`__setting_change_${settingKey}`, JSON.stringify(event))
  } catch (error) {
    console.warn("[SettingsEvents] Could not broadcast to other tabs:", error)
  }
}

/**
 * Subscribe to settings changes
 * Returns unsubscribe function
 */
export function onSettingChange(listener: SettingChangeListener): () => void {
  listeners.add(listener)

  // Also listen for changes from other tabs
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key?.startsWith("__setting_change_")) {
      try {
        const data = JSON.parse(event.newValue || "{}")
        if (data.type === "setting_changed") {
          listener(data.key, data.value)
        }
      } catch (error) {
        console.error("[SettingsEvents] Error parsing storage event:", error)
      }
    }
  }

  window.addEventListener("storage", handleStorageChange)

  // Return unsubscribe function
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", handleStorageChange)
  }
}

/**
 * Clear all listeners
 */
export function clearSettingListeners(): void {
  listeners.clear()
}
