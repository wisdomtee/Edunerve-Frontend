"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type School = {
  id: number
  name: string
  address: string
  phone?: string | null
  email?: string | null
  subscriptionStatus?: string | null
  createdAt?: string
  updatedAt?: string
  students?: { id: number }[]
  teachers?: { id: number }[]
  classes?: { id: number }[]
}

type UserData = {
  id?: number
  name?: string
  email?: string
  role?: string
  token?: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function SchoolsPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    subscriptionStatus: "active",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    try {
      const parsed: UserData = JSON.parse(storedUser)

      if (parsed.role !== "SUPER_ADMIN") {
        router.push("/login")
        return
      }

      setAuthorized(true)
    } catch {
      router.push("/login")
      return
    } finally {
      setCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    if (!authorized) return
    fetchSchools()
  }, [authorized])

  const filteredSchools = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) return schools

    return schools.filter((school) => {
      return (
        school.name?.toLowerCase().includes(query) ||
        school.address?.toLowerCase().includes(query) ||
        school.email?.toLowerCase().includes(query) ||
        school.phone?.toLowerCase().includes(query) ||
        school.subscriptionStatus?.toLowerCase().includes(query)
      )
    })
  }, [schools, search])

  function getAuthToken() {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return ""

    try {
      const parsed: UserData = JSON.parse(storedUser)
      return parsed.token || ""
    } catch {
      return ""
    }
  }

  function getAuthHeaders() {
    const token = getAuthToken()

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  async function fetchSchools() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/schools`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch schools")
      }

      setSchools(Array.isArray(data?.schools) ? data.schools : [])
    } catch (err: any) {
      setError(err.message || "Failed to load schools")
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim() || !form.address.trim()) {
      setError("School name and address are required")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/schools/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          subscriptionStatus: form.subscriptionStatus,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create school")
      }

      setSuccess("School created successfully")

      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        subscriptionStatus: "active",
      })

      await fetchSchools()
    } catch (err: any) {
      setError(err.message || "Failed to create school")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteSchool(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this school?"
    )

    if (!confirmed) return

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete school")
      }

      setSuccess("School deleted successfully")
      setSchools((prev) => prev.filter((school) => school.id !== id))
    } catch (err: any) {
      setError(err.message || "Failed to delete school")
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

  const activeSubscriptions = schools.filter(
    (school) => (school.subscriptionStatus || "").toLowerCase() === "active"
  ).length

  const inactiveSubscriptions = schools.filter(
    (school) => (school.subscriptionStatus || "").toLowerCase() !== "active"
  ).length

  const totalStudents = schools.reduce(
    (sum, school) => sum + (school.students?.length || 0),
    0
  )

  const totalTeachers = schools.reduce(
    (sum, school) => sum + (school.teachers?.length || 0),
    0
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools Management</h1>
          <p className="text-gray-600">
            Create, view, search, and manage all schools
          </p>
        </div>

        <button
          onClick={fetchSchools}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Schools" value={schools.length} />
        <StatCard title="Active Subscriptions" value={activeSubscriptions} />
        <StatCard title="Inactive Subscriptions" value={inactiveSubscriptions} />
        <StatCard title="Total Students" value={totalStudents} />
        <StatCard title="Total Teachers" value={totalTeachers} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Create New School</h2>

        <form
          onSubmit={handleCreateSchool}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              School Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter school name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              School Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="school@email.com"
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
            <label className="mb-1 block text-sm font-medium">
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address</label>
            <textarea
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Enter school address"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Create School"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">All Schools</h2>

          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 md:w-80"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading schools...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No schools found
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Address
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Students
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Teachers
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Classes
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {school.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.address}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.email || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.phone || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.students?.length || 0}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.teachers?.length || 0}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {school.classes?.length || 0}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          (school.subscriptionStatus || "").toLowerCase() ===
                          "active"
                            ? "bg-green-100 text-green-700"
                            : (school.subscriptionStatus || "").toLowerCase() ===
                              "trial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {school.subscriptionStatus || "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/schools/${school.id}`)
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDeleteSchool(school.id)}
                          disabled={deletingId === school.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === school.id ? "Deleting..." : "Delete"}
                        </button>
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