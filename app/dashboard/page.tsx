"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type Stats = {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
}

type WeekData = {
  date: string
  present: number
}

type Student = {
  id: string
  name: string
  studentId: string
  school?: {
    name: string
  }
  classItem?: {
    name: string
  }
}

export default function DashboardPage() {
  const router = useRouter()

  const [stats, setStats] = useState<Stats | null>(null)
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const headers = getAuthHeaders()

      const [statsRes, weekRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/dashboard/attendance-week`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/students?search=&page=1&limit=5`, {
          headers,
        }),
      ])

      if (
        statsRes.status === 401 ||
        weekRes.status === 401 ||
        studentsRes.status === 401
      ) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
        return
      }

      const statsData = await statsRes.json()
      const weekDataRes = await weekRes.json()
      const studentsData = await studentsRes.json()

      if (!statsRes.ok) {
        throw new Error(statsData.message || "Failed to fetch stats")
      }

      if (!weekRes.ok) {
        throw new Error(weekDataRes.message || "Failed to fetch weekly attendance")
      }

      if (!studentsRes.ok) {
        throw new Error(studentsData.message || "Failed to fetch recent students")
      }

      setStats(statsData)
      setWeekData(Array.isArray(weekDataRes) ? weekDataRes : [])
      setRecentStudents(studentsData.students || [])
    } catch (error) {
      console.error("DASHBOARD ERROR:", error)
      alert("Dashboard failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Failed to load dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-500">
          Quick summary of attendance and student activity
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Total Students</p>
          <h2 className="text-3xl font-bold">{stats.totalStudents}</h2>
        </div>

        <div className="bg-green-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Present Today</p>
          <h2 className="text-3xl font-bold">{stats.presentToday}</h2>
        </div>

        <div className="bg-red-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Absent Today</p>
          <h2 className="text-3xl font-bold">{stats.absentToday}</h2>
        </div>

        <div className="bg-yellow-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Late Today</p>
          <h2 className="text-3xl font-bold">{stats.lateToday}</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Link
          href="/dashboard/students"
          className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition"
        >
          <h3 className="text-lg font-bold mb-2">Students</h3>
          <p className="text-gray-500">Manage student records and profiles</p>
        </Link>

        <Link
          href="/dashboard/attendance"
          className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition"
        >
          <h3 className="text-lg font-bold mb-2">Attendance</h3>
          <p className="text-gray-500">Mark and review daily attendance</p>
        </Link>

        <Link
          href="/dashboard/classes"
          className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition"
        >
          <h3 className="text-lg font-bold mb-2">Classes</h3>
          <p className="text-gray-500">Create and organize school classes</p>
        </Link>

        <Link
          href="/dashboard/schools"
          className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition"
        >
          <h3 className="text-lg font-bold mb-2">Schools</h3>
          <p className="text-gray-500">Manage school branches and details</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">Weekly Attendance</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="present" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">Recent Students</h2>

        {recentStudents.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Student ID</th>
                <th className="border p-2 text-left">School</th>
                <th className="border p-2 text-left">Class</th>
              </tr>
            </thead>

            <tbody>
              {recentStudents.map((student) => (
                <tr key={student.id}>
                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.studentId}</td>
                  <td className="border p-2">{student.school?.name || "-"}</td>
                  <td className="border p-2">{student.classItem?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}