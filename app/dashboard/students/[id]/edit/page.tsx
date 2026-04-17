"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string | null
  parentId?: number | null
  classId?: number | null
  schoolId?: number | null
  class?: {
    id: number
    name: string
  } | null
  parent?: {
    id: number
    name: string
    email?: string | null
  } | null
  school?: {
    id: number
    name: string
  } | null
}

type ClassItem = {
  id: number
  name: string
}

type ParentItem = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
}

type User = {
  id: number
  name: string
  email: string
  role: string
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

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [user, setUser] = useState<User | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [parents, setParents] = useState<ParentItem[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    classId: "",
    parentId: "",
  })

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
    setForm({
      name: data.name || "",
      classId: data.classId ? String(data.classId) : "",
      parentId: data.parentId ? String(data.parentId) : "",
    })
  }

  const fetchClasses = async () => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      setClasses([])
      return
    }

    const classList = Array.isArray(data) ? data : data.classes || []
    setClasses(classList)
  }

  const fetchParents = async () => {
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

    const parentList = Array.isArray(data) ? data : data.parents || []
    setParents(parentList)
  }

  useEffect(() => {
    const storedUser = getUser()
    setUser(storedUser)

    if (!storedUser) {
      router.push("/login")
      return
    }

    if (
      storedUser.role !== "SCHOOL_ADMIN" &&
      storedUser.role !== "SUPER_ADMIN"
    ) {
      router.push("/dashboard/students")
      return
    }

    const loadPage = async () => {
      try {
        setLoading(true)
        setError("")
        setSuccess("")

        await Promise.all([fetchStudent(), fetchClasses(), fetchParents()])
      } catch (err: any) {
        setError(err.message || "Failed to load student details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canEdit) {
      setError("You are not allowed to edit this student")
      return
    }

    if (!student?.id) {
      setError("Student not found")
      return
    }

    if (!form.name.trim()) {
      setError("Student name is required")
      return
    }

    if (!form.classId) {
      setError("Class is required")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const payload = {
        name: form.name.trim(),
        classId: Number(form.classId),
        parentId: form.parentId ? Number(form.parentId) : null,
      }

      const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update student")
      }

      setSuccess("Student updated successfully")
      setStudent(data)

      setTimeout(() => {
        router.push(`/dashboard/students/${student.id}`)
      }, 800)
    } catch (err: any) {
      setError(err.message || "Failed to update student")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading student for editing...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
          <p className="mt-1 text-gray-600">
            Update student information, class, and parent assignment
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/students/${student.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            View Profile
          </Link>

          <Link
            href="/dashboard/students"
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Current Student Info
          </h2>

          <div className="space-y-4">
            <InfoRow label="Name" value={student.name} />
            <InfoRow
              label="Student ID"
              value={student.studentId || String(student.id)}
            />
            <InfoRow label="Class" value={student.class?.name || "—"} />
            <InfoRow label="School" value={student.school?.name || "—"} />
            <InfoRow
              label="Parent"
              value={
                student.parent
                  ? `${student.parent.name}${student.parent.email ? ` (${student.parent.email})` : ""}`
                  : "Not assigned"
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Update Student
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Student Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter student name"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                value={form.classId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    classId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Parent
              </label>
              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    parentId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">No parent assigned</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                    {parent.email ? ` (${parent.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update Student"}
              </button>

              <Link
                href={`/dashboard/students/${student.id}`}
                className="rounded-lg border px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
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