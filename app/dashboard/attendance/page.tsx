"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE"

type Student = {
  id: number
  name: string
  studentId: string
  class?: {
    id: number
    name: string
  }
}

type AttendanceResponseItem = {
  studentId?: number
  status?: AttendanceStatus
  student?: {
    id?: number
  }
}

function getTodayLocalDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function AttendancePage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate())
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchStudents = async () => {
    const res = await fetch(`${API_BASE_URL}/students`, {
      headers: getAuthHeaders(),
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/login")
      throw new Error("Unauthorized")
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to fetch students")
    }

    const data = await res.json()
    setStudents(Array.isArray(data) ? data : data.students || [])
  }

  const fetchAttendance = async () => {
    const res = await fetch(`${API_BASE_URL}/attendance?date=${selectedDate}`, {
      headers: getAuthHeaders(),
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/login")
      throw new Error("Unauthorized")
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to fetch attendance")
    }

    const data = await res.json()
    const attendanceList: AttendanceResponseItem[] = Array.isArray(data)
      ? data
      : data.attendance || []

    const mapped: Record<string, AttendanceStatus> = {}

    attendanceList.forEach((item) => {
      const id = item.studentId ?? item.student?.id
      if (id && item.status) {
        mapped[String(id)] = item.status
      }
    })

    setAttendance(mapped)
  }

  const loadPage = async () => {
    try {
      setLoading(true)
      setError("")

      await Promise.all([fetchStudents(), fetchAttendance()])
    } catch (err: any) {
      if (err.message !== "Unauthorized") {
        setError(err.message || "Failed to load attendance page")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [selectedDate])

  const updateStatus = (studentId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [String(studentId)]: status,
    }))
  }

  const saveAttendance = async () => {
    try {
      setError("")
      setSaving(true)

      if (!selectedDate) {
        throw new Error("Please select a date")
      }

      if (students.length === 0) {
        throw new Error("No students available")
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
          records,
        }),
      })

      if (res.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
        return
      }

      const text = await res.text()

      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { message: text }
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to save attendance")
      }

      alert(data.message || "Attendance saved successfully")
      await fetchAttendance()
    } catch (err: any) {
      const message = err.message || "Failed to save attendance"
      setError(message)
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <button
            onClick={saveAttendance}
            disabled={saving || loading}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-4 py-3">Student Name</th>
                <th className="border px-4 py-3">Student ID</th>
                <th className="border px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border px-4 py-3">{student.name}</td>
                  <td className="border px-4 py-3">{student.studentId}</td>
                  <td className="border px-4 py-3">
                    <select
                      value={attendance[String(student.id)] || "PRESENT"}
                      onChange={(e) =>
                        updateStatus(student.id, e.target.value as AttendanceStatus)
                      }
                      className="rounded border px-3 py-2"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}