"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type Stats = {
  students: number
  teachers: number
  classes: number
  attendance: number
}

export default function AdminDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    classes: 0,
    attendance: 0,
  })

  useEffect(() => {
    const storedUser = getUser()

    if (!storedUser) {
      router.push("/login")
      return
    }

    if (storedUser.role !== "SCHOOL_ADMIN") {
      router.push("/login")
      return
    }

    setUser(storedUser)

    fetchStats()
  }, [router])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to load dashboard")
      }

      setStats({
        students: data.students || 0,
        teachers: data.teachers || 0,
        classes: data.classes || 0,
        attendance: data.attendance || 0,
      })
    } catch (error) {
      console.error("Dashboard error:", error)

      setStats({
        students: 0,
        teachers: 0,
        classes: 0,
        attendance: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          School Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.name || "Admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Students" value={stats.students} />
        <Card title="Teachers" value={stats.teachers} />
        <Card title="Classes" value={stats.classes} />
        <Card title="Attendance Today" value={stats.attendance} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/dashboard/students")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Manage Students
          </button>

          <button
            onClick={() => router.push("/dashboard/teachers")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white"
          >
            Manage Teachers
          </button>

          <button
            onClick={() => router.push("/dashboard/classes")}
            className="rounded-lg bg-purple-600 px-4 py-2 text-white"
          >
            Manage Classes
          </button>

          <button
            onClick={() => router.push("/dashboard/attendance")}
            className="rounded-lg bg-orange-600 px-4 py-2 text-white"
          >
            Attendance
          </button>

          <button
            onClick={() => router.push("/dashboard/fees")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
          >
            Fees Management
          </button>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  )
}