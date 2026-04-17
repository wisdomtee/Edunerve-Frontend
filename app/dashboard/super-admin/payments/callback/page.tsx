"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

export default function CallbackPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState("Verifying payment...")

  useEffect(() => {
    const reference = params.get("reference")

    if (!reference) {
      setStatus("No reference found")
      return
    }

    const verify = async () => {
      const res = await fetch(`${API_BASE_URL}/payments/verify/${reference}`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (data.success) {
        setStatus("Payment successful. School upgraded 🎉")

        setTimeout(() => {
          router.push("/dashboard/super-admin/payments")
        }, 2000)
      } else {
        setStatus(data.message || "Verification failed")
      }
    }

    verify()
  }, [params, router])

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="bg-white p-6 rounded-xl border text-center">
        <h1 className="text-xl font-bold mb-2">Payment Status</h1>
        <p>{status}</p>
      </div>
    </div>
  )
}