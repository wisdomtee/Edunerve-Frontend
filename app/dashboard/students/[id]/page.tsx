"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type School = {
  id: number
  name: string
}

type ClassType = {
  id: number
  name: string
}

type Subject = {
  id: number
  name: string
}

type Teacher = {
  id: number
  name: string
}

type Parent = {
  id: number
  name: string
  email: string
  phone?: string | null
  schoolId?: number | null
}

type Result = {
  id: number
  score: number
  createdAt?: string
  term?: string | null
  session?: string | null
  subject?: Subject
  teacher?: Teacher
}

type Attendance = {
  id: number
  date: string
  status: string
}

type Student = {
  id: number
  name: string
  studentId?: string | null
  gender?: string | null
  createdAt?: string
  updatedAt?: string
  parentId?: number | null
  classId?: number | null
  schoolId?: number | null
  parent?: Parent | null
  school?: School
  class?: ClassType
  results?: Result[]
  attendance?: Attendance[]
}

type RankingItem = {
  id: number
  name: string
  studentId: number | string
  averageScore: number
}

type RankingData = {
  studentId: number
  studentName: string
  classId: number | null
  className: string | null
  averageScore: number
  position: number | null
  positionText: string
  totalStudents: number
  ranking: RankingItem[]
  message?: string
}

