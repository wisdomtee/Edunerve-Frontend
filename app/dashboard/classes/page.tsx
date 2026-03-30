"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type User = {
  id: number
  name: string
  email: string
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
  schoolId?: number
}

type Teacher = {
  id: number
  name: string
  email?: string | null
}

type ClassType = {
  id: number
  name: string
  teacherId?: number | null
  teacher?: Teacher | null
  createdAt?: string
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

export default function ClassesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    teacherId: "",
  })

  const isAdmin =
    user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN"

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const fetchClasses = async () => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch classes")
    }

    setClasses(Array.isArray(data) ? data : data.classes || [])
  }

  const fetchTeachers = async (currentUser: User | null) => {
    if (!currentUser) {
      setTeachers([])
      return
    }

    const canFetchTeachers =
      currentUser.role === "SCHOOL_ADMIN" || currentUser.role === "SUPER_ADMIN"

    if (!canFetchTeachers) {
      setTeachers([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/teachers`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      setTeachers([])
      return
    }

    setTeachers(Array.isArray(data) ? data : data.teachers || [])
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const currentUser = getStoredUser()
      setUser(currentUser)

      await fetchClasses()
      await fetchTeachers(currentUser)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!isAdmin) {
        throw new Error("Only admins can create classes")
      }

      if (!form.name.trim()) {
        throw new Error("Class name is required")
      }

      const payload: any = {
        name: form.name.trim(),
      }

      if (form.teacherId) {
        const numericTeacherId = Number(form.teacherId)

        if (Number.isNaN(numericTeacherId)) {
          throw new Error("Invalid teacher selected")
        }

        payload.teacherId = numericTeacherId
      }

      const response = await fetch(`${API_BASE_URL}/classes/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create class")
      }

      setSuccess(data?.message || "Class created successfully")
      setForm({
        name: "",
        teacherId: "",
      })

      await fetchData()
    } catch (err: any) {
      setError(err.message || "Failed to create class")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (classId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this class?")
    if (!confirmed) return

    try {
      setDeletingId(classId)
      setError("")
      setSuccess("")

      if (!isAdmin) {
        throw new Error("Only admins can delete classes")
      }

      const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete class")
      }

      setSuccess(data?.message || "Class deleted successfully")
      await fetchData()
    } catch (err: any) {
      setError(err.message || "Failed to delete class")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="mt-1 text-gray-600">
            {isAdmin
              ? "Manage classes and assign class teachers"
              : "View your assigned classes"}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
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

      {isAdmin && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Create Class</h2>

          <form
            onSubmit={handleCreateClass}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g JSS 1"
                className="w-full rounded-lg border px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Teacher
              </label>
              <select
                value={form.teacherId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, teacherId: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 outline-none"
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Class List</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            {classes.length} class{classes.length === 1 ? "" : "es"}
          </span>
        </div>

        {classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Date Created
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem) => (
                  <tr key={classItem.id} className="border-b">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {classItem.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {classItem.teacher?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {classItem.createdAt
                        ? new Date(classItem.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    {isAdmin && (
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteClass(classItem.id)}
                          disabled={deletingId === classItem.id}
                          className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === classItem.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No classes found.</p>
        )}
      </div>
    </div>
  )
}