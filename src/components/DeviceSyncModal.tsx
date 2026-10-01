"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
import {
  getDeviceId,
  getDeviceName,
  generateDeviceFingerprint,
  setCustomerId,
  clearCustomerId,
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
  updateCustomerProfile,
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
  CurrencyDollarIcon,
  UserCircleIcon,
  PencilIcon,
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
  onDataChange,
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

  // Profile fields for creation / editing
  const [profileForm, setProfileForm] = useState({ full_name: "", address: "", profile_picture_url: "" })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasSeenRewardTokens, setHasSeenRewardTokens] = useState(true)

  const contrastColor = getContrastColor(primaryColor)
  const lightColor = lightenColor(primaryColor, 95)

  useEffect(() => {
    if (!isOpen) return
    loadCustomerDataByDevice()
  }, [isOpen])

  const handleRewardClaimed = () => {
    setHasSeenRewardTokens(false)
  }

  useEffect(() => {
    window.addEventListener('rewardTokenClaimed', handleRewardClaimed)
    return () => {
      window.removeEventListener('rewardTokenClaimed', handleRewardClaimed)
    }
  }, [])

  const loadCustomerDataByDevice = async () => {
    setLoading(true)
    try {
      const deviceId = getDeviceId()
      const customerData = await getCustomerByDeviceId(deviceId)
      if (customerData) {
        setCustomerId(customerData.id) // persist so other pages can read it
        await fetch(`/api/customers/${customerData.id}/reconcile-token-orders`, { method: "POST" })
        const refreshedCustomer = await fetch(`/api/customers/${customerData.id}`).then(res => res.ok ? res.json() : customerData)
        const devicesData = await getCustomerDevices(customerData.id)
        setCustomer(refreshedCustomer)
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

      // Save optional profile fields if provided
      let finalCustomer = result.customer
      const hasExtras = profileForm.full_name || profileForm.address || profileForm.profile_picture_url
      if (hasExtras) {
        const updated = await updateCustomerProfile(result.customer.id, {
          full_name: profileForm.full_name || undefined,
          address: profileForm.address || undefined,
          profile_picture_url: profileForm.profile_picture_url || undefined,
        })
        if (updated) finalCustomer = updated
      }

      setCustomer(finalCustomer)
      setDevices([result.device])
      setCustomerId(finalCustomer.id) // persist for other pages
      onDataChange?.()
    } catch (err) {
      console.error("[DeviceSync] Error creating profile:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!customer) return
    setSavingProfile(true)
    setError("")
    try {
      const updated = await updateCustomerProfile(customer.id, {
        full_name: profileForm.full_name || undefined,
        address: profileForm.address || undefined,
        profile_picture_url: profileForm.profile_picture_url || undefined,
      })
      if (updated) {
        setCustomer(updated)
        setShowEditProfile(false)
        onDataChange?.()
      } else {
        setError("Failed to save profile. Please try again.")
      }
    } catch (err) {
      console.error("[DeviceSync] Error saving profile:", err)
      setError("An error occurred.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setProfileForm((f) => ({ ...f, profile_picture_url: dataUrl }))
    }
    reader.readAsDataURL(file)
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
      setCustomerId(customerData.id) // persist for other pages
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
      if (!confirm("Unlink this device? You'll need the passcode to link it again.")) return
    }
    setLoading(true)
    try {
      const success = await unlinkDevice(customer.id, deviceId)
      if (success) {
        if (deviceId === currentDeviceId) {
          clearCustomerId() // remove from localStorage/cookie
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
    if (!confirm("Generate a new passcode? Your old passcode will no longer work.")) return
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

  const handleCloseModal = () => {
    // Mark tokens as seen when closing modal
    setHasSeenRewardTokens(true)
    // Dispatch event to clear notification dot from header
    window.dispatchEvent(new CustomEvent('closeDeviceSync'))
    onClose()
  }

  const copyPasscode = () => {
    if (!customer) return
    navigator.clipboard.writeText(customer.sync_passcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatPasscode = (passcode: string) => `${passcode.slice(0, 3)} ${passcode.slice(3)}`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-blue-900/50 relative">
        {/* Futuristic gradient accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-black/95 backdrop-blur-md border-b border-amber-400/20 p-4 flex items-center justify-between rounded-t-3xl relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-400/10 border border-amber-400/30">
              <DevicePhoneMobileIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-50">Device Sync</h2>
              <p className="text-xs text-amber-200/70">Manage your devices</p>
            </div>
          </div>
          <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-200/70 hover:text-amber-300">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 relative z-10">
          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="animate-spin">
                <div className="w-10 h-10 border-4 rounded-full border-amber-400/30 border-t-amber-400"></div>
              </div>
            </div>
          )}

          {/* No profile — create form */}
          {!loading && !customer && !showLinkDevice && (
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-amber-400/20 to-amber-400/10 border border-amber-400/30">
                  <SparklesIcon className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-amber-50 mb-1">No Profile Yet</h3>
                <p className="text-sm text-amber-200/70">Sync your orders across devices</p>
              </div>

              {/* Optional profile fields */}
              <div className="space-y-3 mb-5">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all hover:opacity-80 bg-gradient-to-br from-slate-800 to-blue-950"
                    style={{ borderColor: '#fbbf24' }}
                  >
                    {profileForm.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileForm.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 text-amber-400/40" />
                    )}
                  </button>
                  <p className="text-xs text-amber-200/70">Tap to add photo (optional)</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                </div>

                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Full name (optional)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-amber-400/20 bg-slate-800/50 text-amber-50 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-slate-800/80 transition-all placeholder:text-amber-200/30"
                />
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Address (optional)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-amber-400/20 bg-slate-800/50 text-amber-50 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-slate-800/80 transition-all placeholder:text-amber-200/30"
                />
              </div>

              {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreateProfile}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400"
                >
                  Create Profile
                </button>
                <button
                  onClick={() => setShowLinkDevice(true)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-sm border-2 border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all active:scale-95"
                >
                  I Have a Passcode
                </button>
              </div>
            </div>
          )}

          {/* Link device with passcode */}
          {!loading && !customer && showLinkDevice && (
            <div>
              <button
                onClick={() => { setShowLinkDevice(false); setError(""); setPasscodeInput("") }}
                className="text-sm text-amber-400/70 mb-4 hover:text-amber-400 transition-colors"
              >
                ← Back
              </button>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-amber-50 mb-1">Link This Device</h3>
                  <p className="text-xs text-amber-200/70 mb-3">Enter your 6-digit passcode</p>
                  <input
                    type="text"
                    value={passcodeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setPasscodeInput(value)
                      setError("")
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl border-2 text-center text-2xl font-mono tracking-widest mb-3 bg-slate-800/50 text-amber-400 focus:outline-none focus:bg-slate-800/80"
                    style={{ borderColor: error ? "#f87171" : '#fbbf24' }}
                    maxLength={6}
                  />
                  {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
                  <button
                    onClick={handleLinkDevice}
                    disabled={loading || passcodeInput.length !== 6}
                    className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400"
                  >
                    {loading ? "Linking..." : "Link Device"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Existing customer view */}
          {customer && (
            <div className="space-y-4">
              {/* Edit Profile Panel */}
              {showEditProfile ? (
                <div className="space-y-3">
                  <button
                    onClick={() => { setShowEditProfile(false); setError("") }}
                    className="text-sm text-amber-400/70 hover:text-amber-400 transition-colors"
                  >
                    ← Back
                  </button>
                  <h3 className="font-bold text-amber-50">Edit Profile</h3>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden hover:opacity-80 transition-all bg-gradient-to-br from-slate-800 to-blue-950"
                      style={{ borderColor: '#fbbf24' }}
                    >
                      {profileForm.profile_picture_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileForm.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircleIcon className="w-10 h-10 text-amber-400/40" />
                      )}
                    </button>
                    <p className="text-xs text-amber-200/70">Tap to change photo</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                  </div>

                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-400/20 bg-slate-800/50 text-amber-50 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-slate-800/80 transition-all placeholder:text-amber-200/30"
                  />
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-400/20 bg-slate-800/50 text-amber-50 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-slate-800/80 transition-all placeholder:text-amber-200/30"
                  />

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full px-4 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all disabled:opacity-50 active:scale-95 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Profile Info Card */}
                  <div className="p-4 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2 border-amber-400/50">
                        {customer.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={customer.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-blue-900">
                            <UserCircleIcon className="w-8 h-8 text-amber-400/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-50 text-sm truncate">
                          {customer.full_name || "No name set"}
                        </p>
                        <p className="text-xs text-amber-200/70 truncate">
                          {customer.address || "No address set"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileForm({
                            full_name: customer.full_name || "",
                            address: customer.address || "",
                            profile_picture_url: customer.profile_picture_url || "",
                          })
                          setShowEditProfile(true)
                        }}
                        className="p-2 rounded-lg hover:bg-amber-400/10 transition-colors flex-shrink-0 text-amber-400 hover:text-amber-300"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reward Tokens */}
                  <div className="p-4 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-400/10 border border-amber-400/30">
                          <CurrencyDollarIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="font-bold text-amber-50 text-sm">Reward Tokens</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={loadCustomerDataByDevice}
                          className="p-1 rounded-lg hover:bg-amber-400/10 transition-colors text-amber-400"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <p className="text-2xl font-bold text-amber-400">
                          ₦{(customer.reward_tokens || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 border border-amber-400/10">
                      <p className="text-xs text-amber-200/80">💰 Earn 2% tokens on every completed order across all your devices</p>
                      <p className="text-xs text-amber-200/80 mt-1">🎁 Use tokens to pay for your orders (1 token = ₦1)</p>
                    </div>
                  </div>

                  {/* Passcode */}
                  <div className="p-4 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-amber-50 text-sm">Your Passcode</h3>
                      <button
                        onClick={handleRegeneratePasscode}
                        disabled={regenerating}
                        className="text-xs px-2 py-1 rounded-lg border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all flex items-center gap-1"
                      >
                        <ArrowPathIcon className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
                        New
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 rounded-xl text-center bg-slate-700/30 border-2 border-amber-400/40">
                        <p className="text-2xl font-bold tracking-widest text-amber-400">
                          {formatPasscode(customer.sync_passcode)}
                        </p>
                      </div>
                      <button
                        onClick={copyPasscode}
                        className="p-3 rounded-xl transition-all border-2 border-amber-400/40 hover:bg-amber-400/10 text-amber-400"
                      >
                        {copied ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-amber-200/70 mt-2">Use this code to link other devices</p>
                  </div>

                  {/* Linked Devices */}
                  <div>
                    <h3 className="font-bold text-amber-50 mb-2 text-sm">Devices ({devices.length})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {devices.map((device) => {
                        const isCurrentDevice = device.device_id === getDeviceId()
                        return (
                          <div
                            key={device.id}
                            className="p-3 rounded-xl border flex items-center justify-between transition-all"
                            style={{
                              backgroundColor: isCurrentDevice ? 'rgba(251, 191, 36, 0.08)' : 'rgba(30, 58, 138, 0.15)',
                              borderColor: isCurrentDevice ? '#fbbf24' : '#1e3a8a',
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="p-1.5 rounded-lg flex-shrink-0 bg-gradient-to-br from-amber-400/20 to-amber-400/10 border border-amber-400/30">
                                <DevicePhoneMobileIcon className="w-4 h-4 text-amber-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-amber-50 text-sm truncate">
                                  {device.device_name}
                                  {isCurrentDevice && (
                                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold">
                                      This
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-amber-200/70 truncate">
                                  {new Date(device.last_active_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlinkDevice(device.device_id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex-shrink-0 text-red-400 hover:text-red-300"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/30">
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
