"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  LineChart,
  Printer,
  RefreshCcw,
  TrendingUp,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type CommissionOrder = {
  id: string
  shortId: string
  businessId: string
  businessName: string
  businessSlug: string | null
  seatLabel: string
  completedAt: string
  weekStart: string
  weekRange: string
  orderAmount: number
  commissionRate: number
  commissionAmount: number
}

type WeeklyCommission = {
  weekStart: string
  weekRange: string
  orderCount: number
  orderAmount: number
  commissionAmount: number
}

type CommissionReport = {
  month: string
  generatedAt: string
  summary: {
    orderCount: number
    totalOrderAmount: number
    totalCommissionAmount: number
    commissionRate: number
    averageOrderAmount: number
  }
  weekly: WeeklyCommission[]
  orders: CommissionOrder[]
}

type RawOrder = {
  id: string
  business_id: string
  seat_label?: string | null
  status: string
  total_amount: number
  created_at: string
  updated_at?: string | null
}

type BusinessLookup = Record<string, { name: string; slug?: string }>

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
})

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getMonthWindow(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  return { start, end }
}

function getWeekStart(date: Date) {
  const local = new Date(date)
  const day = local.getDay()
  const diff = day === 0 ? -6 : 1 - day
  local.setDate(local.getDate() + diff)
  local.setHours(0, 0, 0, 0)
  return local
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatWeekRange(start: Date) {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`
}

function escapeCsv(value: string | number) {
  const text = String(value)
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export default function TechTaskerSolutionsPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const [report, setReport] = useState<CommissionReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const maxWeeklyCommission = useMemo(
    () => Math.max(...(report?.weekly.map((week) => week.commissionAmount) || [0]), 1),
    [report]
  )

  const maxWeeklyOrders = useMemo(
    () => Math.max(...(report?.weekly.map((week) => week.orderCount) || [0]), 1),
    [report]
  )

  const fetchReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const { start, end } = getMonthWindow(month)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, business_id, seat_label, status, total_amount, created_at, updated_at")
        .eq("status", "served")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      const businessIds = Array.from(new Set((orders || []).map((order) => order.business_id).filter(Boolean)))
      let businessLookup: BusinessLookup = {}

      if (businessIds.length > 0) {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, slug")
          .in("id", businessIds)

        businessLookup = Object.fromEntries(
          (businesses || []).map((business) => [
            business.id,
            { name: business.name || "Unknown Business", slug: business.slug },
          ])
        )
      }

      const rows = ((orders || []) as RawOrder[]).map((order) => {
        const orderDate = new Date(order.created_at)
        const weekStart = getWeekStart(orderDate)
        const orderAmount = Number(order.total_amount || 0)
        const commissionAmount = Math.round(orderAmount * 0.01 * 100) / 100
        const business = businessLookup[order.business_id]

        return {
          id: order.id,
          shortId: order.id.slice(0, 8),
          businessId: order.business_id,
          businessName: business?.name || "Unknown Business",
          businessSlug: business?.slug || null,
          seatLabel: order.seat_label || "Not specified",
          completedAt: orderDate.toISOString(),
          weekStart: toDateKey(weekStart),
          weekRange: formatWeekRange(weekStart),
          orderAmount,
          commissionRate: 0.01,
          commissionAmount,
        }
      })

      const weeklyMap = new Map<string, WeeklyCommission>()

      for (const row of rows) {
        const current = weeklyMap.get(row.weekStart) || {
          weekStart: row.weekStart,
          weekRange: row.weekRange,
          orderCount: 0,
          orderAmount: 0,
          commissionAmount: 0,
        }

        current.orderCount += 1
        current.orderAmount += row.orderAmount
        current.commissionAmount += row.commissionAmount
        weeklyMap.set(row.weekStart, current)
      }

      const weekly = Array.from(weeklyMap.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((week) => ({
          ...week,
          orderAmount: Math.round(week.orderAmount * 100) / 100,
          commissionAmount: Math.round(week.commissionAmount * 100) / 100,
        }))

      const totalOrderAmount = rows.reduce((sum, row) => sum + row.orderAmount, 0)
      const totalCommissionAmount = rows.reduce((sum, row) => sum + row.commissionAmount, 0)

      setReport({
        month,
        generatedAt: new Date().toISOString(),
        summary: {
          orderCount: rows.length,
          totalOrderAmount: Math.round(totalOrderAmount * 100) / 100,
          totalCommissionAmount: Math.round(totalCommissionAmount * 100) / 100,
          commissionRate: 0.01,
          averageOrderAmount: rows.length ? Math.round((totalOrderAmount / rows.length) * 100) / 100 : 0,
        },
        weekly,
        orders: rows,
      })
    } catch (fetchError) {
      console.error("[TechTaskerSolutions] Report load failed:", fetchError)
      setError("The commission report could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const exportCsv = () => {
    if (!report) return

    const headers = [
      "Order ID",
      "Business",
      "Seat",
      "Completed Date",
      "Week",
      "Order Amount",
      "Commission Rate",
      "Commission Amount",
    ]

    const rows = report.orders.map((order) => [
      order.id,
      order.businessName,
      order.seatLabel,
      formatDate(order.completedAt),
      order.weekRange,
      order.orderAmount.toFixed(2),
      "1%",
      order.commissionAmount.toFixed(2),
    ])

    const summaryRows = [
      [],
      ["Monthly Summary"],
      ["Completed Orders", report.summary.orderCount],
      ["Total Order Amount", report.summary.totalOrderAmount.toFixed(2)],
      ["TechTasker Commission", report.summary.totalCommissionAmount.toFixed(2)],
      ["Average Order Amount", report.summary.averageOrderAmount.toFixed(2)],
    ]

    const csv = [headers, ...rows, ...summaryRows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `techtasker-commission-${report.month}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="print:hidden border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">TechTasker Solutions</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Commission Intelligence</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <button
              type="button"
              onClick={fetchReport}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!report || report.orders.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={printReport}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-8 print:px-0 print:py-0">
        <div className="mb-8 overflow-hidden rounded-lg bg-slate-950 text-white shadow-xl print:rounded-none print:bg-white print:text-slate-950 print:shadow-none">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8 print:p-0">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 print:border-slate-300 print:bg-white print:text-slate-700">
                <FileSpreadsheet className="h-4 w-4" />
                Monthly Commission Report
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl print:text-2xl">
                Completed order commission ledger
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 print:text-slate-700">
                Each served customer order contributes 1% of its order amount to TechTasker Solutions. This page groups the commission by week and keeps every order visible for monthly review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryTile label="Completed Orders" value={report?.summary.orderCount.toLocaleString() || "0"} />
              <SummaryTile label="Commission Rate" value="1%" />
              <SummaryTile label="Order Volume" value={formatCurrency(report?.summary.totalOrderAmount || 0)} />
              <SummaryTile label="Commission Due" value={formatCurrency(report?.summary.totalCommissionAmount || 0)} highlight />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] print:block">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm print:border-none print:p-0 print:shadow-none">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Weekly Commission Chart</h3>
                <p className="text-sm text-slate-500">{report?.month || month}</p>
              </div>
              <LineChart className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="space-y-5">
              {loading ? (
                <SkeletonRows />
              ) : report && report.weekly.length > 0 ? (
                report.weekly.map((week) => (
                  <div key={week.weekStart}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-700">{week.weekRange}</span>
                      <span className="font-bold text-slate-950">{formatCurrency(week.commissionAmount)}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
                          style={{ width: `${Math.max(8, (week.commissionAmount / maxWeeklyCommission) * 100)}%` }}
                        />
                      </div>
                      <span className="w-20 text-right text-xs font-medium text-slate-500">
                        {week.orderCount} orders
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm print:mt-6 print:border-none print:p-0 print:shadow-none">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Order Mix</h3>
                <p className="text-sm text-slate-500">Weekly order count and value</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>

            <div className="grid min-h-64 grid-cols-4 items-end gap-3 border-b border-l border-slate-200 px-3 pb-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-t-md bg-slate-100" />
                ))
              ) : report && report.weekly.length > 0 ? (
                report.weekly.map((week) => (
                  <div key={week.weekStart} className="flex h-60 flex-col justify-end gap-2">
                    <div
                      className="min-h-6 rounded-t-md bg-slate-900"
                      style={{ height: `${Math.max(12, (week.orderCount / maxWeeklyOrders) * 100)}%` }}
                      title={`${week.orderCount} orders`}
                    />
                    <p className="truncate text-center text-[11px] font-medium text-slate-500">{week.weekRange}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-4">
                  <EmptyState />
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm print:border-none print:shadow-none">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between print:px-0">
            <div>
              <h3 className="text-lg font-bold">Individual Completed Orders</h3>
              <p className="text-sm text-slate-500">All served orders included in the 1% monthly commission calculation</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              {formatCurrency(report?.summary.totalCommissionAmount || 0)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 print:bg-white">
                <tr>
                  <th className="px-5 py-3 font-bold">Order</th>
                  <th className="px-5 py-3 font-bold">Business</th>
                  <th className="px-5 py-3 font-bold">Seat</th>
                  <th className="px-5 py-3 font-bold">Completed</th>
                  <th className="px-5 py-3 font-bold">Week</th>
                  <th className="px-5 py-3 text-right font-bold">Amount</th>
                  <th className="px-5 py-3 text-right font-bold">1% Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : report && report.orders.length > 0 ? (
                  report.orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50 print:hover:bg-white">
                      <td className="px-5 py-4 font-semibold text-slate-950">{order.shortId}</td>
                      <td className="px-5 py-4 text-slate-700">{order.businessName}</td>
                      <td className="px-5 py-4 text-slate-700">{order.seatLabel}</td>
                      <td className="px-5 py-4 text-slate-700">{formatDate(order.completedAt)}</td>
                      <td className="px-5 py-4 text-slate-700">{order.weekRange}</td>
                      <td className="px-5 py-4 text-right font-semibold">{formatCurrency(order.orderAmount)}</td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-700">
                        {formatCurrency(order.commissionAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10">
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

function SummaryTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-emerald-300 bg-emerald-400 text-slate-950" : "border-white/15 bg-white/10 print:border-slate-200 print:bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-emerald-950" : "text-slate-300 print:text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-bold md:text-2xl">{value}</p>
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center print:bg-white">
      <p className="font-semibold text-slate-700">No completed orders found for this month.</p>
      <p className="mt-1 text-sm text-slate-500">Served orders will appear here once available.</p>
    </div>
  )
}
