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
  status: "UNPAID" | "PAID" | "OVERDUE"
  createdAt: string
  dueDate: string
  school?: School
  receipt?: any
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [error, setError] = useState("")

  // ================= FETCH =================
  const fetchInvoices = async () => {
    try {
      const data = await apiFetchJson(`${API_BASE_URL}/billing/invoices`)
      setInvoices(data.invoices || [])
    } catch (err: any) {
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

  // ================= PAY =================
  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId)

      const data = await apiFetchJson(
        `${API_BASE_URL}/billing/invoices/${invoiceId}/mark-paid`,
        {
          method: "PATCH",
          body: JSON.stringify({
            method: "TRANSFER",
            reference: `PAY-${Date.now()}`,
          }),
        }
      )

      // 🔥 AUTO DOWNLOAD RECEIPT
      if (data.receipt?.base64) {
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
        link.download = data.receipt.fileName
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

  // ================= FILTER =================
  const filtered =
    filterStatus === "ALL"
      ? invoices
      : invoices.filter((i) => i.status === filterStatus)

  const money = (v: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(v)

  // ================= UI =================
  if (loading) {
    return <div className="p-6">Loading billing data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing Dashboard</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* FILTER */}
      <div className="flex gap-2">
        {["ALL", "PAID", "UNPAID", "OVERDUE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-2 rounded-lg border ${
              filterStatus === f
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
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
                  {new Date(inv.dueDate).toLocaleDateString()}
                </td>

                <td className="p-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => downloadInvoicePDF(inv)}
                    className="bg-gray-900 text-white px-3 py-1 rounded hover:bg-black"
                  >
                    Invoice
                  </button>

                  {inv.status !== "PAID" && (
                    <button
                      onClick={() => handlePayInvoice(inv.id)}
                      disabled={payingId === inv.id}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-60"
                    >
                      {payingId === inv.id
                        ? "Processing..."
                        : "Mark Paid"}
                    </button>
                  )}

                  {inv.receipt && (
                    <button
                      onClick={() => downloadReceiptPDF(inv.receipt)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
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
          <div className="p-6 text-center text-gray-500">
            No invoices found
          </div>
        )}
      </div>
    </div>
  )
}

function Status({ status }: { status: string }) {
  const map: any = {
    PAID: "bg-green-100 text-green-700",
    UNPAID: "bg-yellow-100 text-yellow-700",
    OVERDUE: "bg-red-100 text-red-700",
  }

  return (
    <span className={`px-2 py-1 text-xs rounded ${map[status]}`}>
      {status}
    </span>
  )
}