"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { getContrastColor, lightenColor, darkenColor } from "@/lib/color-utils"
import {
  getDeviceId,
  getDeviceName,
  generateDeviceFingerprint,
} from "@/lib/device-identity"
import {
  createCustomerProfile,
  getCustomerByPasscode,
  getCustomerByDeviceId,
  linkDeviceToCustomer,
  getCustomerDevices,
  unlinkDevice,
  regeneratePasscode,
  updateDeviceActivity,
} from "@/lib/customer-api"
import type { Customer, CustomerDevice } from "@/types/database"
import {
  XMarkIcon,
  DevicePhoneMobileIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

interface DeviceSyncModalProps {
  isOpen: boolean
  onClose: () => void
  preloadedCustomer?: Customer | null
  preloadedDevices?: CustomerDevice[]
  onDataChange?: () => void
}

export default function DeviceSyncModal({ 
  isOpen, 
  onClose, 
  preloadedCustomer, 
  preloadedDevices = [],
  onDataChange 
}: DeviceSyncModalProps) {
  const { primaryColor } = useTheme()
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(preloadedCustomer || null)
  const [devices, setDevices] = useState<CustomerDevice[]>(preloadedDevices || [])
  const [passcodeInput, setPasscodeInput] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showLinkDevice, setShowLinkDevice] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const themeShades = {
    lightest: lightenColor(primaryColor, 90),
    lighter: lightenColor(primaryColor, 70),
    light: lightenColor(primaryColor, 50),
    medium: lightenColor(primaryColor, 30),
    base: primaryColor,
    dark: darkenColor(primaryColor, 20),
    darker: darkenColor(primaryColor, 40),
  }
  const contrastColor = getContrastColor(primaryColor)

  // ALWAYS load customer data from database using device ID (NO localStorage!)
  useEffect(() => {
    if (!isOpen) return

    console.log("[DeviceSync] Modal opened, loading customer by device ID...")
    loadCustomerDataByDevice()
  }, [isOpen])

  const loadCustomerDataByDevice = async () => {
    setLoading(true)
    
    try {
      // Get device ID (this is reliably stored)
      const deviceId = getDeviceId()
      console.log("[DeviceSync] Device ID:", deviceId)
      
      // Look up customer by device ID in database
      const customerData = await getCustomerByDeviceId(deviceId)
      
      if (customerData) {
        console.log("[DeviceSync] Customer found:", customerData.id)
        console.log("[DeviceSync] Passcode:", customerData.sync_passcode)
        
        // Load devices for this customer
        const devicesData = await getCustomerDevices(customerData.id)
        
        setCustomer(customerData)
        setDevices(devicesData)
        
        // Update device activity
        await updateDeviceActivity(customerData.id, deviceId)
      } else {
        console.log("[DeviceSync] No customer found for this device")
        setCustomer(null)
        setDevices([])
      }
    } catch (err) {
      console.error("[DeviceSync] Error loading customer data:", err)
      setCustomer(null)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async () => {
    setLoading(true)
    setError("")

    try {
      const deviceId = getDeviceId()
      const fingerprint = JSON.stringify(generateDeviceFingerprint())
      const deviceName = getDeviceName()

      console.log("[DeviceSync] Creating profile for device:", deviceId)

      const result = await createCustomerProfile(deviceId, fingerprint, deviceName)

      if (!result) {
        setError("Failed to create profile. Please try again.")
        setLoading(false)
        return
      }

      console.log("[DeviceSync] Profile created successfully:", result.customer.id)
      console.log("[DeviceSync] Passcode:", result.customer.sync_passcode)
      console.log("[DeviceSync] Device is now linked in database")

      // NO localStorage needed! Device is linked in database
      setCustomer(result.customer)
      setDevices([result.device])
      
      // Notify parent to refresh data
      onDataChange?.()
    } catch (err) {
      console.error("[DeviceSync] Error creating profile:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLinkDevice = async () => {
    if (passcodeInput.length !== 6) {
      setError("Please enter a 6-digit passcode")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Get customer by passcode
      const customerData = await getCustomerByPasscode(passcodeInput)

      if (!customerData) {
        setError("Invalid passcode. Please check and try again.")
        setLoading(false)
        return
      }

      // Link this device to the customer
      const deviceId = getDeviceId()
      const fingerprint = JSON.stringify(generateDeviceFingerprint())
      const deviceName = getDeviceName()

      const device = await linkDeviceToCustomer(customerData.id, deviceId, fingerprint, deviceName)

      if (!device) {
        setError("Failed to link device. Please try again.")
        setLoading(false)
        return
      }

      console.log("[DeviceSync] Device linked successfully to customer:", customerData.id)
      
      // NO localStorage needed! Device is linked in database
      setCustomer(customerData)
      setShowLinkDevice(false)
      setPasscodeInput("")
      
      // Reload devices and notify parent
      await loadCustomerDataByDevice()
      onDataChange?.()
    } catch (err) {
      console.error("[DeviceSync] Error linking device:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkDevice = async (deviceId: string) => {
    if (!customer) return

    const currentDeviceId = getDeviceId()
    
    if (deviceId === currentDeviceId) {
      if (!confirm("Are you sure you want to unlink this device? You'll need the passcode to link it again.")) {
        return
      }
    }

    setLoading(true)
    try {
      const success = await unlinkDevice(customer.id, deviceId)

      if (success) {
        if (deviceId === currentDeviceId) {
          // Unlinking current device - will show "No Profile Yet" on next open
          setCustomer(null)
          setDevices([])
        } else {
          // Reload devices
          await loadCustomerDataByDevice()
        }
        
        // Notify parent to refresh data
        onDataChange?.()
      } else {
        setError("Failed to unlink device")
      }
    } catch (err) {
      console.error("[DeviceSync] Error unlinking device:", err)
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleRegeneratePasscode = async () => {
    if (!customer) return

    if (!confirm("Generate a new passcode? Your old passcode will no longer work.")) {
      return
    }

    setRegenerating(true)
    try {
      const newPasscode = await regeneratePasscode(customer.id)

      if (newPasscode) {
        setCustomer({ ...customer, sync_passcode: newPasscode })
        
        // Notify parent to refresh data
        onDataChange?.()
      } else {
        setError("Failed to regenerate passcode")
      }
    } catch (err) {
      console.error("[DeviceSync] Error regenerating passcode:", err)
      setError("An error occurred")
    } finally {
      setRegenerating(false)
    }
  }

  const copyPasscode = () => {
    if (!customer) return

    navigator.clipboard.writeText(customer.sync_passcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatPasscode = (passcode: string) => {
    return `${passcode.slice(0, 3)} ${passcode.slice(3)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="sticky top-0 p-6 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${themeShades.lightest} 0%, #ffffff 100%)`,
            borderColor: themeShades.light,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: themeShades.lighter }}
            >
              <DevicePhoneMobileIcon className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Device Sync</h2>
              <p className="text-sm text-gray-600">Manage your devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin">
                <div
                  className="w-12 h-12 border-4 rounded-full"
                  style={{
                    borderColor: themeShades.lighter,
                    borderTopColor: primaryColor,
                  }}
                ></div>
              </div>
            </div>
          )}

          {!loading && !customer && !showLinkDevice && (
            <div className="text-center py-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: themeShades.lightest }}
              >
                <DevicePhoneMobileIcon className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Profile Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create a profile to sync your orders and activities across multiple devices
              </p>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                  onClick={handleCreateProfile}
                  style={{ backgroundColor: primaryColor, color: contrastColor }}
                  className="px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create Profile & Get Passcode
                </button>
                <button
                  onClick={() => setShowLinkDevice(true)}
                  className="px-6 py-3 rounded-xl font-semibold border-2 transition-all"
                  style={{
                    borderColor: themeShades.medium,
                    color: primaryColor,
                  }}
                >
                  I Have a Passcode
                </button>
              </div>
            </div>
          )}

          {!loading && !customer && showLinkDevice && (
            <div className="max-w-md mx-auto">
              <button
                onClick={() => {
                  setShowLinkDevice(false)
                  setError("")
                  setPasscodeInput("")
                }}
                className="text-sm text-gray-600 mb-6 hover:text-gray-900"
              >
                ← Back
              </button>

              <div
                className="p-6 rounded-xl border-2 mb-6"
                style={{
                  backgroundColor: themeShades.lightest,
                  borderColor: themeShades.light,
                }}
              >
                <h3 className="font-bold text-gray-900 mb-4">Link This Device</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit passcode from your other device
                </p>

                <input
                  type="text"
                  value={passcodeInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setPasscodeInput(value)
                    setError("")
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-lg border-2 text-center text-2xl font-mono tracking-widest mb-4"
                  style={{ borderColor: error ? "#dc2626" : themeShades.medium }}
                  maxLength={6}
                />

                {error && (
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                )}

                <button
                  onClick={handleLinkDevice}
                  disabled={loading || passcodeInput.length !== 6}
                  style={{ backgroundColor: primaryColor, color: contrastColor }}
                  className="w-full px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Linking..." : "Link Device"}
                </button>
              </div>
            </div>
          )}

          {customer && (
            <div className="space-y-6">
              {/* Passcode Display */}
              <div
                className="p-6 rounded-xl border-2"
                style={{
                  background: `linear-gradient(135deg, ${themeShades.lightest} 0%, #ffffff 100%)`,
                  borderColor: themeShades.medium,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Your Sync Passcode</h3>
                  <button
                    onClick={handleRegeneratePasscode}
                    disabled={regenerating}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2"
                    style={{
                      borderColor: themeShades.medium,
                      color: primaryColor,
                    }}
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
                    New Code
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 px-6 py-4 rounded-xl text-center"
                    style={{ backgroundColor: "white", border: `2px solid ${primaryColor}` }}
                  >
                    <p className="text-4xl font-bold tracking-widest" style={{ color: primaryColor }}>
                      {formatPasscode(customer.sync_passcode)}
                    </p>
                  </div>
                  <button
                    onClick={copyPasscode}
                    className="p-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: copied ? themeShades.lighter : "white",
                      border: `2px solid ${themeShades.medium}`,
                    }}
                  >
                    {copied ? (
                      <CheckIcon className="w-6 h-6" style={{ color: primaryColor }} />
                    ) : (
                      <ClipboardDocumentIcon className="w-6 h-6" style={{ color: primaryColor }} />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  Use this code to link other devices to your profile
                </p>
              </div>

              {/* Linked Devices */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Linked Devices ({devices.length})</h3>
                <div className="space-y-3">
                  {devices.map((device) => {
                    const isCurrentDevice = device.device_id === getDeviceId()
                    return (
                      <div
                        key={device.id}
                        className="p-4 rounded-xl border-2 flex items-center justify-between"
                        style={{
                          backgroundColor: isCurrentDevice ? themeShades.lightest : "white",
                          borderColor: isCurrentDevice ? primaryColor : themeShades.light,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: themeShades.lighter }}
                          >
                            <DevicePhoneMobileIcon className="w-5 h-5" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {device.device_name}
                              {isCurrentDevice && (
                                <span
                                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: primaryColor,
                                    color: contrastColor,
                                  }}
                                >
                                  This Device
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              Last active: {new Date(device.last_active_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkDevice(device.device_id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Unlink device"
                        >
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
