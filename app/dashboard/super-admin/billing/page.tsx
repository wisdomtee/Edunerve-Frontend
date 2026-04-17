"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { API_BASE_URL, authFetch, getToken, getUser } from "@/lib/api"

type SummaryResponse = {
  message: string
  scope: "global" | "school"
  stats: {
    totalInvoices: number
    pendingInvoices?: number
    paidInvoices: number
    overdueInvoices: number
    totalRevenue?: number
    totalPaid?: number
    activeSchools?: number
    expiredSchools?: number
    trialSchools?: number
  }
  school?: {
    id: number
    name: string
    plan?: string | null
    subscriptionPlan?: string | null
    subscriptionStatus?: string | null
    subscriptionEnd?: string | null
    nextBillingDate?: string | null
  } | null
  billingState?: {
    id: number
    schoolId: number
    plan: "NORMAL" | "PRO"
    status: string
    amount: number
    currency: string
    billingCycle: string
    trialStartsAt?: string | null
    trialEndsAt?: string | null
    nextBillingDate?: string | null
    lastPaymentDate?: string | null
    isAutoRenew?: boolean
    notes?: string | null
  } | null
}

type Invoice = {
  id: number
  invoiceNumber: string
  schoolId: number
  planType: "NORMAL" | "PRO"
  billingCycle: string
  amount: number | string
  tax?: number | string | null
  discount?: number | string | null
  total?: number | string | null
  description?: string | null
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  issueDate: string
  dueDate?: string | null
  paidAt?: string | null
  paymentReference?: string | null
  createdAt: string
  updatedAt: string
  school?: {
    id: number
    name: string
    email?: string | null
    schoolCode?: string | null
    plan?: string | null
    subscriptionStatus?: string | null
    subscriptionEnd?: string | null
    billingState?: {
      id: number
      schoolId: number
      plan: "NORMAL" | "PRO"
      status: string
      amount: number
      currency: string
      billingCycle: string
      trialEndsAt?: string | null
      nextBillingDate?: string | null
      lastPaymentDate?: string | null
      isAutoRenew?: boolean
      notes?: string | null
    } | null
  }
  payments?: Array<{
    id: number
    amount: number
    reference: string
    status: string
    method: string
    paidAt?: string | null
    createdAt: string
  }>
  receipt?: {
    id: number
    receiptNumber: string
    amount: number | string
    paymentMethod?: string | null
    paymentDate: string
  } | null
}

type InvoicesResponse = {
  message: string
  page: number
  limit: number
  total: number
  totalPages: number
  invoices: Invoice[]
}

type Payment = {
  id: number
  invoiceId: number
  schoolId: number
  plan: "NORMAL" | "PRO"
  amount: number
  currency: string
  reference: string
  status: string
  method: string
  paidAt?: string | null
  createdAt: string
  invoice?: {
    id: number
    invoiceNumber: string
    school?: {
      id: number
      name: string
      email?: string | null
    }
  }
}

type PaymentsResponse = {
  message: string
  page: number
  limit: number
  total: number
  totalPages: number
  payments: Payment[]
}

type BillingSchool = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  schoolCode?: string | null
  plan: "NORMAL" | "PRO" | string
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
  subscriptionStart?: string | null
  subscriptionEnd?: string | null
  billingCycle?: string | null
  nextBillingDate?: string | null
  billingState?: {
    id: number
    schoolId: number
    plan: "NORMAL" | "PRO"
    status: string
    amount: number
    currency: string
    billingCycle: string
    trialStartsAt?: string | null
    trialEndsAt?: string | null
    nextBillingDate?: string | null
    lastPaymentDate?: string | null
    isAutoRenew?: boolean
    notes?: string | null
  } | null
  _count?: {
    students?: number
    teachers?: number
    classes?: number
    invoices?: number
    payments?: number
  }
}

type BillingSchoolsResponse = {
  message: string
  schools: BillingSchool[]
}

