"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/auth"
import RoleGuard from "@/app/components/RoleGuard"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

type AuthUser = {
  id?: number | string
  name?: string
  email?: string
  role?: UserRole | string
  schoolId?: number | string | null
}

type ChildSummary = {
  name: string
  className: string
  averageScore: number | null
  attendanceRate: number | null
  totalResults: number
  totalAttendance: number
}

type RiskLevel = "low" | "medium" | "high"

type RiskSignal = {
  level: RiskLevel
  title: string
  message: string
}

type ParentRiskResponse = {
  student?: {
    id?: number
    name?: string
  } | null
  overallRisk: RiskLevel
  averageScore: number | null
  attendanceRate: number | null
  weakSubjects: Array<{
    subject: string
    averageScore: number
  }>
  signals: RiskSignal[]
  recommendations: string[]
}

type ResultItem = {
  id?: number
  score?: number
  subject?: { name?: string }
  subjectName?: string
  subjectTitle?: string
  createdAt?: string
  student?: {
    name?: string
    class?: { name?: string; title?: string }
    className?: string
  }
}

type AttendanceItem = {
  id?: number
  status?: string
  date?: string
  student?: {
    name?: string
    class?: { name?: string; title?: string }
    className?: string
  }
}

type ParentChildResponse = {
  student?: {
    id?: number
    name?: string
    class?: { name?: string; title?: string }
    className?: string
  } | null
  results?: ResultItem[]
  attendance?: AttendanceItem[]
}

function normalizeUser(rawUser: any): AuthUser {
  return {
    ...rawUser,
    id:
      rawUser?.id !== undefined && rawUser?.id !== null && rawUser?.id !== ""
        ? Number(rawUser.id)
        : undefined,
    schoolId:
      rawUser?.schoolId !== undefined &&
      rawUser?.schoolId !== null &&
      rawUser?.schoolId !== ""
        ? Number(rawUser.schoolId)
        : null,
  }
}

