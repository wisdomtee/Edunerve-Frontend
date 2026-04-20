"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import RoleGuard from "@/app/components/RoleGuard"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  API_BASE_URL,
  getAuthHeaders,
  getUser,
  type AuthUser,
} from "@/lib/api"

type DashboardStats = {
  schools: number
  students: number
  teachers: number
  classes: number
  results: number
  attendance: number
}

type ChildSummary = {
  studentName?: string
  className?: string
  averageScore?: number | null
  attendanceRate?: number | null
}

type AttendanceTrendItem = {
  date: string
  present: number
  absent: number
  late: number
}

type PerformanceSubjectItem = {
  subject: string
  averageScore: number
  count: number
}

type ClassDistributionItem = {
  name: string
  value: number
}

type PerformanceTrendItem = {
  month: string
  averageScore: number
}

type DashboardFilters = {
  selectedClass: string
  selectedTerm: string
  startDate: string
  endDate: string
  availableClasses: string[]
}

type AnalyticsResponse = {
  insights: string[]
  filters: DashboardFilters
  summary: DashboardStats
  charts: {
    attendanceTrend: AttendanceTrendItem[]
    performanceBySubject: PerformanceSubjectItem[]
    classDistribution: ClassDistributionItem[]
    performanceTrend: PerformanceTrendItem[]
  }
}

type TeacherSummaryResponse = {
  teacher: {
    id: number
    name: string
    email: string
    subject?: string | null
  }
  stats: {
    students: number
    classes: number
    results: number
    attendance: number
  }
  classes: Array<{
    id: number
    name: string
  }>
}

type TeacherDashboardChartsResponse = {
  charts: {
    attendanceTrend: AttendanceTrendItem[]
    performanceBySubject: PerformanceSubjectItem[]
    classDistribution: ClassDistributionItem[]
    performanceTrend: PerformanceTrendItem[]
  }
}

type QuickActionItem = {
  title: string
  description: string
  href: string
}

type ParentPortalChild = {
  id: number
  name: string
  studentId: string
  class?: {
    id: number
    name: string
  } | null
  averageScore?: number | null
  attendanceSummary?: {
    total: number
    present: number
    absent: number
    late: number
  }
}

type ParentPortalResponse = {
  parent?: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
  } | null
  children?: ParentPortalChild[]
}

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
]

const EMPTY_STATS: DashboardStats = {
  schools: 0,
  students: 0,
  teachers: 0,
  classes: 0,
  results: 0,
  attendance: 0,
}

const hasAnalyticsAccess = (user: AuthUser | null): boolean => {
  if (!user) return false

  if (user.role === "SUPER_ADMIN") return true

  const candidates = [
    user.plan,
    user.subscriptionPlan,
    user.packageType,
    user.tier,
    user.subscription?.plan,
    user.school?.plan,
    user.school?.subscriptionPlan,
    user.schoolSubscription?.plan,
  ]

  const normalizedValues = candidates
    .filter(Boolean)
    .map((value) => String(value).trim().toUpperCase())

  if (
    normalizedValues.includes("PRO") ||
    normalizedValues.includes("PREMIUM")
  ) {
    return true
  }

  if (
    user.isPro === true ||
    user.hasProAccess === true ||
    user.canViewAnalytics === true
  ) {
    return true
  }

  return false
}

