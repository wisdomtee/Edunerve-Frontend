"use client"

import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type School = {
  id: number
  name: string
}

type ClassInfo = {
  id: number
  name: string
}

type Student = {
  id: number
  name: string
  studentId: string
  gender?: string | null
  photo?: string | null
  teacherRemark?: string | null
  principalRemark?: string | null
  school?: School | null
  class?: ClassInfo | null
}

type Result = {
  id: number
  subject: string
  score: number
  term?: string | null
  session?: string | null
}

type Attendance = {
  id: number
  date: string
  status: string
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function getGrade(score: number) {
  if (score >= 70) return "A"
  if (score >= 60) return "B"
  if (score >= 50) return "C"
  if (score >= 45) return "D"
  return "F"
}

function formatDate(date?: string) {
  if (!date) return "—"
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return date
  }
}

export default function ParentChildrenPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [resultsMap, setResultsMap] = useState<Record<number, Result[]>>({})
  const [attendanceMap, setAttendanceMap] = useState<Record<number, Attendance[]>>({})
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  useEffect(() => {
    const user = getUser()

    if (user && user.role && user.role !== "PARENT") {
      setError("Only parent accounts can open this page.")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`${API_BASE_URL}/parent/portal`, {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        })

        const data = await parseResponse(response)

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load children")
        }

        const fetchedStudents = Array.isArray(data?.students) ? data.students : []

        setStudents(fetchedStudents)
        setResultsMap(data?.results || {})
        setAttendanceMap(data?.attendance || {})

        if (fetchedStudents.length > 0) {
          setSelectedStudentId(fetchedStudents[0].id)
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null
    return students.find((student) => student.id === selectedStudentId) || null
  }, [students, selectedStudentId])

  const selectedResults = selectedStudent ? resultsMap[selectedStudent.id] || [] : []
  const selectedAttendance = selectedStudent ? attendanceMap[selectedStudent.id] || [] : []

  const averageScore = useMemo(() => {
    if (!selectedResults.length) return 0
    const total = selectedResults.reduce((sum, item) => sum + Number(item.score || 0), 0)
    return total / selectedResults.length
  }, [selectedResults])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading children...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">Unable to load children page</h1>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!students.length) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
          <p className="mt-3 text-gray-600">No children are linked to this parent account yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        <p className="mt-2 text-gray-600">View each child&apos;s academic profile and records</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Children List</h2>

            <div className="space-y-4">
              {students.map((student) => {
                const active = student.id === selectedStudentId

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {getInitials(student.name)}
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                        <p className="text-sm text-gray-600">
                          {student.class?.name || "No class assigned"}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          {selectedStudent && (
            <>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                <p className="mt-1 text-gray-600">
                  {selectedStudent.school?.name || "School not assigned"} •{" "}
                  {selectedStudent.class?.name || "Class not assigned"}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedStudent.studentId}</p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedStudent.gender || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Subjects</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedResults.length}</p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Average Grade</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedResults.length ? getGrade(averageScore) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900">Teacher Remark</h3>
                  <p className="mt-3 rounded-xl bg-gray-50 p-4 text-gray-700">
                    {selectedStudent.teacherRemark || "No teacher remark yet."}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900">Principal Remark</h3>
                  <p className="mt-3 rounded-xl bg-gray-50 p-4 text-gray-700">
                    {selectedStudent.principalRemark || "No principal remark yet."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">Academic Results</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Term
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Session
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResults.length > 0 ? (
                        selectedResults.map((result) => (
                          <tr key={result.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800">{result.subject}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{result.score}%</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                              {getGrade(result.score)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {result.term || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {result.session || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                            No results found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">Attendance History</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAttendance.length > 0 ? (
                        selectedAttendance.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{item.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-sm text-gray-500">
                            No attendance record found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}