export default function ParentChildPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [summary, setSummary] = useState<ChildSummary>({
    name: "",
    className: "",
    averageScore: null,
    attendanceRate: null,
    totalResults: 0,
    totalAttendance: 0,
  })

  const [results, setResults] = useState<ResultItem[]>([])
  const [attendance, setAttendance] = useState<AttendanceItem[]>([])
  const [overallRisk, setOverallRisk] = useState<RiskLevel>("low")
  const [riskSignals, setRiskSignals] = useState<RiskSignal[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    const storedUser = getUser()

    if (!storedUser) {
      router.replace("/login")
      return
    }

    const normalizedUser = normalizeUser(storedUser)
    setUser(normalizedUser)
    loadChildData()
  }, [router])

  const loadChildData = async () => {
    try {
      setLoading(true)
      setError("")

      const [childRes, riskRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/parent-child`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/analytics/parent-risk`, {
          headers: getAuthHeaders(),
        }),
      ])

      if (!childRes.ok) {
        throw new Error("Failed to load child data")
      }

      const childData: ParentChildResponse = await childRes.json()
      const riskData: ParentRiskResponse | null = riskRes.ok
        ? await riskRes.json()
        : null

      const resultList = Array.isArray(childData.results) ? childData.results : []
      const attendanceList = Array.isArray(childData.attendance)
        ? childData.attendance
        : []

      setResults(resultList)
      setAttendance(attendanceList)

      const student = childData.student

      const averageScore =
        resultList.length > 0
          ? Math.round(
              resultList.reduce(
                (sum: number, item: ResultItem) => sum + Number(item.score || 0),
                0
              ) / resultList.length
            )
          : null

      const presentCount = attendanceList.filter(
        (item: AttendanceItem) =>
          String(item.status || "").toUpperCase() === "PRESENT"
      ).length

      const attendanceRate =
        attendanceList.length > 0
          ? Math.round((presentCount / attendanceList.length) * 100)
          : null

      setSummary({
        name: student?.name || "My Child",
        className:
          student?.class?.name ||
          student?.class?.title ||
          student?.className ||
          "-",
        averageScore,
        attendanceRate,
        totalResults: resultList.length,
        totalAttendance: attendanceList.length,
      })

      setOverallRisk(riskData?.overallRisk || "low")
      setRiskSignals(Array.isArray(riskData?.signals) ? riskData.signals : [])
      setRecommendations(
        Array.isArray(riskData?.recommendations)
          ? riskData.recommendations
          : []
      )
    } catch (err: any) {
      setError(err.message || "Failed to load child data")
    } finally {
      setLoading(false)
    }
  }

  const subjectPerformance = useMemo(() => {
    const subjectMap: Record<string, { total: number; count: number }> = {}

    for (const item of results) {
      const subjectName =
        item.subject?.name || item.subjectName || item.subjectTitle || "Unknown"

      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = { total: 0, count: 0 }
      }

      subjectMap[subjectName].total += Number(item.score || 0)
      subjectMap[subjectName].count += 1
    }

    return Object.entries(subjectMap).map(([subject, value]) => ({
      subject,
      averageScore:
        value.count > 0 ? Math.round(value.total / value.count) : 0,
    }))
  }, [results])

  const attendanceTrend = useMemo(() => {
    const grouped: Record<
      string,
      { label: string; present: number; absent: number; late: number }
    > = {}

    for (const item of attendance) {
      const rawDate = item.date ? new Date(item.date) : null
      const label = rawDate
        ? rawDate.toISOString().split("T")[0]
        : "Unknown Date"

      if (!grouped[label]) {
        grouped[label] = { label, present: 0, absent: 0, late: 0 }
      }

      const status = String(item.status || "").toUpperCase()

      if (status === "PRESENT") grouped[label].present += 1
      else if (status === "ABSENT") grouped[label].absent += 1
      else if (status === "LATE") grouped[label].late += 1
    }

    return Object.values(grouped)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-7)
  }, [attendance])

  const insights = useMemo(() => {
    const items: string[] = []

    if (
      summary.averageScore !== null &&
      summary.averageScore !== undefined &&
      summary.averageScore < 50
    ) {
      items.push("⚠️ Average score is below 50%. Extra support may be needed.")
    }

    if (
      summary.attendanceRate !== null &&
      summary.attendanceRate !== undefined &&
      summary.attendanceRate < 75
    ) {
      items.push(
        "⚠️ Attendance rate is low. Attendance should be monitored closely."
      )
    }

    if (subjectPerformance.length > 0) {
      const sorted = [...subjectPerformance].sort(
        (a, b) => a.averageScore - b.averageScore
      )
      const weakest = sorted[0]
      const strongest = sorted[sorted.length - 1]

      if (strongest) {
        items.push(`🏆 Strongest subject: ${strongest.subject}.`)
      }

      if (weakest) {
        items.push(`📉 Weakest subject: ${weakest.subject}.`)
      }
    }

    return items
  }, [summary, subjectPerformance])

  if (loading) {
    return (
      <RoleGuard allowedRoles={["PARENT"]}>
        <div className="p-6">Loading child dashboard...</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={["PARENT"]}>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">{summary.name}</h1>
          <p className="mt-2 text-gray-600">
            Parent overview of academic progress and attendance.
          </p>
          {error && <p className="mt-3 text-red-600">{error}</p>}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Class</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {summary.className || "-"}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {summary.averageScore ?? "-"}
              {summary.averageScore !== null ? "%" : ""}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {summary.attendanceRate ?? "-"}
              {summary.attendanceRate !== null ? "%" : ""}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Results</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {summary.totalResults}
            </h2>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Risk Detection
            </h3>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                overallRisk === "high"
                  ? "bg-red-100 text-red-700"
                  : overallRisk === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {overallRisk.toUpperCase()} RISK
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {riskSignals.length > 0 ? (
              riskSignals.map((signal, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 ${
                    signal.level === "high"
                      ? "bg-red-50"
                      : signal.level === "medium"
                      ? "bg-yellow-50"
                      : "bg-green-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {signal.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {signal.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-green-50 p-4 text-sm text-gray-700">
                No immediate risk detected.
              </div>
            )}
          </div>
        </section>

        {recommendations.length > 0 && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Recommendations
            </h3>

            <div className="mt-4 space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-green-50 p-4 text-sm text-gray-700"
                >
                  {rec}
                </div>
              ))}
            </div>
          </section>
        )}

        {insights.length > 0 && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">Insights</h3>
            <div className="mt-4 space-y-3">
              {insights.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-blue-50 p-4 text-sm text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Subject Performance
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Average score by subject
            </p>
            <div className="mt-6 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Attendance Trend
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Recent attendance history
            </p>
            <div className="mt-6 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" strokeWidth={3} />
                  <Line type="monotone" dataKey="absent" strokeWidth={3} />
                  <Line type="monotone" dataKey="late" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Link
            href="/dashboard/results"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h3 className="text-xl font-semibold text-gray-900">
              View Results
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Open detailed academic results and scores.
            </p>
          </Link>

          <Link
            href="/dashboard/attendance"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h3 className="text-xl font-semibold text-gray-900">
              View Attendance
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Open detailed attendance records.
            </p>
          </Link>
        </section>
      </div>
    </RoleGuard>
  )
}