"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { API_BASE_URL, authFetch } from "@/lib/api"

type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | string
type PlanType = "NORMAL" | "PRO" | string
type PaymentMethod = "BANK" | "CARD" | "TRANSFER" | "CASH" | "OTHER" | string

type BillingState = {
  id: number
  schoolId: number
  plan?: string | null
  status?: string | null
  billingCycle?: string | null
  amount?: number | string | null
  currency?: string | null
  nextBillingDate?: string | null
  lastPaymentDate?: string | null
  trialEndsAt?: string | null
  isAutoRenew?: boolean | null
  notes?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type InvoiceDetail = {
  id: number
  invoiceNumber: string
  schoolId: number
  planType: PlanType
  billingCycle: string
  amount: number | string
  tax?: number | string | null
  discount?: number | string | null
  total?: number | string | null
  description?: string | null
  status: InvoiceStatus
  issueDate: string
  dueDate?: string | null
  paidAt?: string | null
  paymentReference?: string | null
  createdAt: string
  updatedAt: string
  school: {
    id: number
    name: string
    email?: string | null
    address?: string | null
    phone?: string | null
    plan?: string | null
    subscriptionStatus?: string | null
    subscriptionEnd?: string | null
    billingState?: BillingState | null
  }
  payments: Array<{
    id: number
    amount: number | string
    currency?: string | null
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
    notes?: string | null
  } | null
}

export default function BillingInvoiceDetailPage() {
  const params = useParams()
  const rawId = params?.id

  const invoiceId = useMemo(() => {
    if (Array.isArray(rawId)) return rawId[0] ?? ""
    return rawId ?? ""
  }, [rawId])

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [showPaidForm, setShowPaidForm] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const billingState = invoice?.school?.billingState ?? null

  const formatMoney = (value: number | string | null | undefined) => {
    const numericValue = Number(value ?? 0)
    if (Number.isNaN(numericValue)) return "₦0"
    return `₦${numericValue.toLocaleString()}`
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString()
  }

  const getStatusBadge = (status?: string | null) => {
    const normalized = String(status || "").toUpperCase()

    if (
      normalized === "PAID" ||
      normalized === "SUCCESS" ||
      normalized === "ACTIVE"
    ) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    }

    if (
      normalized === "OVERDUE" ||
      normalized === "PENDING" ||
      normalized === "TRIAL" ||
      normalized === "PAST_DUE"
    ) {
      return "bg-amber-100 text-amber-700 border-amber-200"
    }

    if (
      normalized === "CANCELLED" ||
      normalized === "FAILED" ||
      normalized === "ERROR" ||
      normalized === "INACTIVE" ||
      normalized === "SUSPENDED"
    ) {
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

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) {
      setError("Invalid invoice ID")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await authFetch(`${API_BASE_URL}/billing/invoices/${invoiceId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch invoice")
      }

      setInvoice(data?.invoice ?? null)
    } catch (err: any) {
      setInvoice(null)
      setError(err?.message || "Failed to fetch invoice")
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  useEffect(() => {
    if (!invoice) return
    setPaymentAmount(
      invoice.total != null ? String(invoice.total) : String(invoice.amount ?? "")
    )
  }, [invoice])

  const handleMarkOverdue = async () => {
    if (!invoice) return

    try {
      setUpdatingStatus(true)
      setError("")
      setSuccess("")

      const res = await authFetch(
        `${API_BASE_URL}/billing/invoices/${invoice.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "OVERDUE",
          }),
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark invoice as overdue")
      }

      setSuccess("Invoice marked as OVERDUE successfully")
      await fetchInvoice()
    } catch (err: any) {
      setError(err?.message || "Failed to mark invoice as overdue")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return

    if (!paymentReference.trim()) {
      setError("Payment reference is required to mark invoice as paid")
      return
    }

    try {
      setUpdatingStatus(true)
      setError("")
      setSuccess("")

      const res = await authFetch(
        `${API_BASE_URL}/billing/invoices/${invoice.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "PAID",
            reference: paymentReference.trim(),
            method: paymentMethod,
            amount: paymentAmount.trim() ? Number(paymentAmount) : undefined,
            notes: paymentNotes.trim() || undefined,
          }),
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark invoice as paid")
      }

      setSuccess("Invoice marked as PAID successfully")
      setShowPaidForm(false)
      setPaymentReference("")
      setPaymentMethod("TRANSFER")
      setPaymentNotes("")
      await fetchInvoice()
    } catch (err: any) {
      setError(err?.message || "Failed to mark invoice as paid")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const downloadReceipt = async () => {
    if (!invoice) return

    try {
      setDownloadingReceipt(true)
      setError("")
      setSuccess("")

      const res = await authFetch(
        `${API_BASE_URL}/billing/receipts/${invoice.id}/pdf`
      )

      if (!res.ok) {
        let message = "Failed to download receipt"
        try {
          const data = await res.json()
          message = data?.message || message
        } catch {
          //
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${invoice.invoiceNumber || "receipt"}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || "Failed to download receipt")
    } finally {
      setDownloadingReceipt(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading invoice...
        </div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Link
            href="/dashboard/super-admin/billing"
            className="inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Billing
          </Link>

          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-white p-6">
          <p className="text-sm text-red-700">Invoice not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href="/dashboard/super-admin/billing"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Billing
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInvoice}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              onClick={() => setShowPaidForm((prev) => !prev)}
              disabled={updatingStatus || invoice.status === "PAID"}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showPaidForm ? "Close Paid Form" : "Mark as Paid"}
            </button>

            <button
              onClick={handleMarkOverdue}
              disabled={
                updatingStatus ||
                invoice.status === "OVERDUE" ||
                invoice.status === "PAID"
              }
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingStatus ? "Updating..." : "Mark as Overdue"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {showPaidForm && invoice.status !== "PAID" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Mark Invoice as Paid
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. PAY-2026-0001"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="BANK">BANK</option>
                  <option value="CARD">CARD</option>
                  <option value="CASH">CASH</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional payment note"
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleMarkPaid}
                disabled={updatingStatus}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? "Saving..." : "Confirm Mark as Paid"}
              </button>

              <button
                onClick={() => setShowPaidForm(false)}
                disabled={updatingStatus}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Invoice</p>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {invoice.invoiceNumber}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Created: {formatDate(invoice.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPlanBadge(
                      invoice.planType
                    )}`}
                  >
                    {String(invoice.planType || "NORMAL").toUpperCase()}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      invoice.status
                    )}`}
                  >
                    {String(invoice.status || "PENDING").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    School Info
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {invoice.school?.name || "Unknown school"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {invoice.school?.email || "No email"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {invoice.school?.phone || "No phone"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {invoice.school?.address || "No address"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice Details
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Billing Cycle:{" "}
                    <span className="font-semibold">
                      {invoice.billingCycle || "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Issue Date:{" "}
                    <span className="font-semibold">
                      {formatDate(invoice.issueDate)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Due Date:{" "}
                    <span className="font-semibold">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Paid At:{" "}
                    <span className="font-semibold">
                      {formatDate(invoice.paidAt)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Payment Ref:{" "}
                    <span className="font-semibold">
                      {invoice.paymentReference || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Billing State
                </h2>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Plan
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {billingState?.plan || invoice.school?.plan || invoice.planType || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subscription Status
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                        billingState?.status || invoice.school?.subscriptionStatus
                      )}`}
                    >
                      {String(
                        billingState?.status ||
                          invoice.school?.subscriptionStatus ||
                          "UNKNOWN"
                      ).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount Due
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatMoney(billingState?.amount ?? invoice.total ?? invoice.amount)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Next Billing Date
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(
                      billingState?.nextBillingDate || invoice.school?.subscriptionEnd
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Payment Date
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(billingState?.lastPaymentDate || invoice.paidAt)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trial Ends
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(billingState?.trialEndsAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Invoice Breakdown
                </h2>
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-600">Base Amount</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(invoice.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(invoice.tax)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(invoice.discount)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-base font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatMoney(invoice.total ?? invoice.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment History
                </h2>
              </div>

              <div className="p-6">
                {!invoice.payments || invoice.payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {invoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {formatMoney(payment.amount)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {payment.method || "Unknown method"} ·{" "}
                              {payment.reference || "No reference"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(payment.paidAt || payment.createdAt)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              payment.status
                            )}`}
                          >
                            {String(payment.status || "PENDING").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Receipt Info
              </h2>

              {invoice.receipt ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Receipt Number
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {invoice.receipt.receiptNumber}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatMoney(invoice.receipt.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Method
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {invoice.receipt.paymentMethod || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Date
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatDate(invoice.receipt.paymentDate)}
                    </p>
                  </div>

                  <button
                    onClick={downloadReceipt}
                    disabled={downloadingReceipt}
                    className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingReceipt ? "Downloading..." : "Download Receipt"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-500">
                    No receipt has been generated for this invoice yet.
                  </p>

                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
                  >
                    Download Receipt
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {invoice.description || "No description provided for this invoice."}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowPaidForm((prev) => !prev)}
                  disabled={updatingStatus || invoice.status === "PAID"}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showPaidForm ? "Close Paid Form" : "Mark Paid"}
                </button>

                <button
                  onClick={handleMarkOverdue}
                  disabled={
                    updatingStatus ||
                    invoice.status === "OVERDUE" ||
                    invoice.status === "PAID"
                  }
                  className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark Overdue
                </button>

                <button
                  onClick={fetchInvoice}
                  className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}