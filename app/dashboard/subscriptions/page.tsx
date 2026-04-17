"use client"

import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"
import { useRouter } from "next/navigation"

type SubscriptionSchool = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionStart?: string | null
  subscriptionEnd?: string | null
  createdAt?: string
}

export default function SubscriptionsPage() {
  const router = useRouter()

  const [schools, setSchools] = useState<SubscriptionSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const user = getUser()

    if (!user || user.role !== "SUPER_ADMIN") {
      router.replace("/login")
      return
    }

    fetchSubscriptions()
  }, [router])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/subscriptions`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => [])

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch subscriptions")
      }

      setSchools(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Failed to load subscriptions")
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (schoolId: number, action: "activate-normal" | "activate-pro" | "expire") => {
    try {
      setActionLoadingId(schoolId)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/subscriptions/${schoolId}/${action}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update subscription")
      }

      setSuccess(data?.message || "Subscription updated successfully")
      await fetchSubscriptions()
    } catch (err: any) {
      setError(err.message || "Failed to update subscription")
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredSchools = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return schools

    return schools.filter((school) => {
      return (
        school.name?.toLowerCase().includes(q) ||
        school.email?.toLowerCase().includes(q) ||
        school.subscriptionPlan?.toLowerCase().includes(q) ||
        school.subscriptionStatus?.toLowerCase().includes(q)
      )
    })
  }, [schools, search])

  const normalCount = schools.filter((s) => s.subscriptionPlan === "NORMAL").length
  const proCount = schools.filter((s) => s.subscriptionPlan === "PRO").length
  const expiredCount = schools.filter((s) => s.subscriptionStatus === "expired").length

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <p className="text-gray-600">
          Manage school plans, upgrade schools, and control expiry
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Schools" value={schools.length} />
        <StatCard title="Normal Plan" value={normalCount} />
        <StatCard title="Pro Plan" value={proCount} />
        <StatCard title="Expired" value={expiredCount} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">All Subscriptions</h2>

          <input
            type="text"
            placeholder="Search school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 md:w-80"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading subscriptions...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No schools found
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">School</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">Plan</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">Start</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">End</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-800">{school.name}</td>
                    <td className="px-4 py-4 text-gray-600">{school.email || "-"}</td>
                    <td className="px-4 py-4 text-gray-600">{school.subscriptionPlan}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          school.subscriptionStatus === "active"
                            ? "bg-green-100 text-green-700"
                            : school.subscriptionStatus === "expired"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {school.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.subscriptionStart
                        ? new Date(school.subscriptionStart).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.subscriptionEnd
                        ? new Date(school.subscriptionEnd).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAction(school.id, "activate-normal")}
                          disabled={actionLoadingId === school.id}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Normal
                        </button>

                        <button
                          onClick={() => handleAction(school.id, "activate-pro")}
                          disabled={actionLoadingId === school.id}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                          Pro
                        </button>

                        <button
                          onClick={() => handleAction(school.id, "expire")}
                          disabled={actionLoadingId === school.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Expire
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  )
}