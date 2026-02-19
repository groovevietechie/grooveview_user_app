"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
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
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  TrashIcon,
  SparklesIcon,
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

  const contrastColor = getContrastColor(primaryColor)
  const lightColor = lightenColor(primaryColor, 95)

  useEffect(() => {
    if (!isOpen) return
    loadCustomerDataByDevice()
  }, [isOpen])

  const loadCustomerDataByDevice = async () => {
    setLoading(true)
    
    try {
      const deviceId = getDeviceId()
      const customerData = await getCustomerByDeviceId(deviceId)
      
      if (customerData) {
        const devicesData = await getCustomerDevices(customerData.id)
        setCustomer(customerData)
        setDevices(devicesData)
        await updateDeviceActivity(customerData.id, deviceId)
      } else {
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

      const result = await createCustomerProfile(deviceId, fingerprint, deviceName)

      if (!result) {
        setError("Failed to create profile. Please try again.")
        setLoading(false)
        return
      }

      setCustomer(result.customer)
      setDevices([result.device])
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
      const customerData = await getCustomerByPasscode(passcodeInput)

      if (!customerData) {
        setError("Invalid passcode. Please check and try again.")
        setLoading(false)
        return
      }

      const deviceId = getDeviceId()
      const fingerprint = JSON.stringify(generateDeviceFingerprint())
      const deviceName = getDeviceName()

      const device = await linkDeviceToCustomer(customerData.id, deviceId, fingerprint, deviceName)

      if (!device) {
        setError("Failed to link device. Please try again.")
        setLoading(false)
        return
      }

      setCustomer(customerData)
      setShowLinkDevice(false)
      setPasscodeInput("")
      
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
      if (!confirm("Unlink this device? You'll need the passcode to link it again.")) {
        return
      }
    }

    setLoading(true)
    try {
      const success = await unlinkDevice(customer.id, deviceId)

      if (success) {
        if (deviceId === currentDeviceId) {
          setCustomer(null)
          setDevices([])
        } else {
          await loadCustomerDataByDevice()
        }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: lightColor }}>
              <DevicePhoneMobileIcon className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Device Sync</h2>
              <p className="text-xs text-gray-500">Manage your devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="animate-spin">
                <div
                  className="w-10 h-10 border-4 rounded-full"
                  style={{
                    borderColor: lightColor,
                    borderTopColor: primaryColor,
                  }}
                ></div>
              </div>
            </div>
          )}

          {!loading && !customer && !showLinkDevice && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: lightColor }}
              >
                <SparklesIcon className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Profile Yet</h3>
              <p className="text-sm text-gray-600 mb-6 px-4">
                Sync your orders across devices
              </p>

              <div className="flex flex-col gap-2 px-4">
                <button
                  onClick={handleCreateProfile}
                  style={{ backgroundColor: primaryColor, color: contrastColor }}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Create Profile
                </button>
                <button
                  onClick={() => setShowLinkDevice(true)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all active:scale-95"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                  }}
                >
                  I Have a Passcode
                </button>
              </div>
            </div>
          )}

          {!loading && !customer && showLinkDevice && (
            <div>
              <button
                onClick={() => {
                  setShowLinkDevice(false)
                  setError("")
                  setPasscodeInput("")
                }}
                className="text-sm text-gray-600 mb-4 hover:text-gray-900"
              >
                ← Back
              </button>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Link This Device</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter your 6-digit passcode
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
                    className="w-full px-4 py-3 rounded-xl border-2 text-center text-xl font-mono tracking-widest mb-3"
                    style={{ borderColor: error ? "#dc2626" : primaryColor }}
                    maxLength={6}
                  />

                  {error && (
                    <p className="text-xs text-red-600 mb-3">{error}</p>
                  )}

                  <button
                    onClick={handleLinkDevice}
                    disabled={loading || passcodeInput.length !== 6}
                    style={{ backgroundColor: primaryColor, color: contrastColor }}
                    className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {loading ? "Linking..." : "Link Device"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {customer && (
            <div className="space-y-4">
              {/* Passcode Display */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: lightColor,
                  borderColor: primaryColor,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Your Passcode</h3>
                  <button
                    onClick={handleRegeneratePasscode}
                    disabled={regenerating}
                    className="text-xs px-2 py-1 rounded-lg border transition-all flex items-center gap-1"
                    style={{
                      borderColor: primaryColor,
                      color: primaryColor,
                    }}
                  >
                    <ArrowPathIcon className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
                    New
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 px-4 py-3 rounded-xl text-center bg-white"
                    style={{ border: `2px solid ${primaryColor}` }}
                  >
                    <p className="text-2xl font-bold tracking-widest" style={{ color: primaryColor }}>
                      {formatPasscode(customer.sync_passcode)}
                    </p>
                  </div>
                  <button
                    onClick={copyPasscode}
                    className="p-3 rounded-xl transition-all bg-white"
                    style={{
                      border: `2px solid ${primaryColor}`,
                      backgroundColor: copied ? lightColor : "white",
                    }}
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5" style={{ color: primaryColor }} />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5" style={{ color: primaryColor }} />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  Use this code to link other devices
                </p>
              </div>

              {/* Linked Devices */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Devices ({devices.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {devices.map((device) => {
                    const isCurrentDevice = device.device_id === getDeviceId()
                    return (
                      <div
                        key={device.id}
                        className="p-3 rounded-xl border flex items-center justify-between"
                        style={{
                          backgroundColor: isCurrentDevice ? lightColor : "white",
                          borderColor: isCurrentDevice ? primaryColor : "#e5e7eb",
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="p-1.5 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: lightColor }}
                          >
                            <DevicePhoneMobileIcon className="w-4 h-4" style={{ color: primaryColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {device.device_name}
                              {isCurrentDevice && (
                                <span
                                  className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: primaryColor,
                                    color: contrastColor,
                                  }}
                                >
                                  This
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {new Date(device.last_active_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkDevice(device.device_id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Unlink"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
