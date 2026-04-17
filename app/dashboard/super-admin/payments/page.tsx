"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Plan = {
  name: "NORMAL" | "PRO"
  amount: number
  durationInDays: number
  features: string[]
}

type School = {
  id: number
  name: string
  email?: string
  subscriptionPlan?: string
}

type Payment = {
  id: number
  reference: string
  amount: number
  status: string
  plan: string
  createdAt: string
  school: {
    name: string
    email: string
  }
}

export default function SuperAdminPaymentsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchPlans()
    fetchSchools()
    fetchPayments()
  }, [])

  const fetchPlans = async () => {
    const res = await fetch(`${API_BASE_URL}/payments/plans`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json()
    if (data.success) setPlans(data.plans)
  }

  const fetchSchools = async () => {
    const res = await fetch(`${API_BASE_URL}/schools`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json()
    setSchools(Array.isArray(data) ? data : data.schools || [])
  }

  const fetchPayments = async () => {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json()
    if (data.success) setPayments(data.payments)
  }

  const handleSubscribe = async (plan: "NORMAL" | "PRO") => {
    if (!selectedSchoolId) {
      setMessage("Select a school first")
      return
    }

    try {
      setLoading(true)
      setMessage("")

      const res = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          schoolId: Number(selectedSchoolId),
          plan,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setMessage(data.message)
        return
      }

      // Redirect to Paystack
      window.location.href = data.authorizationUrl
    } catch (err) {
      setMessage("Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">

      <h1 className="text-2xl font-bold">Payments & Subscriptions</h1>

      {message && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {message}
        </div>
      )}

      {/* SELECT SCHOOL */}
      <div className="bg-white p-4 rounded-xl border">
        <label className="block mb-2 font-medium">Select School</label>
        <select
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value)}
          className="w-full border px-4 py-3 rounded-lg"
        >
          <option value="">Choose school</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name} ({school.subscriptionPlan || "Free"})
            </option>
          ))}
        </select>
      </div>

      {/* PLANS */}
      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="border rounded-xl p-6 bg-white shadow-sm">
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-3xl font-extrabold mb-3">
              ₦{plan.amount.toLocaleString()}
            </p>

            <ul className="mb-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
              disabled={loading}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>

      {/* PAYMENT HISTORY */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-bold mb-4">Payment History</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">School</th>
                <th className="p-2 border">Plan</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Reference</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.school.name}</td>
                  <td className="p-2 border">{p.plan}</td>
                  <td className="p-2 border">₦{p.amount}</td>
                  <td className="p-2 border">{p.status}</td>
                  <td className="p-2 border">{p.reference}</td>
                  <td className="p-2 border">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}