"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Save,
  Users,
  XCircle,
} from "lucide-react"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/auth"
import { getSelectedChild } from "@/lib/parent"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE"

type AppUser = {
  id?: number
  name?: string
  email?: string
  role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
  schoolId?: number | null
}

type ClassItem = {
  id: number
  name: string
  teacher?: {
    id: number
    name: string
  } | null
}

type Student = {
  id: number
  name: string
  studentId: string
  class?: {
    id: number
    name: string
  } | null
}

type AttendanceResponseItem = {
  studentId?: number
  status?: AttendanceStatus
  student?: {
    id?: number
  }
}

type ParentPortalChild = {
  id: number
  name: string
  studentId: string
  class?: {
    id: number
    name: string
  } | null
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

function getTodayLocalDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export default function AttendancePage() {
  const router = useRouter()

  const [user, setUser] = useState<AppUser | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate())
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [parentChildren, setParentChildren] = useState<ParentPortalChild[]>([])

  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.push("/login")
      return
    }

    setUser(currentUser)

    if (currentUser.role === "PARENT") {
      loadParentChildren()
    } else {
      loadClasses(currentUser)
    }
  }, [router])

  useEffect(() => {
    if (!user) return

    if (user.role === "PARENT") {
      const selectedChild = getSelectedChild()

      if (selectedChild?.id) {
        loadParentAttendance(selectedChild.id)
      } else {
        setStudents([])
        setAttendance({})
        setLoading(false)
      }
    } else {
      if (selectedClassId) {
        loadStudentsAndAttendance()
      } else {
        setStudents([])
        setAttendance({})
      }
    }
  }, [user, selectedClassId, selectedDate])

  const handleUnauthorized = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const loadParentChildren = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/parent-portal/children`, {
        headers: getAuthHeaders(),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data: ParentPortalResponse = await res.json()

      if (!res.ok) {
        throw new Error("Failed to load parent children")
      }

      const children = Array.isArray(data?.children) ? data.children : []
      setParentChildren(children)
    } catch (err: any) {
      console.error("LOAD PARENT CHILDREN ERROR:", err)
      setError(err.message || "Failed to load parent attendance")
    } finally {
      setLoading(false)
    }
  }

  const loadClasses = async (currentUser?: AppUser | null) => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const activeUser = currentUser || getUser()

      const res = await fetch(`${API_BASE_URL}/classes`, {
        headers: getAuthHeaders(),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch classes")
      }

      const classList = Array.isArray(data) ? data : data.classes || []

      setClasses(classList)

      if (classList.length > 0 && !selectedClassId) {
        setSelectedClassId(String(classList[0].id))
      }

      if (activeUser?.role === "TEACHER" && classList.length === 0) {
        setError("No classes assigned to you yet")
      }
    } catch (err: any) {
      console.error("LOAD CLASSES ERROR:", err)
      setError(err.message || "Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  const loadStudentsAndAttendance = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      if (!selectedClassId) {
        setStudents([])
        setAttendance({})
        return
      }

      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/class/${selectedClassId}/students`, {
          headers: getAuthHeaders(),
        }),
        fetch(
          `${API_BASE_URL}/attendance?date=${selectedDate}&classId=${selectedClassId}`,
          {
            headers: getAuthHeaders(),
          }
        ),
      ])

      if (studentsRes.status === 401 || attendanceRes.status === 401) {
        handleUnauthorized()
        return
      }

      const studentsData = await studentsRes.json()
      const attendanceData = await attendanceRes.json()

      if (!studentsRes.ok) {
        throw new Error(studentsData?.message || "Failed to fetch students")
      }

      if (!attendanceRes.ok) {
        throw new Error(attendanceData?.message || "Failed to fetch attendance")
      }

      const studentsList: Student[] = Array.isArray(studentsData)
        ? studentsData
        : studentsData.students || []

      const attendanceList: AttendanceResponseItem[] = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData.attendance || []

      const mapped: Record<string, AttendanceStatus> = {}

      attendanceList.forEach((item) => {
        const id = item.studentId ?? item.student?.id
        if (id && item.status) {
          mapped[String(id)] = item.status
        }
      })

      setStudents(studentsList)
      setAttendance(mapped)
    } catch (err: any) {
      console.error("LOAD STUDENTS/ATTENDANCE ERROR:", err)
      setError(err.message || "Failed to load attendance page")
    } finally {
      setLoading(false)
    }
  }

  const loadParentAttendance = async (selectedChildId: number) => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      let child = parentChildren.find(
        (item) => String(item.id) === String(selectedChildId)
      )

      if (!child) {
        const res = await fetch(`${API_BASE_URL}/parent-portal/children`, {
          headers: getAuthHeaders(),
        })

        if (res.status === 401) {
          handleUnauthorized()
          return
        }

        const data: ParentPortalResponse = await res.json()
        const children = Array.isArray(data?.children) ? data.children : []
        setParentChildren(children)

        child = children.find(
          (item) => String(item.id) === String(selectedChildId)
        )
      }

      if (!child) {
        setStudents([])
        setAttendance({})
        return
      }

      const classId = child.class?.id

      if (!classId) {
        setStudents([
          {
            id: child.id,
            name: child.name,
            studentId: child.studentId,
            class: child.class || null,
          },
        ])
        setAttendance({})
        return
      }

      const attendanceRes = await fetch(
        `${API_BASE_URL}/attendance?date=${selectedDate}&classId=${classId}`,
        {
          headers: getAuthHeaders(),
        }
      )

      if (attendanceRes.status === 401) {
        handleUnauthorized()
        return
      }

      const attendanceData = await attendanceRes.json()

      if (!attendanceRes.ok) {
        throw new Error(
          attendanceData?.message || "Failed to fetch parent attendance"
        )
      }

      const attendanceList: AttendanceResponseItem[] = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData.attendance || []

      const mapped: Record<string, AttendanceStatus> = {}

      attendanceList.forEach((item) => {
        const id = item.studentId ?? item.student?.id
        if (id && item.status) {
          mapped[String(id)] = item.status
        }
      })

      setStudents([
        {
          id: child.id,
          name: child.name,
          studentId: child.studentId,
          class: child.class || null,
        },
      ])

      setAttendance(mapped)
    } catch (err: any) {
      console.error("LOAD PARENT ATTENDANCE ERROR:", err)
      setError(err.message || "Failed to load parent attendance")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (studentId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [String(studentId)]: status,
    }))
  }

  const saveAttendance = async () => {
    try {
      setError("")
      setSuccess("")
      setSaving(true)

      if (!selectedDate) {
        throw new Error("Please select a date")
      }

      if (!selectedClassId) {
        throw new Error("Please select a class")
      }

      if (students.length === 0) {
        throw new Error("No students available in this class")
      }

      const records = students.map((student) => ({
        studentId: student.id,
        status: attendance[String(student.id)] || "PRESENT",
      }))

      const res = await fetch(`${API_BASE_URL}/attendance/mark-bulk`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          classId: Number(selectedClassId),
          records,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save attendance")
      }

      setSuccess(data.message || "Attendance saved successfully")
      await loadStudentsAndAttendance()
    } catch (err: any) {
      setError(err.message || "Failed to save attendance")
    } finally {
      setSaving(false)
    }
  }

  const isParent = user?.role === "PARENT"
  const canEditAttendance =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "SCHOOL_ADMIN" ||
    user?.role === "TEACHER"

  const selectedChild = isParent ? getSelectedChild() : null
  const selectedChildName =
    selectedChild?.name ||
    parentChildren.find((item) => item.id === selectedChild?.id)?.name ||
    ""

  const presentCount = useMemo(
    () =>
      students.filter(
        (student) => (attendance[String(student.id)] || "PRESENT") === "PRESENT"
      ).length,
    [students, attendance]
  )

  const absentCount = useMemo(
    () =>
      students.filter(
        (student) => (attendance[String(student.id)] || "PRESENT") === "ABSENT"
      ).length,
    [students, attendance]
  )

  const lateCount = useMemo(
    () =>
      students.filter(
        (student) => (attendance[String(student.id)] || "PRESENT") === "LATE"
      ).length,
    [students, attendance]
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-blue-100">
              {isParent ? "Parent Portal" : "Attendance Management"}
            </p>
            <h1 className="mt-1 text-3xl font-bold">Attendance</h1>
            <p className="mt-2 text-sm text-blue-100">
              {isParent
                ? "Track your selected child’s attendance records by date."
                : "Select a class, mark attendance, and save for the chosen date."}
            </p>
          </div>

          {canEditAttendance && (
            <button
              onClick={saveAttendance}
              disabled={saving || loading || !selectedClassId}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Students Loaded"
          value={String(students.length)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Present"
          value={String(presentCount)}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Absent"
          value={String(absentCount)}
          icon={<XCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Late"
          value={String(lateCount)}
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {isParent ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Selected Child
              </label>
              <div className="rounded-xl border border-gray-300 bg-slate-50 px-4 py-3 text-sm text-gray-700">
                {selectedChildName || "No child selected from the top selector"}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.teacher?.name ? ` — ${item.teacher.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
          Loading attendance...
        </div>
      ) : isParent && !selectedChild?.id ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          Select a child from the top dashboard selector to view attendance.
        </div>
      ) : !isParent && !selectedClassId ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          Select a class to load students.
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          {isParent
            ? "No attendance data found for the selected child."
            : "No students found in this class."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  Student Name
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  Student ID
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  Class
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const currentStatus =
                  attendance[String(student.id)] || "PRESENT"

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="border-b px-4 py-3 text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="border-b px-4 py-3 text-sm text-gray-700">
                      {student.studentId}
                    </td>
                    <td className="border-b px-4 py-3 text-sm text-gray-700">
                      {student.class?.name || "-"}
                    </td>
                    <td className="border-b px-4 py-3 text-sm text-gray-700">
                      {formatDate(selectedDate)}
                    </td>
                    <td className="border-b px-4 py-3">
                      {canEditAttendance ? (
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            updateStatus(
                              student.id,
                              e.target.value as AttendanceStatus
                            )
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="LATE">Late</option>
                        </select>
                      ) : (
                        <StatusBadge status={currentStatus} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === "PRESENT") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Present
      </span>
    )
  }

  if (status === "LATE") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Late
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      Absent
    </span>
  )
}