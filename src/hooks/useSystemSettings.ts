import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { broadcastSettingChange, onSettingChange } from "@/lib/settings-events"

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  description?: string
  data_type: string
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch and subscribe to real-time updates for a specific system setting
 * Automatically updates when the setting changes in the database
 */
export function useSystemSetting(
  settingKey: string,
  defaultValue?: string
): { value: string | null; loading: boolean; error?: string } {
  const [value, setValue] = useState<string | null>(defaultValue || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const fetchSetting = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("setting_key", settingKey)
        .single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Not found - use default value
          console.warn(`[useSystemSetting] Setting '${settingKey}' not found, using default`)
          setError(undefined)
        } else {
          console.error(`[useSystemSetting] Error fetching setting:`, fetchError)
          setError(fetchError.message)
        }
      } else {
        setValue(data?.setting_value || defaultValue || null)
        setError(undefined)
      }
    } catch (err) {
      console.error(`[useSystemSetting] Unexpected error:`, err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [settingKey, defaultValue])

  useEffect(() => {
    fetchSetting()

    // Subscribe to real-time updates for this specific setting
    const channel = supabase
      .channel(`system_settings:${settingKey}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "system_settings",
          filter: `setting_key=eq.${settingKey}`,
        },
        (payload) => {
          console.log(`[useSystemSetting] Real-time update for '${settingKey}':`, payload)

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newData = payload.new as SystemSetting
            setValue(newData.setting_value)
            setError(undefined)
            // Broadcast the change to other components and tabs
            broadcastSettingChange(settingKey, newData.setting_value)
          } else if (payload.eventType === "DELETE") {
            setValue(defaultValue || null)
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useSystemSetting] Subscription status for '${settingKey}':`, status)
      })

    // Also listen for broadcast events from other components in the same tab
    const unsubscribe = onSettingChange((key, val) => {
      if (key === settingKey) {
        console.log(`[useSystemSetting] Received broadcast for '${settingKey}': ${val}`)
        setValue(val)
        setError(undefined)
      }
    })

    return () => {
      channel.unsubscribe()
      unsubscribe()
    }
  }, [settingKey, defaultValue, fetchSetting])

  return { value, loading, error }
}

/**
 * Hook to fetch and subscribe to all system settings
 */
export function useAllSystemSettings(): {
  settings: SystemSetting[]
  loading: boolean
  error?: string
} {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("system_settings")
          .select("*")
          .order("created_at", { ascending: true })

        if (fetchError) {
          console.error(`[useAllSystemSettings] Error fetching settings:`, fetchError)
          setError(fetchError.message)
        } else {
          setSettings(data || [])
          setError(undefined)
        }
      } catch (err) {
        console.error(`[useAllSystemSettings] Unexpected error:`, err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()

    // Subscribe to real-time updates for all settings
    const channel = supabase
      .channel("system_settings:all")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        (payload) => {
          console.log(`[useAllSystemSettings] Real-time update:`, payload)

          setSettings((prev) => {
            if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
              const newData = payload.new as SystemSetting
              const existing = prev.findIndex((s) => s.id === newData.id)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = newData
                return updated
              } else {
                return [...prev, newData]
              }
            } else if (payload.eventType === "DELETE") {
              return prev.filter((s) => s.id !== (payload.old as SystemSetting).id)
            }
            return prev
          })

          // Broadcast the change
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newData = payload.new as SystemSetting
            broadcastSettingChange(newData.setting_key, newData.setting_value)
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useAllSystemSettings] Subscription status:`, status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return { settings, loading, error }
}