type CreateInvoiceForm = {
  schoolId: string
  amount: string
  tax: string
  discount: string
  dueDate: string
  plan: "NORMAL" | "PRO"
  billingCycle: "MONTHLY" | "YEARLY"
  paymentReference: string
  description: string
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
}

type MarkPaidState = {
  invoiceId: number | null
  reference: string
  method: "BANK" | "CARD" | "TRANSFER" | "CASH" | "OTHER"
  amount: string
  paidAt: string
  notes: string
}

export default function SuperAdminBillingPage() {
  const currentUser = getUser()

  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [schools, setSchools] = useState<BillingSchool[]>([])

  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")

  const [schoolSearch, setSchoolSearch] = useState("")
  const [schoolStatusFilter, setSchoolStatusFilter] = useState("")
  const [schoolPlanFilter, setSchoolPlanFilter] = useState("")

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null)
  const [runningExpiryCheck, setRunningExpiryCheck] = useState(false)
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null)
  const [updatingSchoolId, setUpdatingSchoolId] = useState<number | null>(null)

  const [createForm, setCreateForm] = useState<CreateInvoiceForm>({
    schoolId: "",
    amount: "",
    tax: "",
    discount: "",
    dueDate: "",
    plan: "NORMAL",
    billingCycle: "MONTHLY",
    paymentReference: "",
    description: "",
    status: "PENDING",
  })

  const [markPaidForm, setMarkPaidForm] = useState<MarkPaidState>({
    invoiceId: null,
    reference: "",
    method: "TRANSFER",
    amount: "",
    paidAt: "",
    notes: "",
  })

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  const fetchSummary = async () => {
    const res = await authFetch(`${API_BASE_URL}/billing/summary`)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch billing summary")
    }

    setSummary(data)
  }

  const fetchInvoices = async () => {
    setTableLoading(true)

    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("limit", "20")

      if (search.trim()) params.set("search", search.trim())
      if (statusFilter.trim()) params.set("status", statusFilter.trim())
      if (planFilter.trim()) params.set("plan", planFilter.trim())

      const res = await authFetch(
        `${API_BASE_URL}/billing/invoices?${params.toString()}`
      )
      const data: InvoicesResponse = await res.json()

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to fetch invoices")
      }

      setInvoices(data.invoices || [])
    } finally {
      setTableLoading(false)
    }
  }

  const fetchPayments = async () => {
    setPaymentsLoading(true)

    try {
      const res = await authFetch(`${API_BASE_URL}/billing/payments?page=1&limit=10`)
      const data: PaymentsResponse = await res.json()

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to fetch payments")
      }

      setPayments(data.payments || [])
    } finally {
      setPaymentsLoading(false)
    }
  }

  const fetchSchools = async () => {
    setSchoolsLoading(true)

    try {
      const params = new URLSearchParams()

      if (schoolSearch.trim()) params.set("search", schoolSearch.trim())
      if (schoolStatusFilter.trim()) params.set("status", schoolStatusFilter.trim())
      if (schoolPlanFilter.trim()) params.set("plan", schoolPlanFilter.trim())

      const url = params.toString()
        ? `${API_BASE_URL}/billing/schools?${params.toString()}`
        : `${API_BASE_URL}/billing/schools`

      const res = await authFetch(url)
      const data: BillingSchoolsResponse = await res.json()

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to fetch billing schools")
      }

      setSchools(data.schools || [])
    } finally {
      setSchoolsLoading(false)
    }
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError("")
      await Promise.all([fetchSummary(), fetchInvoices(), fetchPayments(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to load billing dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    fetchInvoices().catch((err: any) => {
      setError(err.message || "Failed to fetch invoices")
    })
  }, [search, statusFilter, planFilter])

  useEffect(() => {
    fetchSchools().catch((err: any) => {
      setError(err.message || "Failed to fetch billing schools")
    })
  }, [schoolSearch, schoolStatusFilter, schoolPlanFilter])

  const totals = useMemo(() => {
    const totalInvoiceAmount = invoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || invoice.amount || 0)
    }, 0)

    return { totalInvoiceAmount }
  }, [invoices])

  const formatMoney = (value: number | string | null | undefined) => {
    return `₦${Number(value || 0).toLocaleString()}`
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "—"
    return new Date(value).toLocaleDateString()
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—"
    return new Date(value).toLocaleString()
  }

  const getStatusBadge = (status?: string | null) => {
    const normalized = String(status || "").toUpperCase()

    if (normalized === "PAID" || normalized === "ACTIVE" || normalized === "SUCCESS") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    }

    if (normalized === "OVERDUE" || normalized === "PAST_DUE" || normalized === "TRIAL") {
      return "bg-amber-100 text-amber-700 border-amber-200"
    }

    if (normalized === "CANCELLED" || normalized === "FAILED" || normalized === "SUSPENDED") {
      return "bg-red-100 text-red-700 border-red-200"
    }

    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  const getPlanBadge = (plan?: string | null) => {
    const normalized = String(plan || "NORMAL").toUpperCase()

    if (normalized === "PRO") {
      return "bg-blue-100 text-blue-700 border-blue-200"
    }

    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  const handleCreateInvoice = async (e: FormEvent) => {
    e.preventDefault()

    try {
      setCreatingInvoice(true)
      clearMessages()

      const res = await authFetch(`${API_BASE_URL}/billing/invoices`, {
        method: "POST",
        body: JSON.stringify({
          schoolId: Number(createForm.schoolId),
          amount: Number(createForm.amount),
          tax: createForm.tax ? Number(createForm.tax) : 0,
          discount: createForm.discount ? Number(createForm.discount) : 0,
          dueDate: createForm.dueDate || undefined,
          plan: createForm.plan,
          billingCycle: createForm.billingCycle,
          paymentReference: createForm.paymentReference || undefined,
          description: createForm.description || undefined,
          status: createForm.status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create invoice")
      }

      setSuccess("Invoice created successfully")
      setShowCreateForm(false)
      setCreateForm({
        schoolId: "",
        amount: "",
        tax: "",
        discount: "",
        dueDate: "",
        plan: "NORMAL",
        billingCycle: "MONTHLY",
        paymentReference: "",
        description: "",
        status: "PENDING",
      })

      await Promise.all([fetchSummary(), fetchInvoices(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to create invoice")
    } finally {
      setCreatingInvoice(false)
    }
  }

  const openMarkPaid = (invoice: Invoice) => {
    clearMessages()

    setMarkPaidForm({
      invoiceId: invoice.id,
      reference: "",
      method: "TRANSFER",
      amount: String(Number(invoice.total || invoice.amount || 0)),
      paidAt: "",
      notes: "",
    })
  }

  const submitMarkPaid = async () => {
    if (!markPaidForm.invoiceId) return

    if (!markPaidForm.reference.trim()) {
      setError("Payment reference is required")
      return
    }

    try {
      setMarkingPaidId(markPaidForm.invoiceId)
      clearMessages()

      const res = await authFetch(
        `${API_BASE_URL}/billing/invoices/${markPaidForm.invoiceId}/mark-paid`,
        {
          method: "PATCH",
          body: JSON.stringify({
            reference: markPaidForm.reference,
            method: markPaidForm.method,
            amount: Number(markPaidForm.amount),
            paidAt: markPaidForm.paidAt || undefined,
            notes: markPaidForm.notes || undefined,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark invoice as paid")
      }

      setSuccess("Invoice marked as paid successfully")
      setMarkPaidForm({
        invoiceId: null,
        reference: "",
        method: "TRANSFER",
        amount: "",
        paidAt: "",
        notes: "",
      })

      await Promise.all([fetchSummary(), fetchInvoices(), fetchPayments(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to mark invoice as paid")
    } finally {
      setMarkingPaidId(null)
    }
  }

  const handleMarkOverdue = async (invoiceId: number) => {
    try {
      clearMessages()

      const res = await authFetch(
        `${API_BASE_URL}/billing/invoices/${invoiceId}/mark-overdue`,
        { method: "PATCH" }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark invoice overdue")
      }

      setSuccess("Invoice marked as overdue")
      await Promise.all([fetchSummary(), fetchInvoices(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to mark invoice overdue")
    }
  }

  const handleRunExpiryCheck = async () => {
    try {
      setRunningExpiryCheck(true)
      clearMessages()

      const res = await authFetch(`${API_BASE_URL}/billing/run-expiry-check`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to run expiry check")
      }

      setSuccess("Expiry check completed successfully")
      await Promise.all([fetchSummary(), fetchInvoices(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to run expiry check")
    } finally {
      setRunningExpiryCheck(false)
    }
  }

  const downloadReceiptPdf = async (invoiceId: number, invoiceNumber?: string) => {
    try {
      setDownloadingReceiptId(invoiceId)
      clearMessages()

      const token = getToken()

      const res = await fetch(`${API_BASE_URL}/billing/receipts/${invoiceId}/pdf`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        let message = "Failed to download receipt PDF"
        try {
          const data = await res.json()
          message = data?.message || message
        } catch {
          // ignore json parse error
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = invoiceNumber
        ? `receipt-${invoiceNumber}.pdf`
        : `receipt-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setSuccess("Receipt downloaded successfully")
    } catch (err: any) {
      setError(err.message || "Failed to download receipt PDF")
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  const handleUpgradeSchool = async (schoolId: number) => {
    try {
      setUpdatingSchoolId(schoolId)
      clearMessages()

      const res = await authFetch(`${API_BASE_URL}/billing/schools/${schoolId}/upgrade`, {
        method: "PATCH",
        body: JSON.stringify({
          billingCycle: "MONTHLY",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to upgrade school")
      }

      setSuccess("School upgraded to PRO successfully")
      await Promise.all([fetchSummary(), fetchSchools(), fetchInvoices()])
    } catch (err: any) {
      setError(err.message || "Failed to upgrade school")
    } finally {
      setUpdatingSchoolId(null)
    }
  }

  const handleDowngradeSchool = async (schoolId: number) => {
    try {
      setUpdatingSchoolId(schoolId)
      clearMessages()

      const res = await authFetch(`${API_BASE_URL}/billing/schools/${schoolId}/downgrade`, {
        method: "PATCH",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to downgrade school")
      }

      setSuccess("School downgraded to NORMAL successfully")
      await Promise.all([fetchSummary(), fetchSchools(), fetchInvoices()])
    } catch (err: any) {
      setError(err.message || "Failed to downgrade school")
    } finally {
      setUpdatingSchoolId(null)
    }
  }

  const handleToggleAutoRenew = async (schoolId: number) => {
    try {
      setUpdatingSchoolId(schoolId)
      clearMessages()

      const res = await authFetch(
        `${API_BASE_URL}/billing/schools/${schoolId}/toggle-auto-renew`,
        {
          method: "PATCH",
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to toggle auto renew")
      }

      setSuccess("Auto-renew updated successfully")
      await Promise.all([fetchSummary(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to toggle auto renew")
    } finally {
      setUpdatingSchoolId(null)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            Only super admins can view the billing dashboard.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Super Admin</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Billing Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage schools, subscriptions, invoices, payments, receipts, and subscription lifecycle.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleRunExpiryCheck}
              disabled={runningExpiryCheck}
              className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
            >
              {runningExpiryCheck ? "Running..." : "Run Expiry Check"}
            </button>

            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {showCreateForm ? "Close Form" : "+ Create Invoice"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        {showCreateForm ? (
          <form
            onSubmit={handleCreateInvoice}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Create Invoice
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  School ID
                </label>
                <input
                  type="number"
                  value={createForm.schoolId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, schoolId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="Enter school ID"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  value={createForm.plan}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      plan: e.target.value as "NORMAL" | "PRO",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Billing Cycle
                </label>
                <select
                  value={createForm.billingCycle}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      billingCycle: e.target.value as "MONTHLY" | "YEARLY",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="YEARLY">YEARLY</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tax
                </label>
                <input
                  type="number"
                  value={createForm.tax}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, tax: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Discount
                </label>
                <input
                  type="number"
                  value={createForm.discount}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, discount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Invoice Status
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value as CreateInvoiceForm["status"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={createForm.paymentReference}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      paymentReference: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="Optional reference"
                />
              </div>

              <div className="xl:col-span-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  rows={3}
                  placeholder="Invoice description"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={creatingInvoice}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creatingInvoice ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.totalInvoices || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.pendingInvoices || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Paid</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.paidInvoices || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.overdueInvoices || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatMoney(summary?.stats.totalRevenue || 0)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Schools</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.activeSchools || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Trial Schools</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.stats.trialSchools || 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  School Billing Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage plan upgrades, downgrades, auto-renew, and trial visibility.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Search school..."
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <select
                  value={schoolStatusFilter}
                  onChange={(e) => setSchoolStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">All Billing Status</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>

                <select
                  value={schoolPlanFilter}
                  onChange={(e) => setSchoolPlanFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">All Plans</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading || schoolsLoading ? (
              <div className="p-6 text-sm text-slate-500">Loading schools...</div>
            ) : schools.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No schools found.
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      School
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      Billing State
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      Trial End
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      Next Billing
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                      Auto Renew
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr
                      key={school.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 align-top">
                        <p className="font-semibold text-slate-900">{school.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Code: {school.schoolCode || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {school.email || "No email"}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPlanBadge(
                            school.billingState?.plan || school.plan
                          )}`}
                        >
                          {school.billingState?.plan || school.plan || "NORMAL"}
                        </span>
                        <p className="mt-2 text-xs text-slate-500">
                          {school.billingState?.billingCycle || school.billingCycle || "monthly"}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            school.billingState?.status || school.subscriptionStatus
                          )}`}
                        >
                          {school.billingState?.status || school.subscriptionStatus || "—"}
                        </span>

                        <p className="mt-2 text-xs text-slate-500">
                          Students: {school._count?.students || 0} · Invoices: {school._count?.invoices || 0}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(school.billingState?.trialEndsAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Start: {formatDate(school.billingState?.trialStartsAt)}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(school.billingState?.nextBillingDate || school.nextBillingDate)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Last: {formatDate(school.billingState?.lastPaymentDate)}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <button
                          onClick={() => handleToggleAutoRenew(school.id)}
                          disabled={updatingSchoolId === school.id || !school.billingState}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            school.billingState?.isAutoRenew
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {school.billingState?.isAutoRenew ? "ON" : "OFF"}
                        </button>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          {String(school.billingState?.plan || school.plan).toUpperCase() !== "PRO" ? (
                            <button
                              onClick={() => handleUpgradeSchool(school.id)}
                              disabled={updatingSchoolId === school.id}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                            >
                              {updatingSchoolId === school.id ? "Updating..." : "Upgrade to PRO"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDowngradeSchool(school.id)}
                              disabled={updatingSchoolId === school.id}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              {updatingSchoolId === school.id ? "Updating..." : "Downgrade"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-4 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Invoices
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Total loaded amount: {formatMoney(totals.totalInvoiceAmount)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice..."
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  >
                    <option value="">All Plans</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading || tableLoading ? (
                <div className="p-6 text-sm text-slate-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No invoices found.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                        School
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="font-semibold text-slate-900">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Due: {formatDate(invoice.dueDate)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Ref: {invoice.paymentReference || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <p className="font-medium text-slate-900">
                            {invoice.school?.name || `School #${invoice.schoolId}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {invoice.school?.email || "No email"}
                          </p>

                          {invoice.school?.billingState?.status ? (
                            <div className="mt-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                                  invoice.school.billingState.status
                                )}`}
                              >
                                Billing: {invoice.school.billingState.status}
                              </span>
                            </div>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getPlanBadge(
                                invoice.planType
                              )}`}
                            >
                              {invoice.planType}
                            </span>
                            <span className="text-xs text-slate-500">
                              {invoice.billingCycle}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <p className="font-semibold text-slate-900">
                            {formatMoney(invoice.total || invoice.amount)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Base: {formatMoney(invoice.amount)}
                          </p>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/dashboard/super-admin/billing/${invoice.id}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              View
                            </Link>

                            {invoice.status !== "PAID" ? (
                              <button
                                onClick={() => openMarkPaid(invoice)}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                Mark Paid
                              </button>
                            ) : null}

                            {invoice.status === "PENDING" ? (
                              <button
                                onClick={() => handleMarkOverdue(invoice.id)}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                              >
                                Overdue
                              </button>
                            ) : null}

                            {invoice.receipt ? (
                              <button
                                onClick={() =>
                                  downloadReceiptPdf(invoice.id, invoice.invoiceNumber)
                                }
                                disabled={downloadingReceiptId === invoice.id}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                              >
                                {downloadingReceiptId === invoice.id
                                  ? "Downloading..."
                                  : "Receipt PDF"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {markPaidForm.invoiceId ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Mark Invoice as Paid
                  </h2>
                  <button
                    onClick={() =>
                      setMarkPaidForm({
                        invoiceId: null,
                        reference: "",
                        method: "TRANSFER",
                        amount: "",
                        paidAt: "",
                        notes: "",
                      })
                    }
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Payment Reference
                    </label>
                    <input
                      type="text"
                      value={markPaidForm.reference}
                      onChange={(e) =>
                        setMarkPaidForm((prev) => ({
                          ...prev,
                          reference: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      placeholder="Enter payment reference"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Method
                    </label>
                    <select
                      value={markPaidForm.method}
                      onChange={(e) =>
                        setMarkPaidForm((prev) => ({
                          ...prev,
                          method: e.target.value as MarkPaidState["method"],
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="BANK">BANK</option>
                      <option value="CARD">CARD</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="CASH">CASH</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={markPaidForm.amount}
                      onChange={(e) =>
                        setMarkPaidForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Paid At
                    </label>
                    <input
                      type="datetime-local"
                      value={markPaidForm.paidAt}
                      onChange={(e) =>
                        setMarkPaidForm((prev) => ({
                          ...prev,
                          paidAt: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Notes
                    </label>
                    <textarea
                      value={markPaidForm.notes}
                      onChange={(e) =>
                        setMarkPaidForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={submitMarkPaid}
                    disabled={markingPaidId === markPaidForm.invoiceId}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {markingPaidId === markPaidForm.invoiceId
                      ? "Saving..."
                      : "Confirm Payment"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Payments
              </h2>

              <div className="mt-4 space-y-4">
                {paymentsLoading ? (
                  <p className="text-sm text-slate-500">Loading payments...</p>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments yet.</p>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatMoney(payment.amount)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {payment.invoice?.school?.name || "Unknown school"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {payment.reference}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(payment.paidAt || payment.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Billing State Snapshot
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Global Active Schools</span>
                  <span className="font-semibold text-slate-900">
                    {summary?.stats.activeSchools || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Global Expired Schools</span>
                  <span className="font-semibold text-slate-900">
                    {summary?.stats.expiredSchools || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Global Trial Schools</span>
                  <span className="font-semibold text-slate-900">
                    {summary?.stats.trialSchools || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Loaded Schools</span>
                  <span className="font-semibold text-slate-900">
                    {schools.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}