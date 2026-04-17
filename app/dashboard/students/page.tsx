"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type ClassItem = {
  id: number
  name: string
}

type ParentItem = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  schoolId?: number | null
  createdAt?: string
}

type Student = {
  id: number
  name: string
  studentId?: string | null
  email?: string | null
  phone?: string | null
  gender?: string | null
  classId?: number | null
  parentId?: number | null
  schoolId?: number | null
  createdAt?: string
  class?: {
    id: number
    name: string
  } | null
  parent?: {
    id: number
    name: string
    email?: string | null
  } | null
}

type AppUser = {
  id?: number | string
  name?: string
  email?: string
  role?: string
  schoolId?: number | null
}

export default function StudentsPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [parents, setParents] = useState<ParentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [classesLoading, setClassesLoading] = useState(true)
  const [parentsLoading, setParentsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [selectedClassFilter, setSelectedClassFilter] = useState("all")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    gender: "",
    classId: "",
    parentId: "",
  })

  const isTeacher = currentUser?.role === "TEACHER"
  const canManageStudents =
    currentUser?.role === "SCHOOL_ADMIN" || currentUser?.role === "SUPER_ADMIN"

  useEffect(() => {
    const user = getUser()

    if (!user) {
      router.push("/login")
      return
    }

    if (
      user.role !== "SCHOOL_ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "TEACHER"
    ) {
      router.push("/login")
      return
    }

    setCurrentUser(user)
    setAuthorized(true)
    setCheckingAuth(false)
  }, [router])

  useEffect(() => {
    if (!authorized) return
    fetchStudents()
    fetchClasses()
    if (canManageStudents) {
      fetchParents()
    }
  }, [authorized, canManageStudents])

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim()

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.studentId?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query) ||
        student.gender?.toLowerCase().includes(query) ||
        student.class?.name?.toLowerCase().includes(query) ||
        student.parent?.name?.toLowerCase().includes(query) ||
        student.parent?.email?.toLowerCase().includes(query)

      const matchesClass =
        selectedClassFilter === "all" ||
        String(student.classId || "") === selectedClassFilter

      return matchesSearch && matchesClass
    })
  }, [students, search, selectedClassFilter])

  async function fetchStudents() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch students")
      }

      let list: Student[] = []

      if (Array.isArray(data)) {
        list = data
      } else if (Array.isArray(data?.students)) {
        list = data.students
      }

      setStudents(list)
    } catch (err: any) {
      setError(err.message || "Failed to load students")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchClasses() {
    try {
      setClassesLoading(true)

      const res = await fetch(`${API_BASE_URL}/classes`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch classes")
      }

      let list: ClassItem[] = []

      if (Array.isArray(data)) {
        list = data
      } else if (Array.isArray(data?.classes)) {
        list = data.classes
      }

      setClasses(list)
    } catch (err) {
      console.error("Fetch classes error:", err)
      setClasses([])
    } finally {
      setClassesLoading(false)
    }
  }

  async function fetchParents() {
    try {
      setParentsLoading(true)

      const res = await fetch(`${API_BASE_URL}/students/parents`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch parents")
      }

      let list: ParentItem[] = []

      if (Array.isArray(data)) {
        list = data
      } else if (Array.isArray(data?.parents)) {
        list = data.parents
      }

      setParents(list)
    } catch (err) {
      console.error("Fetch parents error:", err)
      setParents([])
    } finally {
      setParentsLoading(false)
    }
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault()

    if (!canManageStudents) {
      setError("You are not allowed to create students")
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
      setSubmitting(true)
      setError("")
      setSuccess("")

      const payload = {
        name: form.name.trim(),
        studentId: form.studentId.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        gender: form.gender.trim() || undefined,
        classId: form.classId ? Number(form.classId) : undefined,
        parentId: form.parentId ? Number(form.parentId) : undefined,
      }

      const res = await fetch(`${API_BASE_URL}/students/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create student")
      }

      setSuccess("Student created successfully")
      setForm({
        name: "",
        studentId: "",
        email: "",
        phone: "",
        gender: "",
        classId: "",
        parentId: "",
      })

      await fetchStudents()
    } catch (err: any) {
      setError(err.message || "Failed to create student")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteStudent(id: number) {
    if (!canManageStudents) {
      setError("You are not allowed to delete students")
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    )

    if (!confirmed) return

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete student")
      }

      setStudents((prev) => prev.filter((student) => student.id !== id))
      setSuccess("Student deleted successfully")
    } catch (err: any) {
      setError(err.message || "Failed to delete student")
    } finally {
      setDeletingId(null)
    }
  }

  if (checkingAuth || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Checking access...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isTeacher ? "My Students" : "Students Management"}
          </h1>
          <p className="text-gray-600">
            {isTeacher
              ? "View students in your assigned classes"
              : "Create, view, filter, and manage students in your school"}
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Students" value={students.length} />
        <StatCard
          title="Students With Class"
          value={students.filter((student) => !!student.classId).length}
        />
        <StatCard
          title="Assigned Parents"
          value={students.filter((student) => !!student.parentId).length}
        />
        <StatCard
          title="Unassigned Parents"
          value={students.filter((student) => !student.parentId).length}
        />
      </div>

      {canManageStudents && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Create New Student</h2>

          <form
            onSubmit={handleCreateStudent}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Student ID
              </label>
              <input
                type="text"
                value={form.studentId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, studentId: e.target.value }))
                }
                placeholder="Enter student ID (optional)"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="student@email.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <select
                value={form.classId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, classId: e.target.value }))
                }
                disabled={classesLoading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {classesLoading ? "Loading classes..." : "Select class"}
                </option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Parent</label>
              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, parentId: e.target.value }))
                }
                disabled={parentsLoading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {parentsLoading ? "Loading parents..." : "Select parent (optional)"}
                </option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                    {parent.email ? ` - ${parent.email}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create Student"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">
            {isTeacher ? "My Students" : "All Students"}
          </h2>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 md:w-72"
            />

            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">
                {isTeacher ? "My Classes" : "All Classes"}
              </option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No students found
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Student ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {student.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.studentId || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.gender || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.class?.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.parent?.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.email || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {student.phone || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/students/${student.id}`)
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                        >
                          View
                        </button>

                        {canManageStudents && (
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            disabled={deletingId === student.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingId === student.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  )
}