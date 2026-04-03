"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Business, Waiter } from "@/types/database"
import { useTheme } from "@/contexts/ThemeContext"
import { getAvailableWaiters, submitTip, confirmTipPayment } from "@/lib/api"
import { getCustomerId } from "@/lib/device-identity"
import {
  ClipboardDocumentIcon,
  CheckIcon,
  BanknotesIcon,
  UserCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline"
import { CheckCircleIcon as CheckCircleIconSolid, StarIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"

interface TipsPageProps {
  business: Business
  orderId: string
}

const PRESET_AMOUNTS = [0, 100, 200, 500]
const COMPLIMENTS = [
  "Excellent service",
  "Very attentive",
  "Friendly & warm",
  "Fast delivery",
  "Clean & tidy",
  "Great attitude",
]

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"]

export default function TipsPage({ business, orderId }: TipsPageProps) {
  const router = useRouter()
  const { primaryColor } = useTheme()

  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [tipAmount, setTipAmount] = useState(500)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [step, setStep] = useState<"review" | "payment" | "done">("review")
  const [transferCode, setTransferCode] = useState("")
  const [tipId, setTipId] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [loadingWaiters, setLoadingWaiters] = useState(true)

  const finalAmount = showCustomInput ? parseFloat(customAmount) || 0 : tipAmount

  useEffect(() => {
    loadWaiters()
  }, [])

  const loadWaiters = async () => {
    setLoadingWaiters(true)
    const data = await getAvailableWaiters(business.id)
    setWaiters(data)
    if (data.length === 1) setSelectedWaiter(data[0])
    setLoadingWaiters(false)
  }

  const toggleCompliment = (c: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const handleProceedToPayment = async () => {
    // No tip — skip straight to done
    if (finalAmount === 0) {
      router.push(`/b/${business.slug}/orders`)
      return
    }

    if (!selectedWaiter) {
      alert("Please select a waiter to tip")
      return
    }

    setIsSubmitting(true)
    const customerId = getCustomerId() || undefined
    const result = await submitTip({
      businessId: business.id,
      orderId,
      waiterId: selectedWaiter.id,
      customerId,
      amount: finalAmount,
      rating,
      compliments: selectedCompliments,
      comment: comment.trim() || undefined,
    })

    if (result) {
      setTransferCode(result.transferCode)
      setTipId(result.tipId)
      setStep("payment")
    } else {
      alert("Failed to create tip. Please try again.")
    }
    setIsSubmitting(false)
  }

  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    const success = await confirmTipPayment(tipId)
    if (success) {
      setStep("done")
    } else {
      alert("Failed to confirm. Please try again.")
    }
    setIsConfirming(false)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (_) {}
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(n)

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircleIconSolid className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Thank you!</h1>
          <p className="text-gray-500 mb-2 text-sm">Your tip has been sent to</p>
          <p className="text-lg font-bold text-gray-900 mb-1">{selectedWaiter?.name}</p>
          <p className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
            {fmt(finalAmount)}
          </p>
          <p className="text-sm text-gray-400 mb-6">Waiters get 100% of your tip 🙏</p>
          <button
            onClick={() => router.push(`/b/${business.slug}/orders`)}
            className="w-full py-3 rounded-xl text-white font-semibold mb-3"
            style={{ backgroundColor: primaryColor }}
          >
            View My Orders
          </button>
          <button
            onClick={() => router.push(`/b/${business.slug}`)}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-8 space-y-5">
          <div className="text-center space-y-1">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <BanknotesIcon className="w-7 h-7" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Complete Tip Payment</h2>
            <p className="text-gray-500 text-sm">
              Tipping <span className="font-semibold text-gray-800">{selectedWaiter?.name}</span>
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-400 mb-1">Amount</p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {fmt(finalAmount)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Reference: {transferCode}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-center">Bank Transfer Details</h3>
            {[
              { label: "Account Number", value: business.payment_account_number || "Not set", field: "account" },
              { label: "Account Name", value: business.payment_account_name || "Not set", field: "name" },
              { label: "Bank", value: business.payment_bank || "Not set", field: "bank" },
            ].map(({ label, value, field }) => (
              <div key={field}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-1 font-semibold text-gray-900">{value}</span>
                  <button
                    onClick={() => copyToClipboard(value, field)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    {copiedField === field ? (
                      <CheckIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div>
              <p className="text-xs text-gray-500 mb-1">Transfer Remark / Reference</p>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="flex-1 font-mono text-lg font-bold text-blue-900">{transferCode}</span>
                <button
                  onClick={() => copyToClipboard(transferCode, "code")}
                  className="p-1.5 rounded-lg hover:bg-blue-200 transition-colors text-blue-600"
                >
                  {copiedField === "code" ? (
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Use this as your transfer remark so we can identify your tip
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="w-full py-4 rounded-xl text-white font-semibold text-base disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isConfirming ? "Confirming..." : "I've Made the Transfer"}
            </button>
            <button
              onClick={() => router.push(`/b/${business.slug}/orders`)}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Review & Tip (main screen) ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 pt-8 pb-10 space-y-6">

        {/* Close / Skip */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push(`/b/${business.slug}/orders`)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-lg font-bold"
          >
            ✕
          </button>
          <h1 className="text-lg font-bold text-gray-900">How was your service?</h1>
          <div className="w-8" />
        </div>

        {/* Star Rating */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                {(hoverRating || rating) >= star ? (
                  <StarIcon className="w-10 h-10 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="w-10 h-10 text-gray-300" />
                )}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-gray-600 h-5">
            {STAR_LABELS[hoverRating || rating]}
          </p>
        </div>

        {/* Waiter Card */}
        <div className="space-y-3">
          {loadingWaiters ? (
            <div className="flex justify-center py-6">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: primaryColor }}
              />
            </div>
          ) : waiters.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No waiters on duty today
            </div>
          ) : waiters.length === 1 ? (
            // Single waiter — show centered card like the ride app
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {waiters[0].profile_image_url ? (
                  <img
                    src={waiters[0].profile_image_url}
                    alt={waiters[0].name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-md">
                    <UserCircleIcon className="w-14 h-14 text-gray-400" />
                  </div>
                )}
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="font-bold text-gray-900 text-base">{waiters[0].name}</p>
            </div>
          ) : (
            // Multiple waiters — horizontal scroll picker
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2 text-center">Select your waiter</p>
              <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
                {waiters.map((waiter) => (
                  <button
                    key={waiter.id}
                    onClick={() => setSelectedWaiter(waiter)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all flex-shrink-0"
                    style={
                      selectedWaiter?.id === waiter.id
                        ? { backgroundColor: `${primaryColor}15`, outline: `2px solid ${primaryColor}` }
                        : { backgroundColor: "#f9fafb" }
                    }
                  >
                    <div className="relative">
                      {waiter.profile_image_url ? (
                        <img
                          src={waiter.profile_image_url}
                          alt={waiter.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircleIcon className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                      {selectedWaiter?.id === waiter.id && (
                        <div
                          className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <CheckIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 max-w-[60px] truncate">{waiter.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Say thanks with a tip */}
        <div className="space-y-3">
          <p className="text-center font-bold text-gray-900 text-base">Say thanks with a tip</p>
          <div className="flex gap-2 justify-center">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setShowCustomInput(false)
                  setTipAmount(amount)
                }}
                className="flex-1 py-2.5 rounded-full border-2 text-sm font-semibold transition-all"
                style={
                  !showCustomInput && tipAmount === amount
                    ? { borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}08` }
                    : { borderColor: "#e5e7eb", color: "#374151" }
                }
              >
                {amount === 0 ? "₦0" : `₦${amount.toLocaleString()}`}
              </button>
            ))}
          </div>

          {/* Custom amount toggle */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full text-center text-sm font-semibold py-1"
              style={{ color: primaryColor }}
            >
              Add custom amount
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount (₦)"
                autoFocus
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none"
                style={{ borderColor: primaryColor }}
                min="1"
              />
              <button
                onClick={() => { setShowCustomInput(false); setCustomAmount("") }}
                className="text-gray-400 text-sm px-2"
              >
                Cancel
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400">Waiters get 100% of your tip</p>
        </div>

        {/* Compliments */}
        <div className="space-y-3">
          <p className="text-center font-bold text-gray-900 text-base">Give a compliment?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {COMPLIMENTS.map((c) => (
              <button
                key={c}
                onClick={() => toggleCompliment(c)}
                className="px-4 py-2 rounded-full border text-sm font-medium transition-all"
                style={
                  selectedCompliments.includes(c)
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12`, color: primaryColor }
                    : { borderColor: "#e5e7eb", color: "#374151", backgroundColor: "white" }
                }
              >
                {c}
              </button>
            ))}

            {/* Leave a comment */}
            <button
              onClick={() => setShowCommentBox((v) => !v)}
              className="px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-all"
              style={
                showCommentBox
                  ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12`, color: primaryColor }
                  : { borderColor: "#e5e7eb", color: "#374151", backgroundColor: "white" }
              }
            >
              <PencilIcon className="w-3.5 h-3.5" />
              Leave a comment
            </button>
          </div>

          {showCommentBox && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write something nice..."
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none"
              style={{ borderColor: primaryColor }}
              maxLength={300}
            />
          )}
        </div>

        {/* Done button */}
        <button
          onClick={handleProceedToPayment}
          disabled={isSubmitting || (waiters.length > 0 && !selectedWaiter && finalAmount > 0)}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting
            ? "Processing..."
            : finalAmount === 0
            ? "Done"
            : `Done  ·  ${fmt(finalAmount)}`}
        </button>
      </div>
    </div>
  )
}
