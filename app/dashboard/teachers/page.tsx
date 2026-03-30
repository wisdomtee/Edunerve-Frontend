"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/auth"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

type AppUser = {
  id?: number
  name?: string
  email?: string
  role?: UserRole | string
  schoolId?: number | null
}

type School = {
  id: number
  name: string
}

type TeacherItem = {
  id: number
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  schoolId: number
  school?: {
    id: number
    name: string
  } | null
  classes?: Array<{
    id: number
    name: string
  }>
  user?: {
    id: number
    name: string
    email: string
    role: string
  } | null
}

export default function TeachersPage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [schools, setSchools] = useState<School[]>([])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [schoolId, setSchoolId] = useState("")

  const [editingId, setEditingId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)

    if (currentUser?.schoolId) {
      setSchoolId(String(currentUser.schoolId))
    }

    fetchData(currentUser)
  }, [])

  const fetchData = async (currentUser?: AppUser | null) => {
    try {
      setLoading(true)
      setError("")

      const activeUser = currentUser || getUser()

      const requests: Promise<Response>[] = [
        fetch(`${API_BASE_URL}/teachers`, {
          headers: getAuthHeaders(),
        }),
      ]

      if (activeUser?.role === "SUPER_ADMIN") {
        requests.push(
          fetch(`${API_BASE_URL}/schools`, {
            headers: getAuthHeaders(),
          })
        )
      }

      const responses = await Promise.all(requests)
      const teachersRes = responses[0]
      const schoolsRes = responses.length > 1 ? responses[1] : null

      const teachersData = await teachersRes.json()

      if (!teachersRes.ok) {
        throw new Error(teachersData?.message || "Failed to fetch teachers")
      }

      if (Array.isArray(teachersData)) {
        setTeachers(teachersData)
      } else if (Array.isArray(teachersData.teachers)) {
        setTeachers(teachersData.teachers)
      } else {
        setTeachers([])
      }

      if (schoolsRes) {
        const schoolsData = await schoolsRes.json()

        if (!schoolsRes.ok) {
          throw new Error(schoolsData?.message || "Failed to fetch schools")
        }

        if (Array.isArray(schoolsData)) {
          setSchools(schoolsData)
        } else if (Array.isArray(schoolsData.schools)) {
          setSchools(schoolsData.schools)
        } else {
          setSchools([])
        }
      } else {
        setSchools([])
      }
    } catch (err: any) {
      console.error("FETCH TEACHERS ERROR:", err)
      setError(err.message || "Unable to load teachers page")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setPhone("")
    setSubject("")
    setEditingId(null)
    setError("")
    setSuccess("")

    if (user?.role === "SUPER_ADMIN") {
      setSchoolId("")
    } else {
      setSchoolId(user?.schoolId ? String(user.schoolId) : "")
    }
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const trimmedName = name.trim()
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedPhone = phone.trim()
      const trimmedSubject = subject.trim()

      if (!trimmedName || !trimmedEmail) {
        throw new Error("Name and email are required")
      }

      if (!editingId && !password.trim()) {
        throw new Error("Password is required when creating a teacher")
      }

      if (user?.role === "SUPER_ADMIN" && !schoolId) {
        throw new Error("Please select a school")
      }

      const payload: any = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        subject: trimmedSubject || null,
      }

      if (!editingId) {
        payload.password = password.trim()
      }

      if (user?.role === "SUPER_ADMIN") {
        payload.schoolId = Number(schoolId)
      } else if (user?.schoolId) {
        payload.schoolId = user.schoolId
      }

      const url = editingId
        ? `${API_BASE_URL}/teachers/${editingId}`
        : `${API_BASE_URL}/teachers/create`

      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save teacher")
      }

      setSuccess(
        editingId
          ? "Teacher updated successfully"
          : "Teacher created successfully"
      )

      resetForm()
      window.scrollTo({ top: 0, behavior: "smooth" })
      await fetchData(user)
    } catch (err: any) {
      console.error("SAVE TEACHER ERROR:", err)
      setError(err.message || "Unable to save teacher")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (teacher: TeacherItem) => {
    setEditingId(teacher.id)
    setName(teacher.name || "")
    setEmail(teacher.email || "")
    setPassword("")
    setPhone(teacher.phone || "")
    setSubject(teacher.subject || "")
    setSchoolId(String(teacher.schoolId || ""))
    setSuccess("")
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this teacher?"
    )

    if (!confirmed) return

    try {
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete teacher")
      }

      setSuccess("Teacher deleted successfully")
      await fetchData(user)
    } catch (err: any) {
      console.error("DELETE TEACHER ERROR:", err)
      setError(err.message || "Unable to delete teacher")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {editingId ? "Edit Teacher" : "Add Teacher"}
          </h2>

          {editingId && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              Editing
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter teacher name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter teacher email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          {!editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {user?.role === "SUPER_ADMIN" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                School
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
                disabled={!!editingId}
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {editingId && (
                <p className="mt-1 text-xs text-gray-500">
                  School cannot be changed during edit.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                ? "Update Teacher"
                : "Create Teacher"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-200 px-4 py-3 text-gray-700 transition hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Teachers ({teachers.length})
          </h2>

          {!loading && teachers.length > 0 && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Active Records
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No teachers found.</p>
            <p className="mt-1 text-sm text-gray-400">
              Add your first teacher using the form on the left.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-xl border border-gray-200 p-4 transition hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-800">
                      {teacher.name}
                    </p>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
                    <p className="text-sm text-gray-500">
                      Subject: {teacher.subject || "Not assigned"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Phone: {teacher.phone || "No phone"}
                    </p>
                    <p className="text-sm text-gray-500">
                      School: {teacher.school?.name || "No school"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Classes: {teacher.classes?.length || 0}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-sm text-white transition hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}