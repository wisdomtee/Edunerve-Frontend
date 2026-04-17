"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { API_BASE_URL, authFetch } from "@/lib/api"

type Invoice = {
  id: number
  invoiceNumber: string
  amount: number | string
  tax?: number | string | null
  discount?: number | string | null
  total?: number | string | null
  status: string
  planType?: string | null
  billingCycle?: string | null
  issueDate?: string | null
  dueDate?: string | null
  paidAt?: string | null
  paymentReference?: string | null
  createdAt?: string | null
  school?: {
    id: number
    name: string
    email?: string | null
    plan?: string | null
    subscriptionStatus?: string | null
    subscriptionEnd?: string | null
    billingState?: {
      plan?: string | null
      status?: string | null
      amount?: number | string | null
      nextBillingDate?: string | null
      lastPaymentDate?: string | null
      trialEndsAt?: string | null
      isAutoRenew?: boolean | null
    } | null
  }
  receipt?: {
    id: number
    receiptNumber: string
    amount: number | string
    paymentMethod?: string | null
    paymentDate: string
  } | null
}

type BillingSummaryResponse = {
  message: string
  scope: string
  school?: {
    id: number
    name: string
    plan?: string | null
    subscriptionPlan?: string | null
    subscriptionStatus?: string | null
    subscriptionEnd?: string | null
    nextBillingDate?: string | null
  }
  billingState?: {
    id: number
    schoolId: number
    plan?: string | null
    status?: string | null
    amount?: number | string | null
    billingCycle?: string | null
    nextBillingDate?: string | null
    lastPaymentDate?: string | null
    trialEndsAt?: string | null
    isAutoRenew?: boolean | null
  } | null
  stats?: {
    totalInvoices: number
    pendingInvoices: number
    paidInvoices: number
    overdueInvoices: number
    totalPaid?: number
  }
}

export default function SchoolAdminBillingPage() {
  const searchParams = useSearchParams()

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [hasVerifiedCurrentReference, setHasVerifiedCurrentReference] =
    useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const paymentReference = useMemo(
    () => searchParams.get("reference") || "",
    [searchParams]
  )

  const paystackStatus = useMemo(
    () => searchParams.get("paystack") || "",
    [searchParams]
  )

  const formatMoney = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0)
    if (Number.isNaN(num)) return "₦0"
    return `₦${num.toLocaleString()}`
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString()
  }

  const badgeClass = (status?: string | null) => {
    const normalized = String(status || "").toUpperCase()

    if (
      normalized === "PAID" ||
      normalized === "SUCCESS" ||
      normalized === "ACTIVE"
    ) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    }

    if (
      normalized === "PENDING" ||
      normalized === "OVERDUE" ||
      normalized === "TRIAL" ||
      normalized === "PAST_DUE"
    ) {
      return "bg-amber-100 text-amber-700 border-amber-200"
    }

    if (
      normalized === "FAILED" ||
      normalized === "CANCELLED" ||
      normalized === "INACTIVE" ||
      normalized === "SUSPENDED"
    ) {
      return "bg-red-100 text-red-700 border-red-200"
    }

    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [summaryRes, invoicesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/billing/summary`),
        authFetch(`${API_BASE_URL}/billing/invoices?page=1&limit=50`),
      ])

      const summaryData = await summaryRes.json().catch(() => null)
      const invoicesData = await invoicesRes.json().catch(() => null)

      if (!summaryRes.ok) {
        throw new Error(summaryData?.message || "Failed to fetch billing summary")
      }

      if (!invoicesRes.ok) {
        throw new Error(invoicesData?.message || "Failed to fetch invoices")
      }

      setSummary(summaryData)
      setInvoices(invoicesData?.invoices || [])
    } catch (err: any) {
      setError(err?.message || "Failed to fetch billing data")
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyPayment = useCallback(
    async (reference: string) => {
      if (!reference) return

      try {
        setVerifying(true)
        setError("")
        setSuccess("")

        const res = await authFetch(
          `${API_BASE_URL}/api/paystack/verify?reference=${encodeURIComponent(reference)}`
        )

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message || "Failed to verify payment")
        }

        setSuccess(data?.message || "Payment verified successfully")
        setHasVerifiedCurrentReference(true)
        await fetchBillingData()
      } catch (err: any) {
        setError(err?.message || "Failed to verify payment")
      } finally {
        setVerifying(false)
      }
    },
    [fetchBillingData]
  )

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  useEffect(() => {
    setHasVerifiedCurrentReference(false)
  }, [paymentReference])

  useEffect(() => {
    if (
      paystackStatus === "success" &&
      paymentReference &&
      !hasVerifiedCurrentReference
    ) {
      verifyPayment(paymentReference)
    }
  }, [
    paystackStatus,
    paymentReference,
    hasVerifiedCurrentReference,
    verifyPayment,
  ])

  const handlePayNow = async (invoiceId: number) => {
    try {
      setPayingInvoiceId(invoiceId)
      setError("")
      setSuccess("")

      const res = await authFetch(
        `${API_BASE_URL}/api/paystack/initialize/${invoiceId}`,
        {
          method: "POST",
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to initialize payment")
      }

      if (!data?.authorizationUrl) {
        throw new Error("Payment link was not returned")
      }

      window.location.href = data.authorizationUrl
    } catch (err: any) {
      setError(err?.message || "Failed to initialize payment")
    } finally {
      setPayingInvoiceId(null)
    }
  }

  const handleDownloadReceipt = async (
    invoiceId: number,
    invoiceNumber: string
  ) => {
    try {
      setError("")

      const res = await authFetch(`${API_BASE_URL}/billing/receipts/${invoiceId}/pdf`)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to download receipt")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoiceNumber || "receipt"}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || "Failed to download receipt")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Loading billing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                School Admin Billing
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {summary?.school?.name || "My School"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track invoices, subscriptions and receipts
              </p>
            </div>

            <button
              onClick={fetchBillingData}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {verifying ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Verifying Paystack payment...
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Plan
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {summary?.billingState?.plan ||
                summary?.school?.subscriptionPlan ||
                summary?.school?.plan ||
                "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subscription Status
            </p>
            <div className="mt-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                  summary?.billingState?.status || summary?.school?.subscriptionStatus
                )}`}
              >
                {String(
                  summary?.billingState?.status ||
                    summary?.school?.subscriptionStatus ||
                    "UNKNOWN"
                ).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next Billing Date
            </p>
            <p className="mt-3 text-lg font-bold text-slate-900">
              {formatDate(
                summary?.billingState?.nextBillingDate ||
                  summary?.school?.nextBillingDate ||
                  summary?.school?.subscriptionEnd
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Paid
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {formatMoney(summary?.stats?.totalPaid || 0)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">My Invoices</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-6 py-4 font-semibold">Invoice</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            Created: {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                            invoice.planType
                          )}`}
                        >
                          {String(invoice.planType || "NORMAL").toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatMoney(invoice.total ?? invoice.amount)}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {formatDate(invoice.dueDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                            invoice.status
                          )}`}
                        >
                          {String(invoice.status || "PENDING").toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {invoice.status !== "PAID" ? (
                            <button
                              onClick={() => handlePayNow(invoice.id)}
                              disabled={payingInvoiceId === invoice.id}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {payingInvoiceId === invoice.id
                                ? "Redirecting..."
                                : "Pay Now"}
                            </button>
                          ) : null}

                          {invoice.receipt ? (
                            <button
                              onClick={() =>
                                handleDownloadReceipt(
                                  invoice.id,
                                  invoice.invoiceNumber
                                )
                              }
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Receipt
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}