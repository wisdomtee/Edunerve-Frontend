"use client"

import { useEffect, useMemo, useState } from "react"
import { getToken } from "@/lib/auth"

type Teacher = {
  id: string
  name: string
  email: string
  subject: string
  schoolId: string
  school?: {
    id: string
    name: string
    address?: string
  }
  createdAt?: string
}

type School = {
  id: string
  name: string
  address?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    schoolId: "",
  })

  const token = useMemo(() => getToken(), [])

  const fetchTeachers = async () => {
    const res = await fetch(`${API_BASE_URL}/teachers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch teachers")
    }

    setTeachers(Array.isArray(data) ? data : [])
  }

  const fetchSchools = async () => {
    const res = await fetch(`${API_BASE_URL}/schools`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch schools")
    }

    setSchools(Array.isArray(data) ? data : [])
  }

  const loadPage = async () => {
    try {
      setLoading(true)
      setError("")

      if (!token) {
        throw new Error("No authentication token found. Please login again.")
      }

      await Promise.all([fetchTeachers(), fetchSchools()])
    } catch (err: any) {
      setError(err.message || "Failed to load page")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")

      if (!token) {
        throw new Error("No authentication token found. Please login again.")
      }

      const res = await fetch(`${API_BASE_URL}/teachers/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create teacher")
      }

      setForm({
        name: "",
        email: "",
        password: "",
        subject: "",
        schoolId: "",
      })

      alert(data.message || "Teacher created successfully")
      await fetchTeachers()
    } catch (err: any) {
      setError(err.message || "Failed to create teacher")
      alert(err.message || "Failed to create teacher")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
        <p className="mt-2 text-gray-600">
          Add and manage teachers in your school system.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Add Teacher
            </h2>

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter teacher name"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter teacher email"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Enter subject"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School
                </label>
                <select
                  name="schoolId"
                  value={form.schoolId}
                  onChange={handleChange}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Add Teacher"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Teachers List
              </h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {teachers.length} Teachers
              </span>
            </div>

            {loading ? (
              <p className="text-gray-600">Loading teachers...</p>
            ) : teachers.length === 0 ? (
              <p className="text-gray-600">No teachers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="border px-4 py-3">Name</th>
                      <th className="border px-4 py-3">Email</th>
                      <th className="border px-4 py-3">Subject</th>
                      <th className="border px-4 py-3">School</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="border px-4 py-3">{teacher.name}</td>
                        <td className="border px-4 py-3">{teacher.email}</td>
                        <td className="border px-4 py-3">{teacher.subject}</td>
                        <td className="border px-4 py-3">
                          {teacher.school?.name || "N/A"}
                        </td>
                      </tr>
                    ))}
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