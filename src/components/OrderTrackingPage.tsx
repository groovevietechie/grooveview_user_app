"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Business, Order } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { getOrdersByIds } from "@/lib/api"
import { getContrastColor, lightenColor, darkenColor } from "@/lib/color-utils"
import { getDeviceOrders } from "@/lib/order-storage"
import { getCustomerId } from "@/lib/device-identity"
import { getCustomerOrders, awardTokensForOrder } from "@/lib/customer-api"
import { useBackNavigation } from "@/hooks/useBackNavigation"
import { useCustomerProfile } from "@/hooks/useCustomerProfile"
import BackButton from "@/components/BackButton"
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  SparklesIcon,
  ShoppingBagIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  GiftIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  FireIcon,
  StarIcon,
} from "@heroicons/react/24/outline"
import { CheckCircleIcon as CheckCircleIconSolid, SparklesIcon as SparklesIconSolid } from "@heroicons/react/24/solid"

interface OrderTrackingPageProps {
  business: Business
}

interface OrderWithItems extends Order {
  items?: Array<{
    id: string
    name: string
    quantity: number
    unit_price: number
    item_note?: string
  }>
}

const TOKEN_NOTE_PATTERN = /\[reward_tokens_used:(\d+(?:\.\d+)?)\]/i
const CUSTOMER_PROFILE_NOTE_PATTERN = /\[customer_profile_id:[^\]]+\]/i
const TOKEN_REDEEMED_NOTE_PATTERN = /\[reward_tokens_redeemed\]/i

const statusSteps = [
  { key: "new", label: "Order Received", icon: ShoppingBagIcon, color: "#3b82f6" },
  { key: "accepted", label: "Accepted", icon: CheckCircleIcon, color: "#10b981" },
  { key: "preparing", label: "Preparing", icon: SparklesIcon, color: "#f59e0b" },
  { key: "ready", label: "Ready", icon: ClockIcon, color: "#8b5cf6" },
  { key: "served", label: "Completed", icon: TruckIcon, color: "#06b6d4" },
]

