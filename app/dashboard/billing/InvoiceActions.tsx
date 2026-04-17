"use client"

import { useState } from "react"
import {
  downloadInvoicePDF,
  downloadReceiptPDF,
} from "@/app/lib/billingPdf"

type InvoicePayload = {
  id?: number
  invoiceNumber?: string
  amount?: number
  total?: number
  tax?: number
  discount?: number
  status?: string
  createdAt?: string
  dueDate?: string
  issueDate?: string
  paymentReference?: string
  planType?: string
  billingCycle?: string
  description?: string
  school?: {
    id?: number
    name?: string
    email?: string
    plan?: string
    subscriptionStatus?: string
    subscriptionEnd?: string
  } | null
  receipt?: {
    receiptNumber?: string
    amount?: number
    paymentMethod?: string
    paymentDate?: string
    notes?: string
  } | null
  [key: string]: any
}

type InvoiceData = {
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

type ReceiptData = {
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

type Props = {
  invoice: InvoicePayload
}

function toBillingPdfInvoice(invoice: InvoicePayload): InvoiceData {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id || "N/A"}`,
    amount: Number(invoice.amount || invoice.total || 0),
    total: Number(invoice.total || invoice.amount || 0),
    tax: Number(invoice.tax || 0),
    discount: Number(invoice.discount || 0),
    status: String(invoice.status || "PENDING"),
    planType: String(invoice.planType || invoice.school?.plan || "NORMAL"),
    issueDate: String(
      invoice.issueDate || invoice.createdAt || new Date().toISOString()
    ),
    dueDate: String(invoice.dueDate || new Date().toISOString()),
    paymentReference: invoice.paymentReference || undefined,
    description: invoice.description || undefined,
    school: {
      id: invoice.school?.id,
      name: invoice.school?.name || "School",
      email: invoice.school?.email || undefined,
    },
  }
}

function toReceiptPdfData(invoice: InvoicePayload): ReceiptData {
  return {
    receiptNumber:
      invoice.receipt?.receiptNumber || `RCPT-${invoice.id || "N/A"}`,
    invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id || "N/A"}`,
    amount: Number(
      invoice.receipt?.amount || invoice.total || invoice.amount || 0
    ),
    paymentMethod: String(invoice.receipt?.paymentMethod || "TRANSFER"),
    paymentDate: String(
      invoice.receipt?.paymentDate ||
        invoice.createdAt ||
        new Date().toISOString()
    ),
    paymentReference: invoice.paymentReference || undefined,
    school: {
      name: invoice.school?.name || "School",
      email: invoice.school?.email || undefined,
    },
    notes: invoice.receipt?.notes || undefined,
  }
}

async function printInvoicePdf(invoice: InvoicePayload) {
  await downloadInvoicePDF(toBillingPdfInvoice(invoice))
}

async function sendInvoiceEmail(invoice: InvoicePayload) {
  const schoolEmail = invoice.school?.email?.trim()

  if (!schoolEmail) {
    throw new Error("This invoice has no school email address to send to.")
  }

  return {
    ok: true,
    message: `Email sending is not wired up yet. Recipient ready: ${schoolEmail}`,
  }
}

export default function InvoiceActions({ invoice }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const hasReceipt = Boolean(invoice.receipt)

  const runAction = async (
    action: "download" | "print" | "email" | "receipt"
  ) => {
    try {
      setLoadingAction(action)
      setMessage("")
      setError("")

      if (action === "download") {
        await downloadInvoicePDF(toBillingPdfInvoice(invoice))
        setMessage("Invoice PDF downloaded successfully.")
        return
      }

      if (action === "print") {
        await printInvoicePdf(invoice)
        setMessage(
          "Invoice PDF downloaded. Open it and print from your browser or PDF viewer."
        )
        return
      }

      if (action === "email") {
        const result = await sendInvoiceEmail(invoice)
        setMessage(result?.message || "Invoice email sent successfully.")
        return
      }

      if (action === "receipt") {
        if (!invoice.receipt) {
          throw new Error("No receipt is available for this invoice yet.")
        }

        await downloadReceiptPDF(toReceiptPdfData(invoice))
        setMessage("Receipt PDF downloaded successfully.")
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => runAction("download")}
          disabled={loadingAction !== null}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "download" ? "Downloading..." : "Download PDF"}
        </button>

        <button
          onClick={() => runAction("print")}
          disabled={loadingAction !== null}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "print" ? "Preparing..." : "Print Invoice"}
        </button>

        <button
          onClick={() => runAction("email")}
          disabled={loadingAction !== null}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "email" ? "Sending..." : "Email Invoice"}
        </button>

        {hasReceipt && (
          <button
            onClick={() => runAction("receipt")}
            disabled={loadingAction !== null}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "receipt"
              ? "Downloading..."
              : "Download Receipt"}
          </button>
        )}
      </div>

      {message ? (
        <p className="mt-3 text-sm text-green-600">{message}</p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  )
}