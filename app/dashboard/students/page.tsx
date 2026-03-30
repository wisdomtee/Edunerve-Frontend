"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Parent = {
  id: number
  name: string
  email: string
}

type Student = {
  id: number
  name: string
  gender?: string | null
  parentId?: number | null
  parent?: Parent | null
  school?: {
    id: number
    name: string
  }
  class?: {
    id: number
    name: string
  }
}

type User = {
  id: number
  name: string
  email: string
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
  schoolId?: number
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem("user")
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function StudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [selectedParents, setSelectedParents] = useState<Record<number, string>>(
    {}
  )
  const [assigningStudentId, setAssigningStudentId] = useState<number | null>(
    null
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [user, setUser] = useState<User | null>(null)

  const canAssignParent =
    user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN"

  const fetchStudents = async () => {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Your session has expired. Please log in again.")
      }

      throw new Error(data?.message || "Failed to fetch students")
    }

    const studentsList = Array.isArray(data) ? data : data.students || []
    setStudents(studentsList)

    const nextSelectedParents: Record<number, string> = {}
    studentsList.forEach((student: Student) => {
      nextSelectedParents[student.id] = student.parentId
        ? String(student.parentId)
        : ""
    })
    setSelectedParents(nextSelectedParents)
  }

  const fetchParents = async (currentUser?: User | null) => {
    const activeUser = currentUser ?? getStoredUser()
    const allowed =
      activeUser?.role === "SCHOOL_ADMIN" || activeUser?.role === "SUPER_ADMIN"

    if (!allowed) {
      setParents([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/parents`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch parents")
    }

    setParents(Array.isArray(data) ? data : data.parents || [])
  }

  const loadPage = async (currentUser?: User | null) => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const storedUser = currentUser ?? getStoredUser()
      setUser(storedUser)

      const allowed =
        storedUser?.role === "SCHOOL_ADMIN" ||
        storedUser?.role === "SUPER_ADMIN"

      if (allowed) {
        await Promise.all([fetchStudents(), fetchParents(storedUser)])
      } else {
        await fetchStudents()
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)
    loadPage(storedUser)
  }, [])

  const handleAssignParent = async (studentId: number) => {
    const parentId = selectedParents[studentId]

    if (!parentId) {
      setError("Please select a parent first")
      setSuccess("")
      return
    }

    try {
      setAssigningStudentId(studentId)
      setError("")
      setSuccess("")

      const response = await fetch(
        `${API_BASE_URL}/parents/${Number(parentId)}/assign-student`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ studentId }),
        }
      )

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to assign parent")
      }

      setSuccess(data?.message || "Parent assigned successfully")
      await fetchStudents()
    } catch (err: any) {
      setError(err.message || "Failed to assign parent")
    } finally {
      setAssigningStudentId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error && students.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Unable to load students
          </h2>
          <p className="mt-2 text-red-600">{error}</p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="mt-1 text-gray-600">
            Manage all students in your school
          </p>
        </div>

        <Link
          href="/dashboard/students/create"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Add Student
        </Link>
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

      {canAssignParent && parents.length === 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
          No parents found yet. Create a parent account first before assigning
          one.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Gender</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">School</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Parent</th>
              {canAssignParent && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Assign Parent
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
            </tr>
          </thead>

          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td
                    className="cursor-pointer px-4 py-3 text-sm text-gray-800"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {student.id}
                  </td>

                  <td
                    className="cursor-pointer px-4 py-3 text-sm text-gray-800"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {student.name}
                  </td>

                  <td
                    className="cursor-pointer px-4 py-3 text-sm text-gray-800"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {student.gender || "—"}
                  </td>

                  <td
                    className="cursor-pointer px-4 py-3 text-sm text-gray-800"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {student.class?.name || "—"}
                  </td>

                  <td
                    className="cursor-pointer px-4 py-3 text-sm text-gray-800"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                  >
                    {student.school?.name || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-800">
                    {student.parent ? (
                      <div>
                        <p className="font-medium">{student.parent.name}</p>
                        <p className="text-xs text-gray-500">{student.parent.email}</p>
                      </div>
                    ) : (
                      "Not assigned"
                    )}
                  </td>

                  {canAssignParent && (
                    <td className="px-4 py-3 text-sm">
                      {parents.length > 0 ? (
                        <div className="flex min-w-[280px] flex-col gap-2">
                          {student.parent && (
                            <div className="text-xs text-gray-600">
                              Current:{" "}
                              <span className="font-medium">{student.parent.name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <select
                              value={selectedParents[student.id] || ""}
                              onChange={(e) =>
                                setSelectedParents((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                              <option value="">Select parent</option>
                              {parents.map((parent) => (
                                <option key={parent.id} value={parent.id}>
                                  {parent.name} ({parent.email})
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleAssignParent(student.id)}
                              disabled={
                                assigningStudentId === student.id ||
                                !selectedParents[student.id] ||
                                Number(selectedParents[student.id]) === student.parentId
                              }
                              className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {assigningStudentId === student.id
                                ? "Saving..."
                                : student.parentId
                                ? "Reassign"
                                : "Assign"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No parents yet</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="inline-block rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={canAssignParent ? 8 : 7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}