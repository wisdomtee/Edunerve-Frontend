"use client"

import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type StudentOption = {
  id: number
  name: string
  studentId?: string
  class?: {
    id: number
    name: string
  } | null
}

type SubjectReport = {
  id: number
  subject: string
  score: number
  grade: string
  remark: string
  teacher: string
}

type ReportResponse = {
  student: {
    id: number
    name: string
    studentId: string
    class: string
    school: string
    parent: string
    teacherRemark?: string
    principalRemark?: string
  }
  report: {
    term: string
    session: string
    totalSubjects: number
    totalScore: number
    averageScore: number
    overallGrade: string
    overallRemark: string
    attendanceRate: number
    subjects: SubjectReport[]
  }
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function extractArray<T>(data: any, keys: string[] = []) {
  if (Array.isArray(data)) return data as T[]
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as T[]
  }
  return []
}

export default function ReportCardPage() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentId, setStudentId] = useState("")
  const [term, setTerm] = useState("")
  const [session, setSession] = useState("")

  const [reportData, setReportData] = useState<ReportResponse | null>(null)

  const [teacherRemark, setTeacherRemark] = useState("")
  const [principalRemark, setPrincipalRemark] = useState("")
  const [savingRemark, setSavingRemark] = useState(false)

  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const headers = getAuthHeaders()

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (reportData) {
      setTeacherRemark(reportData.student.teacherRemark || "")
      setPrincipalRemark(reportData.student.principalRemark || "")
    }
  }, [reportData])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/students`, {
        headers,
        credentials: "include",
        cache: "no-store",
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch students")
      }

      setStudents(extractArray<StudentOption>(data, ["students"]))
    } catch (err: any) {
      setError(err.message || "Failed to load students")
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoadingReport(true)
      setError("")
      setSuccess("")
      setReportData(null)

      if (!studentId || !term.trim() || !session.trim()) {
        throw new Error("Student, term and session are required")
      }

      const url = `${API_BASE_URL}/results/report/${studentId}?term=${encodeURIComponent(
        term.trim()
      )}&session=${encodeURIComponent(session.trim())}`

      const res = await fetch(url, {
        headers,
        credentials: "include",
        cache: "no-store",
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load report card")
      }

      setReportData(data)
      setSuccess("Report card loaded successfully")
    } catch (err: any) {
      setError(err.message || "Failed to load report card")
    } finally {
      setLoadingReport(false)
    }
  }

  const saveRemarks = async () => {
    try {
      if (!reportData?.student.id) {
        throw new Error("Load a report card first")
      }

      setSavingRemark(true)
      setError("")
      setSuccess("")

      const res = await fetch(
        `${API_BASE_URL}/results/remarks/${reportData.student.id}`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            teacherRemark,
            principalRemark,
          }),
        }
      )

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save remarks")
      }

      setSuccess("Remarks updated successfully")
      setReportData((prev) =>
        prev
          ? {
              ...prev,
              student: {
                ...prev.student,
                teacherRemark,
                principalRemark,
              },
            }
          : prev
      )
    } catch (err: any) {
      setError(err.message || "Failed to save remarks")
    } finally {
      setSavingRemark(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.id) === String(studentId)),
    [students, studentId]
  )

  return (
    <div className="space-y-6 p-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Report Card System</h1>
        <p className="text-sm text-gray-600">
          Generate a printable term result sheet for any student.
        </p>
      </div>

      {error && (
        <div className="print:hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="print:hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <div className="print:hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={fetchReport}
          className="grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Student
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              disabled={loadingStudents}
            >
              <option value="">
                {loadingStudents ? "Loading students..." : "Select student"}
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                  {student.studentId ? ` (${student.studentId})` : ""}
                  {student.class?.name ? ` - ${student.class.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Term
            </label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. First Term"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Session
            </label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025/2026"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loadingReport}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loadingReport ? "Loading..." : "Generate"}
            </button>
          </div>
        </form>

        {selectedStudent && (
          <p className="mt-3 text-sm text-gray-500">
            Selected: <span className="font-medium">{selectedStudent.name}</span>
          </p>
        )}
      </div>

      {reportData && (
        <div className="space-y-6">
          <div className="print:hidden flex justify-end">
            <button
              onClick={handlePrint}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black"
            >
              Print Report Card
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <div className="border-b pb-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {reportData.student.school}
              </h2>
              <p className="mt-2 text-lg font-semibold text-gray-700">
                Student Report Card
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {reportData.report.term} - {reportData.report.session}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-semibold text-gray-900">
                  {reportData.student.name}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Student ID</p>
                <p className="font-semibold text-gray-900">
                  {reportData.student.studentId}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-semibold text-gray-900">
                  {reportData.student.class}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Parent / Guardian</p>
                <p className="font-semibold text-gray-900">
                  {reportData.student.parent}
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left">Subject</th>
                    <th className="border px-4 py-3 text-left">Score</th>
                    <th className="border px-4 py-3 text-left">Grade</th>
                    <th className="border px-4 py-3 text-left">Remark</th>
                    <th className="border px-4 py-3 text-left">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.report.subjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border px-4 py-6 text-center text-gray-500"
                      >
                        No results found for this term/session.
                      </td>
                    </tr>
                  ) : (
                    reportData.report.subjects.map((item) => (
                      <tr key={item.id}>
                        <td className="border px-4 py-3">{item.subject}</td>
                        <td className="border px-4 py-3">{item.score}</td>
                        <td className="border px-4 py-3">{item.grade}</td>
                        <td className="border px-4 py-3">{item.remark}</td>
                        <td className="border px-4 py-3">{item.teacher}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-500">Total Subjects</p>
                <p className="text-xl font-bold text-blue-700">
                  {reportData.report.totalSubjects}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-500">Total Score</p>
                <p className="text-xl font-bold text-green-700">
                  {reportData.report.totalScore}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-xl font-bold text-purple-700">
                  {reportData.report.averageScore}%
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-4">
                <p className="text-sm text-gray-500">Overall Grade</p>
                <p className="text-xl font-bold text-yellow-700">
                  {reportData.report.overallGrade}
                </p>
              </div>
            </div>

            <div className="mt-8 print:hidden">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Edit Remarks
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Teacher Remark
                  </p>
                  <textarea
                    value={teacherRemark}
                    onChange={(e) => setTeacherRemark(e.target.value)}
                    className="mt-2 min-h-[120px] w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                    placeholder="Enter teacher remark"
                  />
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Principal Remark
                  </p>
                  <textarea
                    value={principalRemark}
                    onChange={(e) => setPrincipalRemark(e.target.value)}
                    className="mt-2 min-h-[120px] w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                    placeholder="Enter principal remark"
                  />
                </div>
              </div>

              <button
                onClick={saveRemarks}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                {savingRemark ? "Saving..." : "Save Remarks"}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 print:block">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-700">
                  Teacher Remark
                </p>
                <p className="mt-2 text-gray-800">
                  {teacherRemark || "No teacher remark yet."}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-700">
                  Principal Remark
                </p>
                <p className="mt-2 text-gray-800">
                  {principalRemark || "No principal remark yet."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  {reportData.report.attendanceRate}%
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Overall Remark</p>
                <p className="text-lg font-bold text-gray-900">
                  {reportData.report.overallRemark}
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8 pt-10">
              <div>
                <div className="border-t border-gray-400 pt-2 text-center text-sm text-gray-700">
                  Class Teacher Signature
                </div>
              </div>

              <div>
                <div className="border-t border-gray-400 pt-2 text-center text-sm text-gray-700">
                  Principal Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}