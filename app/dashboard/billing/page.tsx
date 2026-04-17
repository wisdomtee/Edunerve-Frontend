"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import { apiFetchJson } from "@/lib/apiClient"
import { downloadInvoicePDF, downloadReceiptPDF } from "@/app/lib/billingPdf"

type School = {
  id: number
  name: string
  email?: string
}

type Invoice = {
  id: number
  invoiceNumber: string
  schoolId: number
  plan: string
  total: number
  status: "UNPAID" | "PAID" | "OVERDUE" | "PENDING" | string
  createdAt: string
  dueDate: string
  school?: School
  receipt?: {
    receiptNumber?: string
    amount?: number
    paymentMethod?: string
    paymentDate?: string
    notes?: string
  } | null
}

type InvoicePdfData = {
  id?: number
  invoiceNumber: string
  amount: number
  total: number
  tax: number
  discount: number
  status: string
  planType: string
  issueDate: string
  dueDate: string
  paymentReference?: string
  description?: string
  school: {
    id?: number
    name: string
    email?: string
  }
}

type ReceiptPdfData = {
  receiptNumber: string
  invoiceNumber: string
  amount: number
  paymentMethod: string
  paymentDate: string
  paymentReference?: string
  school: {
    name: string
    email?: string
  }
  notes?: string
}

function toBillingPdfInvoice(inv: Invoice): InvoicePdfData {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || `INV-${inv.id || "N/A"}`,
    amount: Number(inv.total || 0),
    total: Number(inv.total || 0),
    tax: 0,
    discount: 0,
    status: String(inv.status || "PENDING"),
    planType: String(inv.plan || "NORMAL"),
    issueDate: String(inv.createdAt || new Date().toISOString()),
    dueDate: String(inv.dueDate || new Date().toISOString()),
    paymentReference: undefined,
    description: undefined,
    school: {
      id: inv.school?.id,
      name: inv.school?.name || "School",
      email: inv.school?.email || undefined,
    },
  }
}

function toReceiptPdfData(inv: Invoice): ReceiptPdfData {
  return {
    receiptNumber: inv.receipt?.receiptNumber || `RCPT-${inv.id || "N/A"}`,
    invoiceNumber: inv.invoiceNumber || `INV-${inv.id || "N/A"}`,
    amount: Number(inv.receipt?.amount || inv.total || 0),
    paymentMethod: String(inv.receipt?.paymentMethod || "TRANSFER"),
    paymentDate: String(
      inv.receipt?.paymentDate || inv.createdAt || new Date().toISOString()
    ),
    paymentReference: undefined,
    school: {
      name: inv.school?.name || "School",
      email: inv.school?.email || undefined,
    },
    notes: inv.receipt?.notes || undefined,
  }
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [error, setError] = useState("")

  const fetchInvoices = async () => {
    try {
      const data = await apiFetchJson<{ invoices?: Invoice[] }>(
        `${API_BASE_URL}/billing/invoices`
      )
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : [])
    } catch (err) {
      console.error(err)
      setError("Failed to load invoices")
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      await fetchInvoices()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId)
      setError("")

      const data = await apiFetchJson<any>(
        `${API_BASE_URL}/billing/invoices/${invoiceId}/mark-paid`,
        {
          method: "PATCH",
          body: JSON.stringify({
            method: "TRANSFER",
            reference: `PAY-${Date.now()}`,
          }),
        }
      )

      if (data?.receipt?.base64) {
        const byteCharacters = atob(data.receipt.base64)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type: "application/pdf",
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = data.receipt.fileName || "receipt.pdf"
        link.click()
        window.URL.revokeObjectURL(url)
      }

      await load()
    } catch (err) {
      console.error(err)
      setError("Failed to mark invoice as paid")
    } finally {
      setPayingId(null)
    }
  }

  const filtered =
    filterStatus === "ALL"
      ? invoices
      : invoices.filter((i) => String(i.status).toUpperCase() === filterStatus)

  const money = (v: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(v)

  if (loading) {
    return <div className="p-6">Loading billing data...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Billing Dashboard</h1>

      {error && (
        <div className="rounded bg-red-100 px-4 py-2 text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {["ALL", "PAID", "UNPAID", "OVERDUE", "PENDING"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`rounded-lg border px-4 py-2 ${
              filterStatus === f
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">School</th>
              <th className="p-3 text-left">Plan</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{inv.invoiceNumber}</td>
                <td className="p-3">{inv.school?.name || "-"}</td>
                <td className="p-3">{inv.plan}</td>
                <td className="p-3">{money(inv.total)}</td>

                <td className="p-3">
                  <Status status={inv.status} />
                </td>

                <td className="p-3">
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                </td>

                <td className="flex flex-wrap gap-2 p-3">
                  <button
                    onClick={() => downloadInvoicePDF(toBillingPdfInvoice(inv))}
                    className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-black"
                  >
                    Invoice
                  </button>

                  {String(inv.status).toUpperCase() !== "PAID" && (
                    <button
                      onClick={() => handlePayInvoice(inv.id)}
                      disabled={payingId === inv.id}
                      className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {payingId === inv.id ? "Processing..." : "Mark Paid"}
                    </button>
                  )}

                  {inv.receipt && (
                    <button
                      onClick={() => downloadReceiptPDF(toReceiptPdfData(inv))}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">No invoices found</div>
        )}
      </div>
    </div>
  )
}

function Status({ status }: { status: string }) {
  const normalized = String(status || "").toUpperCase()

  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    UNPAID: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    OVERDUE: "bg-red-100 text-red-700",
  }

  return (
    <span
      className={`rounded px-2 py-1 text-xs ${
        map[normalized] || "bg-gray-100 text-gray-700"
      }`}
    >
      {normalized}
    </span>
  )
}