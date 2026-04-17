"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, getToken } from "@/lib/api"

type AppUser = {
  id?: number | string
  name?: string
  email?: string
  role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
  schoolId?: number | null
  mustChangePassword?: boolean
}

export default function SuperAdminDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AppUser | null>(null)

  const [stats, setStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    activeSubscriptions: 0,
  })

  useEffect(() => {
    const token = getToken()
    const currentUser = getUser()

    if (!token || !currentUser) {
      router.replace("/login")
      return
    }

    if (currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
      return
    }

    setUser(currentUser)

    const timer = setTimeout(() => {
      setStats({
        totalSchools: 12,
        totalStudents: 540,
        totalTeachers: 78,
        activeSubscriptions: 9,
      })
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Super Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome back, {user?.name || "Admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Schools" value={stats.totalSchools} />
        <Card title="Total Students" value={stats.totalStudents} />
        <Card title="Total Teachers" value={stats.totalTeachers} />
        <Card title="Active Subscriptions" value={stats.activeSubscriptions} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/dashboard/schools")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Manage Schools
          </button>

          <button
            onClick={() => router.push("/dashboard/subscriptions")}
            className="rounded-lg bg-purple-600 px-4 py-2 text-white"
          >
            Subscriptions
          </button>

          <button
            onClick={() => router.push("/dashboard/super-admin/billing")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white"
          >
            Billing
          </button>

          <button
            onClick={() => router.push("/dashboard/super-admin/invoices/create")}
            className="rounded-lg bg-orange-600 px-4 py-2 text-white"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}