export default function OrderTrackingPage({ business }: OrderTrackingPageProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState<{ orderId: string; amount: number } | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  
  const CLAIMED_KEY = `claimed_orders_${business.id}`
  const claimedOrderIds = useRef<Set<string>>(new Set())
  const { refreshCustomerData } = useCustomerProfile()

  useBackNavigation({
    fallbackRoute: `/b/${business.slug}`
  })

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLAIMED_KEY)
      if (stored) {
        claimedOrderIds.current = new Set(JSON.parse(stored))
      }
    } catch (_) {}

    setCustomerId(getCustomerId())
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder({
          ...updatedOrder,
          tokens_awarded: selectedOrder.tokens_awarded || updatedOrder.tokens_awarded,
        })
      }
    }
  }, [orders])

  const loadOrders = async () => {
    try {
      const customerId = getCustomerId()

      if (customerId) {
        const customerOrders = await getCustomerOrders(customerId, business.id)
        let deviceOnlyOrders: OrderWithItems[] = []
        const deviceOrderIds = getDeviceOrders(business.id)
        if (deviceOrderIds.length > 0) {
          const fetched = await getOrdersByIds(deviceOrderIds)
          const customerOrderIds = new Set(customerOrders.map(o => o.id))
          deviceOnlyOrders = fetched.filter(o => !customerOrderIds.has(o.id))
        }

        setOrders(prev => {
          const merged = [...customerOrders, ...deviceOnlyOrders].map(o =>
            claimedOrderIds.current.has(o.id) ? { ...o, tokens_awarded: true } : o
          )
          return merged
        })
      } else {
        const deviceOrderIds = getDeviceOrders(business.id)
        if (deviceOrderIds.length === 0) {
          setOrders([])
          setLoading(false)
          return
        }
        const fetchedOrders = await getOrdersByIds(deviceOrderIds)
        setOrders(fetchedOrders.map(o =>
          claimedOrderIds.current.has(o.id) ? { ...o, tokens_awarded: true } : o
        ))
      }
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimTokens = async (order: OrderWithItems) => {
    const cid = customerId || getCustomerId()
    if (!cid) {
      alert("Please create a profile in Device Sync to earn and claim reward tokens.")
      return
    }

    setClaiming(true)
    try {
      const result = await awardTokensForOrder(cid, order.id, order.total_amount)
      if (result.success) {
        const awarded = result.tokensAwarded ?? Math.round(order.total_amount * 0.02 * 100) / 100
        claimedOrderIds.current.add(order.id)
        try {
          localStorage.setItem(CLAIMED_KEY, JSON.stringify([...claimedOrderIds.current]))
        } catch (_) {}
        setClaimSuccess({ orderId: order.id, amount: awarded })
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, tokens_awarded: true } : o))
        setSelectedOrder(prev => prev ? { ...prev, tokens_awarded: true } : prev)
        await refreshCustomerData()
        setTimeout(() => {
          const waiterParam = order.waiter_id ? `&waiterId=${order.waiter_id}` : ""
          router.push(`/b/${business.slug}/tips?orderId=${order.id}${waiterParam}`)
        }, 1200)
      } else {
        alert("Failed to claim tokens. Please try again.")
      }
    } catch (err) {
      console.error("Claim tokens error:", err)
      alert("An error occurred. Please try again.")
    } finally {
      setClaiming(false)
    }
  }

  const getStatusColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return themeShades.dark
    if (status === "cancelled") return "#dc2626"
    return "#9ca3af"
  }

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`
  
  const getTokenAmountFromNote = (note?: string) => {
    const match = note?.match(TOKEN_NOTE_PATTERN)
    return match ? Number(match[1]) || 0 : 0
  }
  
  const getCleanCustomerNote = (note?: string) =>
    note
      ?.replace(TOKEN_NOTE_PATTERN, "")
      .replace(CUSTOMER_PROFILE_NOTE_PATTERN, "")
      .replace(TOKEN_REDEEMED_NOTE_PATTERN, "")
      .trim()
  
  const getTokenAmount = (order: OrderWithItems) => Math.max(0, order.token_payment_amount || getTokenAmountFromNote(order.customer_note))
  const getAmountDue = (order: OrderWithItems) => Math.max(0, order.total_amount - getTokenAmount(order))
  
  const getPaymentMethodDisplay = (order: OrderWithItems) => {
    const tokenAmount = getTokenAmount(order)
    const baseMethod = order.payment_method === "transfer"
      ? "Bank Transfer"
      : order.payment_method === "cash"
        ? "Cash / POS"
        : order.payment_method

    if (tokenAmount <= 0) return baseMethod
    if (getAmountDue(order) <= 0) return "Reward Tokens"
    return `${baseMethod} + Reward Tokens`
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleString()
  }

  const getTimeRemaining = (estimatedTime?: string) => {
    if (!estimatedTime) return null
    const now = new Date()
    const estimated = new Date(estimatedTime)
    const diffMs = estimated.getTime() - now.getTime()

    if (diffMs <= 0) return "Ready now!"

    const diffMins = Math.round(diffMs / 60000)
    if (diffMins < 1) return "< 1 min"
    if (diffMins < 60) return `${diffMins} min`

    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const getProgressPercentage = (status: string) => {
    const stepIndex = statusSteps.findIndex(s => s.key === status)
    return stepIndex >= 0 ? ((stepIndex + 1) / statusSteps.length) * 100 : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-amber-400 animate-spin"></div>
          <p className="text-amber-200/70 text-sm">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl border-b border-amber-400/10 bg-gradient-to-r from-slate-950/80 to-blue-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BackButton 
                fallbackRoute={`/b/${business.slug}`}
                className="p-3 rounded-xl transition-all duration-200 hover:bg-slate-800/50 text-amber-400"
                label=""
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Order Tracking</h1>
                <p className="text-sm text-amber-200/60 mt-1">{business.name}</p>
              </div>
            </div>
            
            {/* Active Orders Badge */}
            <div className="flex flex-col items-center px-6 py-4 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200/70 mb-1">Active</p>
              <p className="text-4xl font-black text-amber-400">{orders.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30">
              <ShoppingBagIcon className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-3">No orders yet</p>
            <p className="text-amber-200/60 mb-8">Start exploring our menu to place your first order</p>
            <button
              onClick={() => router.push(`/b/${business.slug}`)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:shadow-amber-500/50"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
            {/* Orders List - Fixed Height with Scroll */}
            <div className="xl:col-span-1 flex flex-col min-h-0">
              <div className="space-y-3 overflow-y-auto flex-1">
                {orders.map((order, idx) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 transform flex-shrink-0 ${
                      selectedOrder?.id === order.id
                        ? 'border-amber-400 bg-gradient-to-br from-amber-400/20 to-amber-600/10 shadow-xl shadow-amber-400/20 scale-105'
                        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-amber-400">
                        Table {order.seat_label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                        order.status === 'served' ? 'bg-cyan-500/20 text-cyan-300' :
                        order.status === 'ready' ? 'bg-purple-500/20 text-purple-300' :
                        order.status === 'preparing' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{new Date(order.created_at).toLocaleTimeString()}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{formatCurrency(getAmountDue(order))}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="h-1.5 w-12 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(order.status)}%` }}
                          />
                        </div>
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${selectedOrder?.id === order.id ? 'text-amber-400 translate-x-1' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Details */}
            {selectedOrder ? (
              <div className="xl:col-span-3">
                <div className="space-y-6">
                  {/* Progress Timeline */}
                  <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                    <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                      <FireIcon className="w-5 h-5 text-amber-400" />
                      Order Progress
                    </h2>
                    
                    <div className="relative mb-8">
                      {/* Timeline */}
                      <div className="flex items-center justify-between relative z-10 mb-6">
                        {statusSteps.map((step, index) => {
                          const isCompleted = statusSteps.findIndex(s => s.key === selectedOrder.status) >= index && selectedOrder.status !== "cancelled"
                          const isCurrent = step.key === selectedOrder.status

                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 mb-3 border-2 ${
                                isCurrent 
                                  ? 'border-amber-400 bg-gradient-to-br from-amber-400/30 to-amber-600/20 scale-110 shadow-lg shadow-amber-400/20' 
                                  : isCompleted
                                  ? 'border-emerald-400 bg-emerald-500/10'
                                  : 'border-slate-600 bg-slate-800/50'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircleIconSolid className="w-6 h-6 text-emerald-400" />
                                ) : (
                                  <step.icon className={`w-6 h-6 ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`} />
                                )}
                              </div>
                              <p className="text-xs font-semibold text-center text-slate-300 max-w-20">{step.label}</p>
                            </div>
                          )
                        })}
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700 rounded-full -z-10">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${getProgressPercentage(selectedOrder.status)}%` }}
                        />
                      </div>
                    </div>

                    {/* Time Estimates */}
                    {(selectedOrder.estimated_ready_time || selectedOrder.estimated_delivery_time) && (
                      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-700/30">
                        {selectedOrder.estimated_ready_time && (
                          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-2">Ready by</p>
                            <p className="text-lg font-bold text-white">{formatTime(selectedOrder.estimated_ready_time)}</p>
                            <p className="text-xs text-amber-400 font-semibold mt-2">{getTimeRemaining(selectedOrder.estimated_ready_time)}</p>
                          </div>
                        )}
                        {selectedOrder.estimated_delivery_time && (
                          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-2">Delivery by</p>
                            <p className="text-lg font-bold text-white">{formatTime(selectedOrder.estimated_delivery_time)}</p>
                            <p className="text-xs text-amber-400 font-semibold mt-2">{getTimeRemaining(selectedOrder.estimated_delivery_time)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <ShoppingBagIcon className="w-5 h-5 text-amber-400" />
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.id} className="group">
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="w-full text-left p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700/50 transition-all duration-200 hover:border-amber-400/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="text-sm text-slate-400 mt-1">Qty: {item.quantity}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold text-amber-400">{formatCurrency(item.unit_price * item.quantity)}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(item.unit_price)} each</p>
                              </div>
                            </div>
                            {item.item_note && (
                              <p className="text-xs text-slate-400 italic mt-2">Note: {item.item_note}</p>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <DocumentDuplicateIcon className="w-5 h-5 text-amber-400" />
                        <p className="text-xs text-slate-400">Order ID</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-white break-all">{selectedOrder.id}</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCardIcon className="w-5 h-5 text-amber-400" />
                        <p className="text-xs text-slate-400">Payment Method</p>
                      </div>
                      <p className="font-semibold text-white">{getPaymentMethodDisplay(selectedOrder)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CalendarIcon className="w-5 h-5 text-amber-400" />
                        <p className="text-xs text-slate-400">Order Time</p>
                      </div>
                      <p className="font-semibold text-white">{formatTime(selectedOrder.created_at)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <MapPinIcon className="w-5 h-5 text-amber-400" />
                        <p className="text-xs text-slate-400">Location</p>
                      </div>
                      <p className="font-semibold text-white">Table {selectedOrder.seat_label}</p>
                    </div>
                  </div>

                  {/* Totals Section */}
                  <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-700/30">
                        <p className="text-slate-300">Subtotal</p>
                        <p className="font-semibold text-white">{formatCurrency(selectedOrder.total_amount)}</p>
                      </div>

                      {getTokenAmount(selectedOrder) > 0 && (
                        <div className="flex justify-between items-center pb-4 border-b border-slate-700/30 bg-blue-900/20 -mx-8 px-8 py-4 rounded-lg">
                          <p className="text-slate-300">Reward Tokens Used</p>
                          <p className="font-semibold text-blue-400">-{formatCurrency(getTokenAmount(selectedOrder))}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-lg font-bold text-white">Total</p>
                        <p className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                          {formatCurrency(getAmountDue(selectedOrder))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Claim Tokens Button */}
                  {selectedOrder.status === "served" && !selectedOrder.tokens_awarded && (
                    <button
                      onClick={() => handleClaimTokens(selectedOrder)}
                      disabled={claiming}
                      className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:shadow-amber-500/50"
                    >
                      <GiftIcon className="w-6 h-6" />
                      {claiming
                        ? 'Claiming Tokens...'
                        : `Claim ₦${(Math.round(selectedOrder.total_amount * 0.02 * 100) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Reward Tokens`}
                    </button>
                  )}

                  {claimSuccess?.orderId === selectedOrder.id && (
                    <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-400/30 rounded-2xl p-6 flex items-center gap-4">
                      <CheckCircleIconSolid className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-300">Tokens Claimed!</p>
                        <p className="text-sm text-emerald-200">₦{claimSuccess.amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added to your balance</p>
                      </div>
                    </div>
                  )}

                  {/* Help Section */}
                  {(selectedOrder.status === "preparing" || selectedOrder.status === "ready") && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/10 border border-blue-400/30 rounded-2xl p-6 flex items-start gap-4">
                      <PhoneIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-blue-300 mb-1">Need help?</p>
                        <p className="text-sm text-blue-200">Contact {business.name}</p>
                        {business.phone && <p className="text-blue-400 font-semibold mt-2">📞 {business.phone}</p>}
                      </div>
                    </div>
                  )}

                  {/* Business Comment */}
                  {selectedOrder.business_comment && (
                    <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <ChatBubbleLeftIcon className="w-5 h-5 text-amber-400" />
                        Message from {business.name}
                      </h4>
                      <p className="text-slate-300 leading-relaxed">{selectedOrder.business_comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="xl:col-span-3 flex items-center justify-center">
                <div className="text-center">
                  <SparklesIconSolid className="w-16 h-16 text-amber-400/40 mx-auto mb-4" />
                  <p className="text-lg text-slate-400">Select an order to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
