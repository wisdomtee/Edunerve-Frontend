"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Receipt,
  Search,
  Wallet,
  XCircle,
} from "lucide-react"
import { getSelectedChild } from "@/lib/parent"
import { API_BASE_URL, getAuthHeaders } from "@/lib/auth"

type FeeItem = {
  id: number
  studentId?: number
  schoolId?: number
  term: string
  session: string
  totalAmount: number
  amountPaid: number
  balance: number
  status: "PAID" | "PARTIAL" | "UNPAID"
  dueDate: string
  createdAt?: string
  updatedAt?: string
}

export default function ParentFeesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [fees, setFees] = useState<FeeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedChild = getSelectedChild()

  useEffect(() => {
    const loadFees = async () => {
      if (!selectedChild?.id) {
        setFees([])
        return
      }

      try {
        setLoading(true)
        setError("")

        const res = await fetch(`${API_BASE_URL}/fees/${selectedChild.id}`, {
          headers: getAuthHeaders(),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch fees")
        }

        const normalized: FeeItem[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id,
              studentId: item.studentId,
              schoolId: item.schoolId,
              term: item.term || "",
              session: item.session || "",
              totalAmount: Number(item.totalAmount || 0),
              amountPaid: Number(item.amountPaid || 0),
              balance: Number(item.balance || 0),
              status: item.status || "UNPAID",
              dueDate: item.dueDate,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }))
          : []

        setFees(normalized)
      } catch (err: any) {
        console.error("LOAD FEES ERROR:", err)
        setError(err.message || "Failed to load fees")
        setFees([])
      } finally {
        setLoading(false)
      }
    }

    loadFees()
  }, [selectedChild?.id])

  const filteredFees = useMemo(() => {
    return fees.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(search.toLowerCase()) ||
        item.session.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [fees, search, statusFilter])

  const totals = useMemo(() => {
    const totalBilled = fees.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalPaid = fees.reduce((sum, item) => sum + item.amountPaid, 0)
    const totalBalance = fees.reduce((sum, item) => sum + item.balance, 0)
    const paidCount = fees.filter((item) => item.status === "PAID").length
    const partialCount = fees.filter((item) => item.status === "PARTIAL").length
    const unpaidCount = fees.filter((item) => item.status === "UNPAID").length

    return {
      totalBilled,
      totalPaid,
      totalBalance,
      paidCount,
      partialCount,
      unpaidCount,
    }
  }, [fees])

  const nearestDueDate = useMemo(() => {
    if (fees.length === 0) return ""
    const sorted = [...fees].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    return sorted[0]?.dueDate || ""
  }, [fees])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-blue-100">Parent Portal</p>
            <h1 className="mt-1 text-3xl font-bold">Fees Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              View school fees, balances, payment status, and fee history for your selected child.
            </p>
            <p className="mt-3 text-sm font-semibold text-white/90">
              Selected Child: {selectedChild?.name || "No child selected"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              <CreditCard className="h-4 w-4" />
              Pay School Fees
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
          </div>
        </div>
      </section>

      {!selectedChild ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
          Select a child from the top dashboard selector to view fee records.
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Billed"
              value={formatCurrency(totals.totalBilled)}
              subtitle="Selected child"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              title="Total Paid"
              value={formatCurrency(totals.totalPaid)}
              subtitle="Payments completed"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              title="Outstanding Balance"
              value={formatCurrency(totals.totalBalance)}
              subtitle="Amount remaining"
              icon={<Clock3 className="h-5 w-5" />}
            />
            <StatCard
              title="Receipts"
              value={String(fees.length)}
              subtitle="Available fee entries"
              icon={<Receipt className="h-5 w-5" />}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Fee Records</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Review term fees and payment progress for {selectedChild.name}.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search term, session..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-72"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-2">Child</th>
                      <th className="pb-2">Term</th>
                      <th className="pb-2">Session</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Paid</th>
                      <th className="pb-2">Balance</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-gray-500"
                        >
                          Loading fee records...
                        </td>
                      </tr>
                    ) : filteredFees.length > 0 ? (
                      filteredFees.map((item) => (
                        <tr key={item.id} className="bg-slate-50">
                          <td className="rounded-l-xl px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {selectedChild.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Due: {item.dueDate ? formatLongDate(item.dueDate) : "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">{item.term}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{item.session}</td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(item.totalAmount)}
                          </td>
                          <td className="px-4 py-4 text-sm text-green-700">
                            {formatCurrency(item.amountPaid)}
                          </td>
                          <td className="px-4 py-4 text-sm text-red-600">
                            {formatCurrency(item.balance)}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="rounded-r-xl px-4 py-4">
                            <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No fee records found for the selected child.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Quick overview of current payment status.
                </p>

                <div className="mt-5 space-y-4">
                  <SummaryItem
                    label="Paid Terms"
                    value={String(totals.paidCount)}
                    color="text-green-600"
                  />
                  <SummaryItem
                    label="Partial Terms"
                    value={String(totals.partialCount)}
                    color="text-amber-600"
                  />
                  <SummaryItem
                    label="Unpaid Terms"
                    value={String(totals.unpaidCount)}
                    color="text-red-600"
                  />
                  <SummaryItem
                    label="Outstanding"
                    value={formatCurrency(totals.totalBalance)}
                    color="text-blue-700"
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Next Due Date</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nearest fee deadline to watch.
                </p>

                <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">Upcoming payment deadline</p>
                  <p className="mt-2 text-xl font-bold text-amber-900">
                    {nearestDueDate ? formatLongDate(nearestDueDate) : "No due date"}
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Complete pending payment to avoid late reminders.
                  </p>
                </div>

                <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Make Payment
                </button>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/dashboard/parents"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
                  >
                    Back to Parent Portal
                  </Link>
                  <Link
                    href="/dashboard/results"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
                  >
                    View Results
                  </Link>
                  <Link
                    href="/dashboard/attendance"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
                  >
                    View Attendance
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
                  >
                    Contact School
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: "PAID" | "PARTIAL" | "UNPAID" }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid
      </span>
    )
  }

  if (status === "PARTIAL") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" />
        Partial
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      <XCircle className="h-3.5 w-3.5" />
      Unpaid
    </span>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}