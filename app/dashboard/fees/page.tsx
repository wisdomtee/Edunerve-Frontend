"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Search,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react"
import { getToken, getUser } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type AppUser = {
  id?: number | string
  name?: string
  email?: string
  role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
  schoolId?: number | null
  mustChangePassword?: boolean
}

type InvoiceItem = {
  id: number
  title: string
  description?: string | null
  amount: number
  paidAmount: number
  balance: number
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | string
  dueDate?: string | null
  createdAt?: string
  updatedAt?: string
  studentId: number
  schoolId: number
  student?: {
    id: number
    name: string
    studentId: string
    class?: {
      id: number
      name: string
    } | null
  }
  payments?: Array<{
    id: number
    amount: number
    method?: string | null
    reference?: string | null
    note?: string | null
    paidAt?: string | null
    createdAt?: string
  }>
}

type InvoiceSummary = {
  totalInvoices: number
  totalAmount: number
  totalPaid: number
  totalBalance: number
  paidCount: number
  pendingCount: number
  overdueCount: number
}

export default function FeesPage() {
  const router = useRouter()

  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  })

  const token = getToken()

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError("")

      const currentUser = getUser() as AppUser | null

      if (!token || !currentUser) {
        router.replace("/login")
        return
      }

      setUser(currentUser)

      const params = new URLSearchParams()

      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter)
      }

      if (search.trim()) {
        params.set("search", search.trim())
      }

      if (currentUser.role === "SUPER_ADMIN" && currentUser.schoolId) {
        params.set("schoolId", String(currentUser.schoolId))
      }

      const queryString = params.toString()
      const url = `${API_BASE_URL}/fee-invoices${queryString ? `?${queryString}` : ""}`

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load invoices")
      }

      setInvoices(Array.isArray(data?.invoices) ? data.invoices : [])
      setSummary(
        data?.summary || {
          totalInvoices: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
        }
      )
    } catch (err: any) {
      console.error("LOAD INVOICES ERROR:", err)
      setError(err.message || "Failed to load invoices")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const q = search.trim().toLowerCase()

      if (!q) return true

      return (
        invoice.title?.toLowerCase().includes(q) ||
        invoice.description?.toLowerCase().includes(q) ||
        invoice.student?.name?.toLowerCase().includes(q) ||
        invoice.student?.studentId?.toLowerCase().includes(q) ||
        invoice.student?.class?.name?.toLowerCase().includes(q)
      )
    })
  }, [invoices, search])

  const nearestDueDate = useMemo(() => {
    const valid = filteredInvoices.filter((item) => item.dueDate)
    if (!valid.length) return ""
    const sorted = [...valid].sort(
      (a, b) =>
        new Date(a.dueDate || "").getTime() - new Date(b.dueDate || "").getTime()
    )
    return sorted[0]?.dueDate || ""
  }, [filteredInvoices])

  const handleDelete = async (invoiceId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    )

    if (!confirmed) return

    try {
      setDeletingId(invoiceId)

      const res = await fetch(`${API_BASE_URL}/fee-invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete invoice")
      }

      await loadInvoices()
    } catch (err: any) {
      alert(err.message || "Failed to delete invoice")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-blue-100">School Admin</p>
            <h1 className="mt-1 text-3xl font-bold">Fees Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Create, monitor, and manage student fee invoices for your school.
            </p>
            <p className="mt-3 text-sm font-semibold text-white/90">
              Signed in as: {user?.name || "Admin"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/fees/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <CreditCard className="h-4 w-4" />
              Create Invoice
            </button>

            <button
              onClick={loadInvoices}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={String(summary.totalInvoices)}
          subtitle="All fee invoices"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Total Billed"
          value={formatCurrency(summary.totalAmount)}
          subtitle="Invoice total"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          subtitle="Successful payments"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(summary.totalBalance)}
          subtitle="Pending amount"
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invoice List</h2>
              <p className="mt-1 text-sm text-gray-500">
                Search and manage school fee invoices in real time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search title, student, class..."
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
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Balance</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((item) => (
                    <tr key={item.id} className="bg-slate-50">
                      <td className="rounded-l-xl px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.student?.name || "Unknown student"}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {item.student?.studentId || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Class: {item.student?.class?.name || "—"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.description || "No description"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(Number(item.amount || 0))}
                      </td>

                      <td className="px-4 py-4 text-sm text-green-700">
                        {formatCurrency(Number(item.paidAmount || 0))}
                      </td>

                      <td className="px-4 py-4 text-sm text-red-600">
                        {formatCurrency(Number(item.balance || 0))}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.dueDate ? formatLongDate(item.dueDate) : "—"}
                      </td>

                      <td className="rounded-r-xl px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/fees/create?copy=${item.id}`)
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Duplicate
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
            <p className="mt-1 text-sm text-gray-500">
              Overview of current fee invoice performance.
            </p>

            <div className="mt-5 space-y-4">
              <SummaryItem
                label="Paid Invoices"
                value={String(summary.paidCount)}
                color="text-green-600"
              />
              <SummaryItem
                label="Pending Invoices"
                value={String(summary.pendingCount)}
                color="text-amber-600"
              />
              <SummaryItem
                label="Overdue Invoices"
                value={String(summary.overdueCount)}
                color="text-red-600"
              />
              <SummaryItem
                label="Outstanding"
                value={formatCurrency(summary.totalBalance)}
                color="text-blue-700"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Nearest Due Date</h3>
            <p className="mt-1 text-sm text-gray-500">
              Closest invoice deadline across visible records.
            </p>

            <div className="mt-5 rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Upcoming deadline
              </p>
              <p className="mt-2 text-xl font-bold text-amber-900">
                {nearestDueDate ? formatLongDate(nearestDueDate) : "No due date"}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Review pending invoices before deadline.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard/fees/create")}
              className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create New Invoice
            </button>
          </div>
        </div>
      </section>
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

function StatusBadge({
  status,
}: {
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | string
}) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid
      </span>
    )
  }

  if (status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Overdue
      </span>
    )
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
        Cancelled
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
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