export default function DashboardHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [canViewAnalytics, setCanViewAnalytics] = useState(false)

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [childSummary, setChildSummary] = useState<ChildSummary>({})

  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>(
    []
  )
  const [performanceBySubject, setPerformanceBySubject] = useState<
    PerformanceSubjectItem[]
  >([])
  const [classDistribution, setClassDistribution] = useState<
    ClassDistributionItem[]
  >([])
  const [performanceTrend, setPerformanceTrend] = useState<
    PerformanceTrendItem[]
  >([])
  const [insights, setInsights] = useState<string[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  useEffect(() => {
    const storedUser = getUser()

    if (!storedUser) {
      router.replace("/login")
      return
    }

    setUser(storedUser)
  }, [router])

  useEffect(() => {
    if (!user) return
    void loadDashboard(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedClass, selectedTerm, startDate, endDate])

  const fetchTeacherDashboardCharts = async () => {
    const candidateUrls = [
      `${API_BASE_URL}/teacher/dashboard`,
      `${API_BASE_URL}/teacher/teacher/dashboard`,
    ]

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: "include",
        })

        if (!res.ok) continue

        const data: TeacherDashboardChartsResponse = await res.json()
        return data
      } catch {
        continue
      }
    }

    return null
  }

  const loadDashboard = async (currentUser: AuthUser) => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()

      if (selectedClass) params.set("class", selectedClass)
      if (selectedTerm) params.set("term", selectedTerm)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const analyticsAllowed = hasAnalyticsAccess(currentUser)
      setCanViewAnalytics(analyticsAllowed)

      setStats(EMPTY_STATS)
      setAvailableClasses([])
      setAttendanceTrend([])
      setPerformanceBySubject([])
      setClassDistribution([])
      setPerformanceTrend([])
      setInsights([])

      if (analyticsAllowed) {
        try {
          const analyticsRes = await fetch(
            `${API_BASE_URL}/analytics/dashboard?${params.toString()}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          )

          if (analyticsRes.ok) {
            const analyticsData: AnalyticsResponse = await analyticsRes.json()

            setStats(analyticsData.summary || EMPTY_STATS)
            setAvailableClasses(analyticsData.filters?.availableClasses || [])
            setAttendanceTrend(analyticsData.charts?.attendanceTrend || [])
            setPerformanceBySubject(
              analyticsData.charts?.performanceBySubject || []
            )
            setClassDistribution(analyticsData.charts?.classDistribution || [])
            setPerformanceTrend(analyticsData.charts?.performanceTrend || [])
            setInsights(analyticsData.insights || [])
          } else {
            console.error(
              "Analytics endpoint unavailable or restricted:",
              analyticsRes.status,
              analyticsRes.statusText
            )
          }
        } catch (analyticsError) {
          console.error("Failed to load analytics dashboard:", analyticsError)
        }
      }

      if (currentUser.role === "TEACHER") {
        try {
          const teacherSummaryRes = await fetch(
            `${API_BASE_URL}/teachers/me/summary`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          )

          if (teacherSummaryRes.ok) {
            const teacherSummaryData: TeacherSummaryResponse =
              await teacherSummaryRes.json()

            setStats((prev) => ({
              ...prev,
              students: teacherSummaryData.stats?.students || 0,
              classes: teacherSummaryData.stats?.classes || 0,
              results: teacherSummaryData.stats?.results || 0,
              attendance: teacherSummaryData.stats?.attendance || 0,
            }))

            setAvailableClasses(
              Array.isArray(teacherSummaryData.classes)
                ? teacherSummaryData.classes.map((item) => item.name)
                : []
            )
          }
        } catch (teacherError) {
          console.error("Failed to load teacher summary:", teacherError)
        }

        if (analyticsAllowed) {
          try {
            const teacherChartsData = await fetchTeacherDashboardCharts()

            if (teacherChartsData?.charts) {
              setAttendanceTrend(teacherChartsData.charts.attendanceTrend || [])
              setPerformanceBySubject(
                teacherChartsData.charts.performanceBySubject || []
              )
              setClassDistribution(
                teacherChartsData.charts.classDistribution || []
              )
              setPerformanceTrend(
                teacherChartsData.charts.performanceTrend || []
              )
            }
          } catch (teacherChartError) {
            console.error(
              "Failed to load teacher dashboard charts:",
              teacherChartError
            )
          }
        }
      }

      if (currentUser.role === "PARENT") {
        try {
          const res = await fetch(`${API_BASE_URL}/parent-portal/children`, {
            headers: getAuthHeaders(),
            credentials: "include",
          })

          const data: ParentPortalResponse = res.ok ? await res.json() : {}
          const children = Array.isArray(data?.children) ? data.children : []

          if (children.length > 0) {
            const firstChild = children[0]

            setSelectedChildId(firstChild.id)

            const averageScore =
              firstChild.averageScore !== null &&
              firstChild.averageScore !== undefined
                ? Number(firstChild.averageScore)
                : null

            const attendanceRate =
              firstChild.attendanceSummary &&
              firstChild.attendanceSummary.total > 0
                ? Math.round(
                    (firstChild.attendanceSummary.present /
                      firstChild.attendanceSummary.total) *
                      100
                  )
                : null

            setChildSummary({
              studentName: firstChild.name,
              className: firstChild.class?.name || "",
              averageScore,
              attendanceRate,
            })

            setStats((prev) => ({
              ...prev,
              students: children.length,
            }))
          } else {
            setSelectedChildId(null)
            setChildSummary({})
          }
        } catch (parentError) {
          console.error("Parent dashboard error:", parentError)
          setSelectedChildId(null)
          setChildSummary({})
        }
      }
    } catch (err: any) {
      console.error("Dashboard load error:", err)
      setError(err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const cards = useMemo(() => {
    if (!user) return []

    if (user.role === "SUPER_ADMIN") {
      return [
        {
          title: "Total Schools",
          value: stats.schools,
          href: "/dashboard/schools",
        },
        {
          title: "Platform Students",
          value: stats.students,
          href: "/dashboard/schools",
        },
        {
          title: "Platform Teachers",
          value: stats.teachers,
          href: "/dashboard/schools",
        },
        {
          title: "Platform Classes",
          value: stats.classes,
          href: "/dashboard/schools",
        },
      ]
    }

    if (user.role === "SCHOOL_ADMIN") {
      return [
        {
          title: "Students",
          value: stats.students,
          href: "/dashboard/students",
        },
        {
          title: "Teachers",
          value: stats.teachers,
          href: "/dashboard/teachers",
        },
        {
          title: "Classes",
          value: stats.classes,
          href: "/dashboard/classes",
        },
        {
          title: "Results",
          value: stats.results,
          href: "/dashboard/results",
        },
      ]
    }

    if (user.role === "TEACHER") {
      return [
        {
          title: "Students",
          value: stats.students,
          href: "/dashboard/students",
        },
        {
          title: "Classes",
          value: stats.classes,
          href: "/dashboard/classes",
        },
        {
          title: "Results",
          value: stats.results,
          href: "/dashboard/results",
        },
        {
          title: "Attendance",
          value: stats.attendance,
          href: "/dashboard/attendance",
        },
      ]
    }

    return [
      {
        title: "My Child",
        value: childSummary.studentName || "-",
        href: "/dashboard/parents",
      },
      {
        title: "Results",
        value: stats.results,
        href: selectedChildId
          ? `/dashboard/students/${selectedChildId}/report`
          : "/dashboard/parents",
      },
      {
        title: "Attendance",
        value:
          childSummary.attendanceRate !== null &&
          childSummary.attendanceRate !== undefined
            ? `${childSummary.attendanceRate}%`
            : "-",
        href: "/dashboard/parents",
      },
      {
        title: "Average Score",
        value:
          childSummary.averageScore !== null &&
          childSummary.averageScore !== undefined
            ? `${childSummary.averageScore}%`
            : "-",
        href: selectedChildId
          ? `/dashboard/students/${selectedChildId}/report`
          : "/dashboard/parents",
      },
    ]
  }, [user, stats, childSummary, selectedChildId])

  const schoolAdminQuickActions: QuickActionItem[] = [
    {
      title: "Manage Students",
      description: "Create, update and review student records quickly.",
      href: "/dashboard/students",
    },
    {
      title: "Manage Teachers",
      description: "View staff, edit teacher details and keep records organized.",
      href: "/dashboard/teachers",
    },
    {
      title: "Manage Classes",
      description: "Set up class groups, assign students and organize structure.",
      href: "/dashboard/classes",
    },
    {
      title: "Upload Results",
      description: "Review or upload term performance records for students.",
      href: "/dashboard/results",
    },
    {
      title: "Fees Management",
      description: "Create invoices, track payments, and manage school fees.",
      href: "/dashboard/fees",
    },
  ]

  const schoolAdminActionNotes = [
    {
      title: "Attendance follow-up",
      value:
        stats.attendance > 0
          ? `${stats.attendance} attendance records in the system`
          : "No attendance records yet",
      bg: "bg-amber-50",
      text: "text-amber-800",
      sub: "Check for missing entries and absent students.",
    },
    {
      title: "Academic review",
      value:
        stats.results > 0
          ? `${stats.results} result records available`
          : "No results uploaded yet",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      sub: "Monitor performance trends and pending uploads.",
    },
    {
      title: "School capacity",
      value:
        stats.students > 0
          ? `${stats.students} students across ${stats.classes} classes`
          : "No students/classes yet",
      bg: "bg-purple-50",
      text: "text-purple-800",
      sub: "Keep class allocation and staffing balanced.",
    },
  ]

  const schoolAdminTopInsights = insights.slice(0, 3)

  const teacherQuickActions: QuickActionItem[] = [
    {
      title: "Mark Attendance",
      description: "Record daily classroom attendance and follow up quickly.",
      href: "/dashboard/attendance",
    },
    {
      title: "Upload Results",
      description: "Enter and review student scores for your subjects.",
      href: "/dashboard/results",
    },
    {
      title: "View Students",
      description: "Access student records and track classroom performance.",
      href: "/dashboard/students",
    },
    {
      title: "View Classes",
      description: "See your classes and monitor class-level activity.",
      href: "/dashboard/classes",
    },
  ]

  const teacherFocusCards = [
    {
      title: "Attendance Reminder",
      value:
        stats.attendance > 0
          ? `${stats.attendance} attendance records submitted`
          : "No attendance records yet",
      bg: "bg-amber-50",
      text: "text-amber-800",
      sub: "Ensure all classes are marked before the day ends.",
    },
    {
      title: "Result Progress",
      value:
        stats.results > 0
          ? `${stats.results} result records entered`
          : "No results uploaded yet",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      sub: "Keep score uploads current for timely review.",
    },
    {
      title: "Class Coverage",
      value:
        stats.classes > 0
          ? `${stats.classes} active classes, ${stats.students} students`
          : "No assigned classes yet",
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      sub: "Track participation and classroom performance trends.",
    },
  ]

  const teacherTopInsights =
    canViewAnalytics && insights.length > 0
      ? insights.slice(0, 3)
      : [
          "Mark attendance early so absent students can be flagged quickly.",
          "Upload results regularly to keep academic progress up to date.",
          "Review class performance trends to identify struggling students.",
        ]

  if (loading) {
    return (
      <RoleGuard
        allowedRoles={["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PARENT"]}
      >
        <div className="p-6">Loading dashboard...</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PARENT"]}
    >
      <div className="space-y-6">
        <section
          className={`rounded-2xl border p-6 shadow-sm ${
            user?.role === "SCHOOL_ADMIN"
              ? "border-blue-100 bg-gradient-to-r from-blue-700 to-blue-500 text-white"
              : user?.role === "TEACHER"
              ? "border-indigo-100 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white"
              : "bg-white"
          }`}
        >
          <h1
            className={`text-3xl font-bold ${
              user?.role === "SCHOOL_ADMIN" || user?.role === "TEACHER"
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>

          <p
            className={`mt-2 ${
              user?.role === "SCHOOL_ADMIN"
                ? "text-blue-100"
                : user?.role === "TEACHER"
                ? "text-indigo-100"
                : "text-gray-600"
            }`}
          >
            {user?.role === "SUPER_ADMIN" &&
              "Monitor schools and platform activity from one place."}
            {user?.role === "SCHOOL_ADMIN" &&
              "Manage students, teachers, classes, attendance, results, and daily school operations from one central dashboard."}
            {user?.role === "TEACHER" &&
              "Manage your classes, mark attendance, upload results, and follow classroom performance from one workspace."}
            {user?.role === "PARENT" &&
              "Follow your child’s academic progress and attendance."}
          </p>

          {user?.role === "SCHOOL_ADMIN" && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/students"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Manage Students
              </Link>
              <Link
                href="/dashboard/teachers"
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Manage Teachers
              </Link>
              <Link
                href="/dashboard/results"
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Review Results
              </Link>
              <Link
                href="/dashboard/fees"
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Fees Management
              </Link>
            </div>
          )}

          {user?.role === "TEACHER" && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/attendance"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Mark Attendance
              </Link>
              <Link
                href="/dashboard/results"
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Upload Results
              </Link>
              <Link
                href="/dashboard/classes"
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Classes
              </Link>
            </div>
          )}

          {error && (
            <p
              className={`mt-3 ${
                user?.role === "SCHOOL_ADMIN" || user?.role === "TEACHER"
                  ? "text-red-100"
                  : "text-red-600"
              }`}
            >
              {error}
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">All Classes</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">All Terms</option>
                <option value="1">1st Term</option>
                <option value="2">2nd Term</option>
                <option value="3">3rd Term</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <button
                onClick={() => {
                  setSelectedClass("")
                  setSelectedTerm("")
                  setStartDate("")
                  setEndDate("")
                }}
                className="rounded-xl bg-gray-900 px-5 py-3 text-white"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {canViewAnalytics ? (
          insights.length > 0 && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">Insights</h3>

              <div className="mt-4 space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-blue-50 p-4 text-sm text-gray-700"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </section>
          )
        ) : (
          user?.role === "SCHOOL_ADMIN" && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Advanced Analytics
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Upgrade to Pro to unlock insights, attendance trends, subject
                performance, class distribution, and advanced academic
                reporting.
              </p>

              <div className="mt-5">
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </section>
          )
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {card.value}
              </h2>
              <p className="mt-3 text-sm text-blue-600">Open</p>
            </Link>
          ))}
        </section>

        {user?.role === "SCHOOL_ADMIN" && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {schoolAdminActionNotes.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl p-5 shadow-sm ${item.bg}`}
                >
                  <p className={`text-sm font-semibold ${item.text}`}>
                    {item.title}
                  </p>
                  <h3 className={`mt-3 text-xl font-bold ${item.text}`}>
                    {item.value}
                  </h3>
                  <p className={`mt-2 text-sm ${item.text} opacity-80`}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Admin Quick Actions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Jump straight into your most important school tasks.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {schoolAdminQuickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <h4 className="font-semibold text-gray-900">
                        {action.title}
                      </h4>
                      <p className="mt-2 text-sm text-gray-600">
                        {action.description}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-blue-600">
                        Open
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  School Admin Focus
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Priority observations from your current data.
                </p>

                <div className="mt-5 space-y-3">
                  {schoolAdminTopInsights.length > 0 ? (
                    schoolAdminTopInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700"
                      >
                        {insight}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Monitor daily attendance submissions and follow up on
                        absent students quickly.
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Review result uploads regularly so parents and teachers
                        stay aligned.
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Keep class distribution balanced as enrollment grows.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {user?.role === "TEACHER" && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {teacherFocusCards.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl p-5 shadow-sm ${item.bg}`}
                >
                  <p className={`text-sm font-semibold ${item.text}`}>
                    {item.title}
                  </p>
                  <h3 className={`mt-3 text-xl font-bold ${item.text}`}>
                    {item.value}
                  </h3>
                  <p className={`mt-2 text-sm ${item.text} opacity-80`}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Teacher Quick Actions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Keep classroom tasks moving smoothly throughout the day.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {teacherQuickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
                    >
                      <h4 className="font-semibold text-gray-900">
                        {action.title}
                      </h4>
                      <p className="mt-2 text-sm text-gray-600">
                        {action.description}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-indigo-600">
                        Open
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Teaching Focus
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Key reminders and observations for your classroom workflow.
                </p>

                <div className="mt-5 space-y-3">
                  {teacherTopInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-700"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Quick Summary
            </h3>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-600">Schools</p>
                <h4 className="text-xl font-bold text-blue-700">
                  {stats.schools}
                </h4>
              </div>
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-600">Students</p>
                <h4 className="text-xl font-bold text-green-700">
                  {stats.students}
                </h4>
              </div>
              <div className="rounded-xl bg-yellow-50 p-4">
                <p className="text-sm text-gray-600">Results</p>
                <h4 className="text-xl font-bold text-yellow-700">
                  {stats.results}
                </h4>
              </div>
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-sm text-gray-600">Attendance</p>
                <h4 className="text-xl font-bold text-purple-700">
                  {stats.attendance}
                </h4>
              </div>
            </div>
          </div>

          {!canViewAnalytics && user?.role === "SCHOOL_ADMIN" ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Analytics Locked
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Your current plan includes core dashboard access. Upgrade to Pro
                to unlock visual analytics and deeper reporting.
              </p>
              <div className="mt-5">
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Dashboard Status
              </h3>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div className="rounded-xl bg-slate-50 p-4">
                  Core dashboard modules are active and ready for daily use.
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  Filters can be used to refine the reporting period and class
                  focus.
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  Charts and insights will display according to your account
                  access level.
                </div>
              </div>
            </div>
          )}
        </section>

        {canViewAnalytics && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Attendance Trend
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Daily attendance status from real records
                </p>
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="present"
                        fill="#16a34a"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="absent"
                        fill="#ef4444"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="late"
                        fill="#f59e0b"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Performance Trend
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Monthly average score from real result records
                </p>
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#2563eb"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Class Distribution
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Student population by class
                </p>
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {classDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Subject Performance
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Average score by subject
                </p>
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceBySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="averageScore"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chart Notes
                </h3>
                <div className="mt-4 space-y-4 text-sm text-gray-600">
                  <div className="rounded-xl bg-slate-50 p-4">
                    Attendance chart now uses real attendance records.
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    Performance trend now uses monthly average result scores.
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    Class distribution now uses real student counts by class.
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    Subject performance now uses real average score by subject.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Analytics Access
                </h3>
                <div className="mt-4 space-y-4 text-sm text-gray-600">
                  <div className="rounded-xl bg-green-50 p-4 text-green-800">
                    Advanced analytics is active for this account.
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    Use filters above to narrow results by class, term, and date
                    range.
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    If a chart is empty, it usually means there is no matching
                    data for the selected filters yet.
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {user?.role === "SUPER_ADMIN" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Platform Overview
              </h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b pb-2">
                  <span>Schools</span>
                  <span className="font-semibold text-gray-900">
                    {stats.schools}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Students</span>
                  <span className="font-semibold text-gray-900">
                    {stats.students}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Teachers</span>
                  <span className="font-semibold text-gray-900">
                    {stats.teachers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Classes</span>
                  <span className="font-semibold text-gray-900">
                    {stats.classes}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/dashboard/schools"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  Manage Schools
                </Link>
              </div>
            </div>
          </section>
        )}

        {user?.role === "SCHOOL_ADMIN" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                School Overview
              </h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b pb-2">
                  <span>Students</span>
                  <span className="font-semibold text-gray-900">
                    {stats.students}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Teachers</span>
                  <span className="font-semibold text-gray-900">
                    {stats.teachers}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Classes</span>
                  <span className="font-semibold text-gray-900">
                    {stats.classes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Results</span>
                  <span className="font-semibold text-gray-900">
                    {stats.results}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/dashboard/students"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  Manage Students
                </Link>
                <Link
                  href="/dashboard/teachers"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  Manage Teachers
                </Link>
                <Link
                  href="/dashboard/classes"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  Manage Classes
                </Link>
                <Link
                  href="/dashboard/results"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  View Results
                </Link>
                <Link
                  href="/dashboard/fees"
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-white"
                >
                  Fees Management
                </Link>
              </div>
            </div>
          </section>
        )}

        {user?.role === "PARENT" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Child Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b pb-2">
                  <span>Name</span>
                  <span className="font-semibold text-gray-900">
                    {childSummary.studentName || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Class</span>
                  <span className="font-semibold text-gray-900">
                    {childSummary.className || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Average Score</span>
                  <span className="font-semibold text-gray-900">
                    {childSummary.averageScore ?? "-"}
                    {childSummary.averageScore !== null &&
                    childSummary.averageScore !== undefined
                      ? "%"
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance Rate</span>
                  <span className="font-semibold text-gray-900">
                    {childSummary.attendanceRate ?? "-"}
                    {childSummary.attendanceRate !== null &&
                    childSummary.attendanceRate !== undefined
                      ? "%"
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/dashboard/parents"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white"
                >
                  View My Child
                </Link>

                <Link
                  href={
                    selectedChildId
                      ? `/dashboard/students/${selectedChildId}/report`
                      : "/dashboard/parents"
                  }
                  className={`rounded-xl px-4 py-3 text-white ${
                    selectedChildId
                      ? "bg-blue-600"
                      : "pointer-events-none cursor-not-allowed bg-gray-400"
                  }`}
                >
                  View My Result
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </RoleGuard>
  )
}