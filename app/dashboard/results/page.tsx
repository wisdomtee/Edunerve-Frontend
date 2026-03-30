"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"
import { getSelectedChild } from "@/lib/parent"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

type AppUser = {
  id?: number
  name?: string
  email?: string
  role?: UserRole | string
  schoolId?: number | null
}

type Student = {
  id: number
  name: string
  studentId?: string
  class?: {
    id: number
    name: string
  } | null
}

type Subject = {
  id: number
  name: string
}

type ClassItem = {
  id: number
  name: string
  teacher?: {
    id: number
    name: string
  } | null
  school?: {
    id: number
    name: string
  } | null
}

type ResultItem = {
  id: number
  score: number
  term?: string | null
  session?: string | null
  student?: {
    id: number
    name: string
    studentId?: string
    class?: {
      id: number
      name: string
    } | null
  } | null
  subject?: {
    id: number
    name: string
  } | null
  teacher?: {
    id: number
    name: string
  } | null
  school?: {
    id: number
    name: string
  } | null
  createdAt?: string
}

function extractArray<T>(data: any, possibleKeys: string[] = []): T[] {
  if (Array.isArray(data)) return data
  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function ResultsPage() {
  const [user, setUser] = useState<AppUser | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [bulkStudents, setBulkStudents] = useState<Student[]>([])

  const [loading, setLoading] = useState(true)
  const [submittingSingle, setSubmittingSingle] = useState(false)
  const [submittingBulk, setSubmittingBulk] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loadingBulkStudents, setLoadingBulkStudents] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
    score: "",
    term: "",
    session: "",
  })

  const [bulkData, setBulkData] = useState({
    classId: "",
    subjectId: "",
    term: "",
    session: "",
  })

  const [bulkScores, setBulkScores] = useState<Record<number, string>>({})

  const [filters, setFilters] = useState({
    classId: "",
    studentId: "",
    subjectId: "",
    term: "",
    session: "",
  })

  const selectedChild = getSelectedChild()
  const headers = getAuthHeaders()
  const isParent = user?.role === "PARENT"

  const fetchStudents = async () => {
    const res = await fetch(`${API_BASE_URL}/students`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch students")
    }

    const allStudents = extractArray<Student>(data, ["students"])

    if (isParent && selectedChild?.id) {
      setStudents(allStudents.filter((student) => student.id === selectedChild.id))
      return
    }

    setStudents(allStudents)
  }

  const fetchSubjects = async () => {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch subjects")
    }

    setSubjects(extractArray<Subject>(data, ["subjects"]))
  }

  const fetchClasses = async () => {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch classes")
    }

    setClasses(extractArray<ClassItem>(data, ["classes"]))
  }

  const fetchResults = async (customFilters?: Partial<typeof filters>) => {
    const activeFilters = {
      ...filters,
      ...customFilters,
    }

    const params = new URLSearchParams()

    if (isParent && selectedChild?.id) {
      params.set("studentId", String(selectedChild.id))
    } else {
      if (activeFilters.classId) params.set("classId", activeFilters.classId)
      if (activeFilters.studentId) params.set("studentId", activeFilters.studentId)
    }

    if (activeFilters.subjectId) params.set("subjectId", activeFilters.subjectId)
    if (activeFilters.term) params.set("term", activeFilters.term)
    if (activeFilters.session) params.set("session", activeFilters.session)

    const query = params.toString()
    const url = query
      ? `${API_BASE_URL}/results?${query}`
      : `${API_BASE_URL}/results`

    const res = await fetch(url, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch results")
    }

    setResults(extractArray<ResultItem>(data, ["results"]))
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError("")

      const currentUser = getCurrentUser()
      setUser(currentUser)

      await Promise.all([
        fetchStudents(),
        fetchSubjects(),
        fetchClasses(),
        fetchResults(
          currentUser?.role === "PARENT" && selectedChild?.id
            ? { studentId: String(selectedChild.id) }
            : {}
        ),
      ])

      if (currentUser?.role === "PARENT" && selectedChild?.id) {
        setFilters((prev) => ({
          ...prev,
          studentId: String(selectedChild.id),
        }))
      }
    } catch (err: any) {
      setError(err.message || "Failed to load page data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild?.id])

  useEffect(() => {
    const loadBulkStudents = async () => {
      if (!bulkData.classId || isParent) {
        setBulkStudents([])
        setBulkScores({})
        return
      }

      try {
        setLoadingBulkStudents(true)
        setError("")

        const res = await fetch(
          `${API_BASE_URL}/attendance/class/${bulkData.classId}/students`,
          {
            headers,
            credentials: "include",
            cache: "no-store",
          }
        )

        const data = await parseResponse(res)

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch class students")
        }

        const studentList = extractArray<Student>(data, ["students"])
        setBulkStudents(studentList)

        const initialScores: Record<number, string> = {}
        studentList.forEach((student) => {
          initialScores[student.id] = ""
        })
        setBulkScores(initialScores)
      } catch (err: any) {
        setError(err.message || "Failed to load class students")
      } finally {
        setLoadingBulkStudents(false)
      }
    }

    loadBulkStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkData.classId, isParent])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleBulkChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBulkData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const applyFilters = async () => {
    try {
      setLoading(true)
      setError("")
      await fetchResults(filters)
    } catch (err: any) {
      setError(err.message || "Failed to apply filters")
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = async () => {
    const emptyFilters = {
      classId: "",
      studentId: isParent && selectedChild?.id ? String(selectedChild.id) : "",
      subjectId: "",
      term: "",
      session: "",
    }

    setFilters(emptyFilters)

    try {
      setLoading(true)
      setError("")
      await fetchResults(emptyFilters)
    } catch (err: any) {
      setError(err.message || "Failed to reset filters")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResult = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmittingSingle(true)
      setError("")
      setSuccess("")

      if (isParent) {
        throw new Error("Parents cannot create results")
      }

      if (!formData.studentId || !formData.subjectId || !formData.score) {
        throw new Error("Student, subject and score are required")
      }

      const score = Number(formData.score)

      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error("Score must be between 0 and 100")
      }

      const payload = {
        studentId: Number(formData.studentId),
        subjectId: Number(formData.subjectId),
        score,
        term: formData.term.trim() || undefined,
        session: formData.session.trim() || undefined,
      }

      const res = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create result")
      }

      setSuccess(data?.message || "Result saved successfully")
      setFormData({
        studentId: "",
        subjectId: "",
        score: "",
        term: "",
        session: "",
      })

      await fetchResults()
    } catch (err: any) {
      setError(err.message || "Failed to create result")
    } finally {
      setSubmittingSingle(false)
    }
  }

  const handleBulkScoreChange = (studentId: number, value: string) => {
    setBulkScores((prev) => ({
      ...prev,
      [studentId]: value,
    }))
  }

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmittingBulk(true)
      setError("")
      setSuccess("")

      if (isParent) {
        throw new Error("Parents cannot upload bulk results")
      }

      if (!bulkData.classId || !bulkData.subjectId) {
        throw new Error("Class and subject are required for bulk result entry")
      }

      if (bulkStudents.length === 0) {
        throw new Error("No students found in the selected class")
      }

      const records = bulkStudents
        .map((student) => ({
          studentId: student.id,
          score: Number(bulkScores[student.id]),
        }))
        .filter((entry) => !isNaN(entry.score))

      if (records.length === 0) {
        throw new Error("Enter at least one valid score")
      }

      const invalidScore = records.find(
        (entry) => entry.score < 0 || entry.score > 100
      )

      if (invalidScore) {
        throw new Error("All scores must be between 0 and 100")
      }

      const payload = {
        classId: Number(bulkData.classId),
        subjectId: Number(bulkData.subjectId),
        term: bulkData.term.trim() || undefined,
        session: bulkData.session.trim() || undefined,
        records,
      }

      const res = await fetch(`${API_BASE_URL}/results/bulk`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save bulk results")
      }

      setSuccess(
        data?.message ||
          `Bulk results saved successfully (${data?.savedCount || 0} records)`
      )

      await fetchResults()
    } catch (err: any) {
      setError(err.message || "Failed to save bulk results")
    } finally {
      setSubmittingBulk(false)
    }
  }

  const handleDeleteResult = async (id: number) => {
    if (isParent) return

    const confirmed = window.confirm("Are you sure you want to delete this result?")
    if (!confirmed) return

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/results/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete result")
      }

      setResults((prev) => prev.filter((item) => item.id !== id))
      setSuccess(data?.message || "Result deleted successfully")
    } catch (err: any) {
      setError(err.message || "Failed to delete result")
    } finally {
      setDeletingId(null)
    }
  }

  const totalResults = useMemo(() => results.length, [results])

  const averageScore = useMemo(() => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, item) => sum + Number(item.score || 0), 0)
    return Math.round(total / results.length)
  }, [results])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="text-sm text-gray-600">
            {isParent
              ? "View academic records for your selected child."
              : "Create single results, upload bulk scores by class, and manage academic records."}
          </p>
          {isParent && (
            <p className="mt-2 text-sm font-medium text-blue-700">
              Selected Child: {selectedChild?.name || "No child selected"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isParent && (
            <Link
              href="/dashboard/results/upload"
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Upload CSV
            </Link>
          )}

          <Link
            href="/dashboard/results/report"
            className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black"
          >
            Open Report Card
          </Link>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Total Results: {totalResults}
          </div>

          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Average Score: {averageScore}%
          </div>
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

      {isParent && !selectedChild?.id ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
          Select a child from the top dashboard selector to view results.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {!isParent && (
            <div className="space-y-6 xl:col-span-1">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Add Single Result
                </h2>

                <form onSubmit={handleCreateResult} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Student
                    </label>
                    <select
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="">Select student</option>
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
                      Subject
                    </label>
                    <select
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Score
                    </label>
                    <input
                      type="number"
                      name="score"
                      value={formData.score}
                      onChange={handleChange}
                      placeholder="Enter score"
                      min="0"
                      max="100"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Term
                    </label>
                    <input
                      type="text"
                      name="term"
                      value={formData.term}
                      onChange={handleChange}
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
                      name="session"
                      value={formData.session}
                      onChange={handleChange}
                      placeholder="e.g. 2025/2026"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSingle}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {submittingSingle ? "Saving Result..." : "Save Result"}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Bulk Result Entry
                </h2>

                <form onSubmit={handleBulkSave} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Class
                    </label>
                    <select
                      name="classId"
                      value={bulkData.classId}
                      onChange={handleBulkChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="">Select class</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <select
                      name="subjectId"
                      value={bulkData.subjectId}
                      onChange={handleBulkChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Term
                    </label>
                    <input
                      type="text"
                      name="term"
                      value={bulkData.term}
                      onChange={handleBulkChange}
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
                      name="session"
                      value={bulkData.session}
                      onChange={handleBulkChange}
                      placeholder="e.g. 2025/2026"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  {loadingBulkStudents ? (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                      Loading class students...
                    </div>
                  ) : bulkData.classId && bulkStudents.length > 0 ? (
                    <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-gray-200 p-3">
                      {bulkStudents.map((student) => (
                        <div
                          key={student.id}
                          className="grid grid-cols-1 gap-2 rounded-lg border border-gray-100 p-3 md:grid-cols-[1fr_140px]"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">
                              {student.studentId || "No student ID"}
                            </p>
                          </div>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Score"
                            value={bulkScores[student.id] || ""}
                            onChange={(e) =>
                              handleBulkScoreChange(student.id, e.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                      Select a class to load students for bulk score entry.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingBulk}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    {submittingBulk ? "Saving Bulk Results..." : "Save Bulk Results"}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className={isParent ? "xl:col-span-3 space-y-6" : "xl:col-span-2 space-y-6"}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filter Results</h2>

                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  isParent ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-5"
                }`}
              >
                {!isParent && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Class
                      </label>
                      <select
                        name="classId"
                        value={filters.classId}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="">All classes</option>
                        {classes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Student
                      </label>
                      <select
                        name="studentId"
                        value={filters.studentId}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="">All students</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <select
                    name="subjectId"
                    value={filters.subjectId}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">All subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
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
                    name="term"
                    value={filters.term}
                    onChange={handleFilterChange}
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
                    name="session"
                    value={filters.session}
                    onChange={handleFilterChange}
                    placeholder="e.g. 2025/2026"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Results</h2>

                {!isParent && (
                  <Link
                    href="/dashboard/results/upload"
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Go to Bulk Upload
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="p-6 text-gray-600">Loading results...</div>
              ) : results.length === 0 ? (
                <div className="p-6 text-gray-600">No results found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold">Class</th>
                        <th className="px-4 py-3 font-semibold">Subject</th>
                        <th className="px-4 py-3 font-semibold">Score</th>
                        <th className="px-4 py-3 font-semibold">Teacher</th>
                        <th className="px-4 py-3 font-semibold">School</th>
                        <th className="px-4 py-3 font-semibold">Term</th>
                        <th className="px-4 py-3 font-semibold">Session</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        {!isParent && (
                          <th className="px-4 py-3 font-semibold">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="px-4 py-4 text-gray-900">
                            {item.student?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.student?.class?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.subject?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">{item.score}%</td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.teacher?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.school?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">{item.term || "-"}</td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.session || "-"}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          {!isParent && (
                            <td className="px-4 py-4">
                              <button
                                onClick={() => handleDeleteResult(item.id)}
                                disabled={deletingId === item.id}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-400"
                              >
                                {deletingId === item.id ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}