type User = {
  id: number
  name: string
  email: string
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
  schoolId?: number | null
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function getOrdinal(position: number | null) {
  if (!position) return "—"

  const mod10 = position % 10
  const mod100 = position % 100

  if (mod10 === 1 && mod100 !== 11) return `${position}st`
  if (mod10 === 2 && mod100 !== 12) return `${position}nd`
  if (mod10 === 3 && mod100 !== 13) return `${position}rd`
  return `${position}th`
}

export default function StudentDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [user, setUser] = useState<User | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [selectedParentId, setSelectedParentId] = useState("")
  const [ranking, setRanking] = useState<RankingData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [savingResult, setSavingResult] = useState(false)
  const [deletingResultId, setDeletingResultId] = useState<number | null>(null)
  const [assigningParent, setAssigningParent] = useState(false)

  const [resultForm, setResultForm] = useState({
    subjectId: "",
    score: "",
    term: "",
    session: "",
  })

  const canAssignParent =
    user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN"

  const canEdit =
    user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN"

  const fetchStudent = async () => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch student")
    }

    setStudent(data)
    setSelectedParentId(data.parentId ? String(data.parentId) : "")
  }

  const fetchSubjects = async () => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      setSubjects([])
      return
    }

    setSubjects(Array.isArray(data) ? data : data.subjects || [])
  }

  const fetchParents = async () => {
    if (!canAssignParent) {
      setParents([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/students/parents`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      setParents([])
      return
    }

    setParents(Array.isArray(data) ? data : data.parents || [])
  }

  const fetchRanking = async () => {
    const response = await fetch(`${API_BASE_URL}/students/${id}/ranking`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      setRanking(null)
      return
    }

    setRanking(data)
  }

  useEffect(() => {
    if (!id) return

    const storedUser = getUser()
    setUser(storedUser)

    const loadPage = async () => {
      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const canLoadParents =
          storedUser?.role === "SCHOOL_ADMIN" ||
          storedUser?.role === "SUPER_ADMIN"

        await Promise.all([
          fetchStudent(),
          fetchSubjects(),
          fetchRanking(),
          canLoadParents ? fetchParents() : Promise.resolve(),
        ])
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const initials = useMemo(() => {
    if (!student?.name) return "S"
    return student.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [student])

  const averageScore = useMemo(() => {
    if (!student?.results || student.results.length === 0) return null
    const total = student.results.reduce(
      (sum, item) => sum + Number(item.score || 0),
      0
    )
    return total / student.results.length
  }, [student])

  const grade = useMemo(() => {
    if (averageScore === null) return "—"
    if (averageScore >= 70) return "A"
    if (averageScore >= 60) return "B"
    if (averageScore >= 50) return "C"
    if (averageScore >= 45) return "D"
    return "F"
  }, [averageScore])

  const attendanceStats = useMemo(() => {
    const records = student?.attendance || []
    const present = records.filter(
      (item) => item.status?.toLowerCase() === "present"
    ).length
    const absent = records.filter(
      (item) => item.status?.toLowerCase() === "absent"
    ).length
    const late = records.filter(
      (item) => item.status?.toLowerCase() === "late"
    ).length

    return {
      total: records.length,
      present,
      absent,
      late,
    }
  }, [student])

  const positionLabel = useMemo(() => {
    if (!ranking?.position) return "—"
    return `${getOrdinal(ranking.position)} out of ${ranking.totalStudents}`
  }, [ranking])

  const handleAssignParent = async () => {
    if (!student?.id) {
      setError("Student data is not available")
      return
    }

    if (!selectedParentId) {
      setError("Please select a parent")
      return
    }

    try {
      setAssigningParent(true)
      setError("")
      setSuccess("")

      const response = await fetch(
        `${API_BASE_URL}/students/assign-parent/${student.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            parentId: Number(selectedParentId),
          }),
        }
      )

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to assign parent")
      }

      setSuccess(data?.message || "Parent assigned successfully")
      await Promise.all([fetchStudent(), fetchParents()])
    } catch (err: any) {
      setError(err.message || "Failed to assign parent")
    } finally {
      setAssigningParent(false)
    }
  }

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSavingResult(true)
      setError("")
      setSuccess("")

      if (!student) {
        throw new Error("Student data is not available")
      }

      if (!student.school?.id) {
        throw new Error("Student school was not found")
      }

      if (!resultForm.subjectId || !resultForm.score) {
        throw new Error("Please select a subject and enter a score")
      }

      const numericScore = Number(resultForm.score)
      const numericSubjectId = Number(resultForm.subjectId)
      const numericStudentId = Number(id)

      if (Number.isNaN(numericStudentId)) {
        throw new Error("Invalid student ID")
      }

      if (Number.isNaN(numericSubjectId)) {
        throw new Error("Invalid subject")
      }

      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error("Score must be between 0 and 100")
      }

      const payload = {
        studentId: numericStudentId,
        subjectId: numericSubjectId,
        schoolId: Number(student.school.id),
        score: numericScore,
        term: resultForm.term.trim() || "First Term",
        session: resultForm.session.trim() || "2025/2026",
      }

      const response = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create result")
      }

      setSuccess(data.message || "Result added successfully")
      setResultForm({
        subjectId: "",
        score: "",
        term: "",
        session: "",
      })

      await Promise.all([fetchStudent(), fetchRanking()])
    } catch (err: any) {
      setError(err.message || "Failed to add result")
    } finally {
      setSavingResult(false)
    }
  }

  const handleDeleteResult = async (resultId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this result?"
    )
    if (!confirmed) return

    try {
      setDeletingResultId(resultId)
      setError("")
      setSuccess("")

      const response = await fetch(`${API_BASE_URL}/results/${resultId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete result")
      }

      setSuccess(data.message || "Result deleted successfully")
      await Promise.all([fetchStudent(), fetchRanking()])
    } catch (err: any) {
      setError(err.message || "Failed to delete result")
    } finally {
      setDeletingResultId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading student details...</p>
        </div>
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Unable to load student
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/students"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Students
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-700">Student not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
          <p className="mt-1 text-gray-600">
            View full student profile, performance, attendance, ranking, and
            parent assignment
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <Link
              href={`/dashboard/students/${id}/report`}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Report
            </Link>
          )}

          <Link href="/dashboard/students" className="rounded-lg border px-4 py-2">
            Back
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      {canAssignParent && (
        <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-blue-700">Assign Parent</h3>
          <p className="mt-2 text-gray-600">
            Link this student to a parent in the same school
          </p>

          {parents.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 outline-none"
              >
                <option value="">Select parent</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.email})
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssignParent}
                disabled={
                  assigningParent ||
                  !selectedParentId ||
                  Number(selectedParentId) === student.parentId
                }
                className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigningParent
                  ? "Assigning..."
                  : student.parentId
                  ? "Reassign Parent"
                  : "Assign Parent"}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              No parents found yet. Create a parent account first, then return
              here to assign.
            </div>
          )}

          {student.parent && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              Current parent:{" "}
              <span className="font-semibold">{student.parent.name}</span>
              {student.parent.email ? ` (${student.parent.email})` : ""}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard
          label="Average Score"
          value={averageScore !== null ? averageScore.toFixed(1) : "—"}
        />
        <StatCard label="Grade" value={grade} />
        <StatCard
          label="Position"
          value={ranking?.position ? getOrdinal(ranking.position) : "—"}
        />
        <StatCard label="Results Count" value={String(student.results?.length || 0)} />
        <StatCard label="Attendance Records" value={String(attendanceStats.total)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
              {initials}
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              {student.name}
            </h2>

            <p className="mt-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Position: {positionLabel}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow label="Student ID" value={student.studentId || String(student.id)} />
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Class" value={student.class?.name || "—"} />
            <InfoRow label="School" value={student.school?.name || "—"} />
            <InfoRow
              label="Parent"
              value={student.parent ? student.parent.name : "Not assigned"}
            />
            <InfoRow label="Position" value={positionLabel} />
            <InfoRow
              label="Date Added"
              value={
                student.createdAt
                  ? new Date(student.createdAt).toLocaleDateString()
                  : "—"
              }
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Profile Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailCard label="Full Name" value={student.name} />
              <DetailCard
                label="Student ID"
                value={student.studentId || String(student.id)}
              />
              <DetailCard label="Gender" value={student.gender || "—"} />
              <DetailCard label="Class" value={student.class?.name || "—"} />
              <DetailCard label="School" value={student.school?.name || "—"} />
              <DetailCard
                label="Assigned Parent"
                value={
                  student.parent
                    ? `${student.parent.name} (${student.parent.email})`
                    : "Not assigned"
                }
              />
              <DetailCard label="Position" value={positionLabel} />
              <DetailCard
                label="Date Created"
                value={
                  student.createdAt
                    ? new Date(student.createdAt).toLocaleString()
                    : "—"
                }
              />
            </div>
          </div>

          {canEdit && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Add Result
              </h3>

              <form
                onSubmit={handleAddResult}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <select
                    value={resultForm.subjectId}
                    onChange={(e) =>
                      setResultForm((prev) => ({
                        ...prev,
                        subjectId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={resultForm.score}
                    onChange={(e) =>
                      setResultForm((prev) => ({
                        ...prev,
                        score: e.target.value,
                      }))
                    }
                    placeholder="Enter score"
                    className="w-full rounded-lg border px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Term
                  </label>
                  <input
                    type="text"
                    value={resultForm.term}
                    onChange={(e) =>
                      setResultForm((prev) => ({
                        ...prev,
                        term: e.target.value,
                      }))
                    }
                    placeholder="e.g First Term"
                    className="w-full rounded-lg border px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Session
                  </label>
                  <input
                    type="text"
                    value={resultForm.session}
                    onChange={(e) =>
                      setResultForm((prev) => ({
                        ...prev,
                        session: e.target.value,
                      }))
                    }
                    placeholder="e.g 2025/2026"
                    className="w-full rounded-lg border px-3 py-2 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingResult}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingResult ? "Saving..." : "Add Result"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Attendance Summary
              </h3>
              <div className="space-y-3">
                <InfoRow label="Present" value={String(attendanceStats.present)} />
                <InfoRow label="Absent" value={String(attendanceStats.absent)} />
                <InfoRow label="Late" value={String(attendanceStats.late)} />
                <InfoRow label="Total" value={String(attendanceStats.total)} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Latest Result
              </h3>
              {student.results?.[0] ? (
                <div className="space-y-3">
                  <InfoRow
                    label="Subject"
                    value={student.results[0].subject?.name || "—"}
                  />
                  <InfoRow
                    label="Score"
                    value={String(student.results[0].score)}
                  />
                  <InfoRow
                    label="Teacher"
                    value={student.results[0].teacher?.name || "—"}
                  />
                  <InfoRow
                    label="Date"
                    value={
                      student.results[0].createdAt
                        ? new Date(student.results[0].createdAt).toLocaleDateString()
                        : "—"
                    }
                  />
                </div>
              ) : (
                <p className="text-gray-500">No result found.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Results History
              </h3>
            </div>

            {student.results && student.results.length > 0 ? (
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
                        Term
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Session
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Teacher
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Date
                      </th>
                      {canEdit && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {student.results.map((result) => (
                      <tr key={result.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.subject?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.score}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.term || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.session || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.teacher?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.createdAt
                            ? new Date(result.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDeleteResult(result.id)}
                              disabled={deletingResultId === result.id}
                              className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingResultId === result.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No results available yet.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Attendance History
            </h3>

            {student.attendance && student.attendance.length > 0 ? (
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
                    {student.attendance.map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              record.status?.toLowerCase() === "present"
                                ? "bg-green-100 text-green-700"
                                : record.status?.toLowerCase() === "late"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No attendance records available yet.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Class Ranking
            </h3>

            {!ranking ? (
              <p className="text-gray-500">Ranking not available.</p>
            ) : ranking.ranking.length === 0 ? (
              <p className="text-gray-500">
                {ranking.message || "No ranking data available."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Average Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.ranking.map((item, index) => {
                      const isCurrent = item.id === student.id

                      return (
                        <tr
                          key={item.id}
                          className={`border-b ${
                            isCurrent ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {getOrdinal(index + 1)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {item.name}
                            {isCurrent && (
                              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                                This student
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {item.studentId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {item.averageScore.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-900">{value}</span>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}