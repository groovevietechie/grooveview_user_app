"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Business, Order } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { getOrdersByIds } from "@/lib/api"
import { getContrastColor, lightenColor, darkenColor } from "@/lib/color-utils"
import { getDeviceOrders } from "@/lib/order-storage"
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline"
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid"

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

const statusSteps = [
  { key: "new", label: "Order Received", icon: ShoppingBagIcon },
  { key: "accepted", label: "Accepted", icon: CheckCircleIcon },
  { key: "preparing", label: "Preparing", icon: SparklesIcon },
  { key: "ready", label: "Ready", icon: ClockIcon },
  { key: "served", label: "Completed", icon: TruckIcon },
]

export default function OrderTrackingPage({ business }: OrderTrackingPageProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

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
    loadOrders()
    const interval = setInterval(loadOrders, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      // Get order IDs stored on this device for this business
      const deviceOrderIds = getDeviceOrders(business.id)
      console.log("[v0] Loading orders for device:", deviceOrderIds)

      if (deviceOrderIds.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Fetch only the orders that belong to this device
      const fetchedOrders = await getOrdersByIds(deviceOrderIds)
      setOrders(fetchedOrders)
      if (fetchedOrders.length > 0 && !selectedOrder) {
        setSelectedOrder(fetchedOrders[0])
      }
    } catch (error) {
      console.error("[v0] Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return themeShades.dark
    if (status === "cancelled") return "#dc2626"
    return "#9ca3af"
  }

  const getStatusBgColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return themeShades.lighter
    if (status === "cancelled") return "#fee2e2"
    return "#f3f4f6"
  }

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  const getPaymentStatusBadge = (status: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      paid: { bg: themeShades.lightest, text: themeShades.darker },
      pending: { bg: "#fef3c7", text: "#92400e" },
      failed: { bg: "#fee2e2", text: "#991b1b" },
    }
    return colors[status] || colors.pending
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

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${themeShades.lightest} 0%, #ffffff 50%, ${themeShades.lightest} 100%)`,
      }}
    >
      <div
        className="sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm"
        style={{
          backgroundColor: `${primaryColor}15`,
          borderColor: themeShades.light,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              title="Go back"
              style={{
                color: primaryColor,
                backgroundColor: themeShades.lightest,
              }}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order Tracking</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{business.name}</p>
            </div>
          </div>
          <div
            className="inline-flex flex-col items-end px-5 py-3 rounded-2xl border-2"
            style={{
              borderColor: themeShades.medium,
              backgroundColor: themeShades.lightest,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: themeShades.dark }}>
              Active Orders
            </p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {orders.length}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center items-center py-12">
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

        {!loading && orders.length === 0 && (
          <div className="text-center py-20">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
              style={{ backgroundColor: themeShades.lightest }}
            >
              <ShoppingBagIcon className="w-12 h-12" style={{ color: themeShades.medium }} />
            </div>
            <p className="text-2xl font-bold text-gray-700 mb-2">No orders yet</p>
            <p className="text-gray-500 mb-6">Start exploring our menu to place your first order</p>
            <button
              onClick={() => router.push(`/b/${business.slug}`)}
              style={{ backgroundColor: primaryColor, color: contrastColor }}
              className="px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Browse Menu
            </button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div
                className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                style={{ borderColor: themeShades.light }}
              >
                <div
                  className="p-5 border-b"
                  style={{
                    background: `linear-gradient(135deg, ${themeShades.lightest} 0%, #ffffff 100%)`,
                    borderColor: themeShades.light,
                  }}
                >
                  <h2 className="font-bold text-gray-900 text-lg">Your Orders</h2>
                  <p className="text-xs text-gray-500 mt-1">Tap to view details</p>
                </div>
                {orders.length > 1 ? (
                  <div className="flex flex-row gap-4 overflow-x-auto pb-4">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`flex-shrink-0 min-w-[280px] text-left p-4 transition-all duration-200 rounded-lg border-2 ${
                          selectedOrder?.id === order.id ? "shadow-lg" : "hover:bg-gray-50 border-gray-200"
                        }`}
                        style={
                          selectedOrder?.id === order.id
                            ? {
                                backgroundColor: themeShades.lightest,
                                borderColor: primaryColor,
                              }
                            : {}
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900 text-sm">{order.seat_label}</p>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: getPaymentStatusBadge(order.payment_status).bg,
                              color: getPaymentStatusBadge(order.payment_status).text,
                            }}
                          >
                            {order.payment_status === "paid"
                              ? "Paid"
                              : order.payment_status === "pending"
                                ? "Pending"
                                : "Failed"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{new Date(order.created_at).toLocaleTimeString()}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            {formatCurrency(order.total_amount)}
                          </span>
                          <span
                            className="text-xs px-2 py-1 rounded font-medium capitalize"
                            style={{
                              backgroundColor: themeShades.lighter,
                              color: themeShades.darker,
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full text-left p-5 transition-all duration-200 border-b ${
                          selectedOrder?.id === order.id ? "border-l-4 shadow-inner" : "hover:bg-gray-50"
                        }`}
                        style={
                          selectedOrder?.id === order.id
                            ? {
                                backgroundColor: themeShades.lightest,
                                borderLeftColor: primaryColor,
                                borderBottomColor: themeShades.light,
                              }
                            : {
                                borderBottomColor: themeShades.lightest,
                              }
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900 text-sm">{order.seat_label}</p>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: getPaymentStatusBadge(order.payment_status).bg,
                              color: getPaymentStatusBadge(order.payment_status).text,
                            }}
                          >
                            {order.payment_status === "paid"
                              ? "Paid"
                              : order.payment_status === "pending"
                                ? "Pending"
                                : "Failed"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{new Date(order.created_at).toLocaleTimeString()}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            {formatCurrency(order.total_amount)}
                          </span>
                          <span
                            className="text-xs px-2 py-1 rounded font-medium capitalize"
                            style={{
                              backgroundColor: themeShades.lighter,
                              color: themeShades.darker,
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedOrder && (
              <div className="lg:col-span-2">
                <div
                  className="bg-white rounded-2xl shadow-lg border overflow-hidden"
                  style={{ borderColor: themeShades.light }}
                >
                  <div
                    className="p-8 border-b"
                    style={{
                      background: `linear-gradient(135deg, ${themeShades.lightest} 0%, #ffffff 50%, ${themeShades.lightest} 100%)`,
                      borderColor: themeShades.light,
                    }}
                  >
                    <h3 className="font-bold text-gray-900 text-xl mb-8">Order Progress</h3>
                    <div className="relative">
                      <div className="flex items-center justify-between relative z-10">
                        {statusSteps.map((step, index) => {
                          const isCompleted =
                            statusSteps.findIndex((s) => s.key === selectedOrder.status) >= index &&
                            selectedOrder.status !== "cancelled"
                          const isCurrent = step.key === selectedOrder.status

                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all mb-2"
                                style={{
                                  backgroundColor: isCurrent
                                    ? primaryColor
                                    : isCompleted
                                      ? themeShades.lighter
                                      : themeShades.lightest,
                                  boxShadow: isCurrent ? `0 0 0 4px ${themeShades.lighter}` : "none",
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircleIconSolid
                                    className="w-5 h-5"
                                    style={{ color: isCurrent ? contrastColor : getStatusColor(step.key, isCompleted) }}
                                  />
                                ) : (
                                  <step.icon
                                    className="w-5 h-5"
                                    style={{ color: getStatusColor(step.key, isCompleted) }}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-center text-gray-700 font-medium max-w-16">{step.label}</p>
                            </div>
                          )
                        })}
                      </div>
                      <div
                        className="absolute top-5 left-0 right-0 h-1 rounded-full -z-10"
                        style={{ backgroundColor: themeShades.lightest }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(statusSteps.findIndex((s) => s.key === selectedOrder.status) / (statusSteps.length - 1)) * 100}%`,
                            backgroundColor: primaryColor,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Order ID</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                        <p className="font-semibold text-gray-900 capitalize">{selectedOrder.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Order Time</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.seat_label}</p>
                      </div>
                    </div>

                    {(selectedOrder.estimated_ready_time || selectedOrder.estimated_delivery_time) && (
                      <div className="border-t pt-6 mb-6" style={{ borderColor: themeShades.lightest }}>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" style={{ color: primaryColor }} />
                          Estimated Times
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedOrder.estimated_ready_time && (
                            <div
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: themeShades.lightest,
                                borderColor: themeShades.light,
                              }}
                            >
                              <p className="text-xs mb-1 font-medium" style={{ color: themeShades.dark }}>
                                Ready by
                              </p>
                              <p className="text-sm font-semibold" style={{ color: themeShades.darker }}>
                                {formatTime(selectedOrder.estimated_ready_time)}
                              </p>
                              <p className="text-xs mt-1" style={{ color: primaryColor }}>
                                {getTimeRemaining(selectedOrder.estimated_ready_time)}
                              </p>
                            </div>
                          )}
                          {selectedOrder.estimated_delivery_time && (
                            <div
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: themeShades.lightest,
                                borderColor: themeShades.medium,
                              }}
                            >
                              <p className="text-xs mb-1 font-medium" style={{ color: themeShades.dark }}>
                                Delivery by
                              </p>
                              <p className="text-sm font-semibold" style={{ color: themeShades.darker }}>
                                {formatTime(selectedOrder.estimated_delivery_time)}
                              </p>
                              <p className="text-xs mt-1 font-semibold" style={{ color: primaryColor }}>
                                {getTimeRemaining(selectedOrder.estimated_delivery_time)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="border-t pt-6" style={{ borderColor: themeShades.lightest }}>
                      <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start p-3 rounded-lg"
                            style={{ backgroundColor: themeShades.lightest }}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              {item.item_note && (
                                <p className="text-sm text-gray-500 italic mt-1">Note: {item.item_note}</p>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 text-right ml-4">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Note */}
                    {selectedOrder.customer_note && (
                      <div className="border-t mt-6 pt-6" style={{ borderColor: themeShades.lightest }}>
                        <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                        <p
                          className="p-3 rounded-lg italic"
                          style={{
                            backgroundColor: themeShades.lightest,
                            color: themeShades.darker,
                          }}
                        >
                          "{selectedOrder.customer_note}"
                        </p>
                      </div>
                    )}

                    {selectedOrder.business_comment && (
                      <div className="border-t mt-6 pt-6" style={{ borderColor: themeShades.lightest }}>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4" style={{ color: primaryColor }} />
                          Message from {business.name}
                        </h4>
                        <div
                          className="p-4 rounded-lg border-l-4"
                          style={{
                            backgroundColor: themeShades.lightest,
                            borderLeftColor: primaryColor,
                          }}
                        >
                          <p className="text-gray-700 font-medium">{selectedOrder.business_comment}</p>
                        </div>
                      </div>
                    )}

                    <div
                      className="border-t mt-6 pt-6 flex justify-between items-center"
                      style={{ borderColor: themeShades.light }}
                    >
                      <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                      <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {formatCurrency(selectedOrder.total_amount)}
                      </p>
                    </div>

                    {(selectedOrder.status === "preparing" || selectedOrder.status === "ready") && (
                      <div
                        className="mt-6 p-4 rounded-lg border"
                        style={{
                          backgroundColor: themeShades.lightest,
                          borderColor: themeShades.light,
                        }}
                      >
                        <p className="text-sm" style={{ color: themeShades.darker }}>
                          Need help? Contact {business.name}
                        </p>
                        {business.phone && (
                          <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                            📞 {business.phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
