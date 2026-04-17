"use client"

import { useState } from "react"
import {
  downloadInvoicePdf,
  printInvoicePdf,
  sendInvoiceEmail,
  InvoicePayload,
} from "@/lib/invoice"

type Props = {
  invoice: InvoicePayload
}

export default function InvoiceActions({ invoice }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const runAction = async (action: "download" | "print" | "email") => {
    try {
      setLoadingAction(action)
      setMessage("")
      setError("")

      if (action === "download") {
        await downloadInvoicePdf(invoice)
        setMessage("Invoice PDF downloaded successfully.")
      }

      if (action === "print") {
        await printInvoicePdf(invoice)
        setMessage("Invoice opened for printing.")
      }

      if (action === "email") {
        const result = await sendInvoiceEmail(invoice)
        setMessage(result?.message || "Invoice email sent successfully.")
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