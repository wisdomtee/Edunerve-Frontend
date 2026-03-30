"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type ClassItem = {
  id: number
  name: string
  schoolId?: number
  teacherId?: number | null
  teacher?: {
    id: number
    name: string
  } | null
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

export default function CreateStudentPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    gender: "",
  })

  const canCreateStudent =
    user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN"

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

    const classesList = Array.isArray(data) ? data : data.classes || []
    setClasses(classesList)
  }

  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)

    const loadPage = async () => {
      try {
        setLoading(true)
        setError("")
        await fetchClasses()
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!formData.name.trim()) {
        throw new Error("Student name is required")
      }

      if (!formData.classId) {
        throw new Error("Please select a class")
      }

      const payload = {
        name: formData.name.trim(),
        classId: Number(formData.classId),
        gender: formData.gender || null,
      }

      const response = await fetch(`${API_BASE_URL}/students/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create student")
      }

      setSuccess("Student created successfully")

      setFormData({
        name: "",
        classId: "",
        gender: "",
      })

      setTimeout(() => {
        router.push("/dashboard/students")
      }, 800)
    } catch (err: any) {
      setError(err.message || "Failed to create student")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading create student page...</p>
        </div>
      </div>
    )
  }

  if (!canCreateStudent) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Access denied</h2>
          <p className="mt-2 text-red-600">
            Only school admins can create students.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/students"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Student</h1>
          <p className="mt-1 text-gray-600">
            Create a new student record for your school
          </p>
        </div>

        <Link
          href="/dashboard/students"
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Back
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

      <div className="max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Student Information
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student full name"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Class
            </label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              required
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {classes.length === 0 && (
            <div className="md:col-span-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
              No classes found yet. Create a class first before adding a student.
            </div>
          )}

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={saving || classes.length === 0}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}