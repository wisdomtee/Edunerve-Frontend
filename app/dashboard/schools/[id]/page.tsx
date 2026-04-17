"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string
  gender?: string
  class?: {
    id: number
    name: string
  } | null
}

type Teacher = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  subject?: string | null
}

type ClassItem = {
  id: number
  name: string
}

type School = {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  subscriptionStatus?: string | null
  createdAt?: string
  updatedAt?: string
  students?: Student[]
  teachers?: Teacher[]
  classes?: ClassItem[]
}

type UserData = {
  id?: number
  name?: string
  email?: string
  role?: string
  schoolId?: number
  token?: string
}

export default function SchoolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    subscriptionStatus: "active",
  })

  const canEdit = useMemo(() => {
    return (
      user?.role === "SUPER_ADMIN" ||
      user?.role === "SCHOOL_ADMIN"
    )
  }, [user])

  const canManageSubscription = useMemo(() => {
    return user?.role === "SUPER_ADMIN"
  }, [user])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    try {
      const parsed: UserData = JSON.parse(storedUser)

      if (
        parsed.role !== "SUPER_ADMIN" &&
        parsed.role !== "SCHOOL_ADMIN" &&
        parsed.role !== "TEACHER" &&
        parsed.role !== "PARENT"
      ) {
        router.push("/login")
        return
      }

      setUser(parsed)
    } catch {
      router.push("/login")
      return
    } finally {
      setCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const res = await fetch(`${API_BASE_URL}/schools/${id}`, {
          headers: getAuthHeaders(),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.message || "Failed to load school")
        }

        const data: School = await res.json()

        setSchool(data)
        setForm({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          subscriptionStatus: data.subscriptionStatus || "active",
        })
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    if (id && !checkingAuth) {
      fetchSchool()
    }
  }, [id, checkingAuth])

  async function handleUpdateSchool(e: React.FormEvent) {
    e.preventDefault()

    if (!school) return

    if (!form.name.trim() || !form.address.trim()) {
      setError("School name and address are required")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const payload: any = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      }

      if (canManageSubscription) {
        payload.subscriptionStatus = form.subscriptionStatus
      }

      const res = await fetch(`${API_BASE_URL}/schools/${school.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update school")
      }

      setSchool((prev) =>
        prev
          ? {
              ...prev,
              ...data,
            }
          : data
      )

      setSuccess("School updated successfully")
    } catch (err: any) {
      setError(err.message || "Failed to update school")
    } finally {
      setSaving(false)
    }
  }

  if (checkingAuth || loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading school details...</div>
      </div>
    )
  }

  if (error && !school) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
          School not found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Details</h1>
          <p className="text-sm text-gray-600">
            View and manage school information
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Students" value={school.students?.length || 0} />
        <StatCard title="Teachers" value={school.teachers?.length || 0} />
        <StatCard title="Classes" value={school.classes?.length || 0} />
        <StatCard
          title="Status"
          value={(school.subscriptionStatus || "inactive").toUpperCase()}
          isText
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              School Information
            </h2>
          </div>

          {canEdit ? (
            <form onSubmit={handleUpdateSchool} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="Enter school name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="school@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              {canManageSubscription ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subscription Status
                  </label>
                  <select
                    value={form.subscriptionStatus}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        subscriptionStatus: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="active">active</option>
                    <option value="trial">trial</option>
                    <option value="inactive">inactive</option>
                    <option value="expired">expired</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subscription Status
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700">
                    {school.subscriptionStatus || "inactive"}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="Enter school address"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Update School"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <span className="font-medium">Name:</span> {school.name || "-"}
              </div>
              <div>
                <span className="font-medium">Email:</span> {school.email || "-"}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {school.phone || "-"}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {school.subscriptionStatus || "-"}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Address:</span> {school.address || "-"}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Summary</h2>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Total Students</span>
              <span className="font-semibold">{school.students?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Teachers</span>
              <span className="font-semibold">{school.teachers?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Classes</span>
              <span className="font-semibold">{school.classes?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Subscription</span>
              <span className="font-semibold">
                {school.subscriptionStatus || "inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Classes</h3>

        {!school.classes || school.classes.length === 0 ? (
          <p className="text-sm text-gray-600">No classes found for this school.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {school.classes.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                {item.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Teachers</h3>

        {!school.teachers || school.teachers.length === 0 ? (
          <p className="text-sm text-gray-600">No teachers found for this school.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody>
                {school.teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{teacher.name}</td>
                    <td className="px-4 py-3">{teacher.email || "-"}</td>
                    <td className="px-4 py-3">{teacher.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Students</h3>

        {!school.students || school.students.length === 0 ? (
          <p className="text-sm text-gray-600">No students found for this school.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Student ID</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {school.students.map((student) => (
                  <tr key={student.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{student.studentId || "-"}</td>
                    <td className="px-4 py-3">{student.gender || "-"}</td>
                    <td className="px-4 py-3">{student.class?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        View Student
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  isText = false,
}: {
  title: string
  value: number | string
  isText?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className={`${isText ? "text-lg" : "text-2xl"} mt-2 font-bold text-gray-900`}>
        {value}
      </h3>
    </div>
  )
}