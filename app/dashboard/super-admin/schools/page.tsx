"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { API_BASE_URL, authFetch, getUser } from "@/lib/api"

type School = {
  id: number | string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  principalName?: string | null
  principalEmail?: string | null
  subscriptionPlan?: "NORMAL" | "PRO" | string | null
  subscriptionStatus?: string | null
  studentLimit?: number | null
  createdAt?: string
  updatedAt?: string
  admin?: {
    id?: number | string
    name?: string | null
    email?: string | null
  } | null
  _count?: {
    students?: number
    teachers?: number
    classes?: number
  }
}

type SchoolsResponse =
  | School[]
  | {
      schools?: School[]
      data?: School[]
    }

export default function SuperAdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  const currentUser = getUser()

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await authFetch(`${API_BASE_URL}/schools`, {
        method: "GET",
      })

      const data: SchoolsResponse = await res.json()

      const schoolList = Array.isArray(data)
        ? data
        : Array.isArray(data?.schools)
        ? data.schools
        : Array.isArray(data?.data)
        ? data.data
        : []

      setSchools(schoolList)
    } catch (err: any) {
      setError(err.message || "Failed to load schools")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return schools

    return schools.filter((school) => {
      const values = [
        school.name,
        school.address,
        school.email,
        school.phone,
        school.website,
        school.principalName,
        school.principalEmail,
        school.subscriptionPlan,
        school.subscriptionStatus,
        school.admin?.name,
        school.admin?.email,
      ]

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term)
      )
    })
  }, [schools, search])

  const handleDelete = async (school: School) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${school.name}"?`
    )

    if (!confirmed) return

    try {
      setDeletingId(school.id)
      setError("")
      setSuccess("")

      const res = await authFetch(`${API_BASE_URL}/schools/${school.id}`, {
        method: "DELETE",
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete school")
      }

      setSchools((prev) => prev.filter((item) => item.id !== school.id))
      setSuccess(`${school.name} deleted successfully`)
    } catch (err: any) {
      setError(err.message || "Failed to delete school")
    } finally {
      setDeletingId(null)
    }
  }

  const getPlanBadge = (plan?: string | null) => {
    const normalized = String(plan || "NORMAL").toUpperCase()

    if (normalized === "PRO") {
      return "bg-blue-100 text-blue-700 border-blue-200"
    }

    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  const getStatusBadge = (status?: string | null) => {
    const normalized = String(status || "active").toLowerCase()

    if (normalized === "active") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    }

    if (normalized === "inactive") {
      return "bg-amber-100 text-amber-700 border-amber-200"
    }

    if (normalized === "suspended") {
      return "bg-red-100 text-red-700 border-red-200"
    }

    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            Only super admins can view this page.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Super Admin</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Schools Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage all schools, monitor their plans, and update their records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={fetchSchools}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Refresh
            </button>

            <Link
              href="/dashboard/super-admin/schools/create"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Create School
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Schools</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {schools.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Normal Plan</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                schools.filter(
                  (school) =>
                    String(school.subscriptionPlan || "")
                      .toUpperCase()
                      .trim() === "NORMAL"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pro Plan</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                schools.filter(
                  (school) =>
                    String(school.subscriptionPlan || "")
                      .toUpperCase()
                      .trim() === "PRO"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Schools</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                schools.filter(
                  (school) =>
                    String(school.subscriptionStatus || "active")
                      .toLowerCase()
                      .trim() === "active"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  All Schools
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search and manage registered schools.
                </p>
              </div>

              <div className="w-full lg:w-[360px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by school, email, admin, plan..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="p-6">
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="h-5 w-48 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
                    <div className="mt-4 flex gap-3">
                      <div className="h-8 w-20 rounded-full bg-slate-100" />
                      <div className="h-8 w-20 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No schools found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {search.trim()
                    ? "No school matched your search."
                    : "No schools have been created yet."}
                </p>

                <div className="mt-6">
                  <Link
                    href="/dashboard/super-admin/schools/create"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create First School
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        School
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Admin
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Limits / Counts
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSchools.map((school) => (
                      <tr
                        key={school.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5 align-top">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {school.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {school.address || "No address"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              ID: {school.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{school.email || "No email"}</p>
                            <p>{school.phone || "No phone"}</p>
                            <p className="truncate">
                              {school.website || "No website"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="font-medium text-slate-800">
                              {school.admin?.name ||
                                school.principalName ||
                                "No admin"}
                            </p>
                            <p>
                              {school.admin?.email ||
                                school.principalEmail ||
                                "No admin email"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getPlanBadge(
                                school.subscriptionPlan
                              )}`}
                            >
                              {String(
                                school.subscriptionPlan || "NORMAL"
                              ).toUpperCase()}
                            </span>

                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                                school.subscriptionStatus
                              )}`}
                            >
                              {school.subscriptionStatus || "active"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>
                              Student Limit:{" "}
                              <span className="font-medium text-slate-900">
                                {school.studentLimit ?? "Not set"}
                              </span>
                            </p>
                            <p>
                              Students:{" "}
                              <span className="font-medium text-slate-900">
                                {school._count?.students ?? 0}
                              </span>
                            </p>
                            <p>
                              Teachers:{" "}
                              <span className="font-medium text-slate-900">
                                {school._count?.teachers ?? 0}
                              </span>
                            </p>
                            <p>
                              Classes:{" "}
                              <span className="font-medium text-slate-900">
                                {school._count?.classes ?? 0}
                              </span>
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/super-admin/schools/${school.id}/edit`}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </Link>

                            <button
                              onClick={() => handleDelete(school)}
                              disabled={deletingId === school.id}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingId === school.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {filteredSchools.map((school) => (
                  <div
                    key={school.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {school.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {school.address || "No address"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPlanBadge(
                              school.subscriptionPlan
                            )}`}
                          >
                            {String(
                              school.subscriptionPlan || "NORMAL"
                            ).toUpperCase()}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              school.subscriptionStatus
                            )}`}
                          >
                            {school.subscriptionStatus || "active"}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Contact
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>{school.email || "No email"}</p>
                            <p>{school.phone || "No phone"}</p>
                            <p>{school.website || "No website"}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Admin
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p className="font-medium text-slate-800">
                              {school.admin?.name ||
                                school.principalName ||
                                "No admin"}
                            </p>
                            <p>
                              {school.admin?.email ||
                                school.principalEmail ||
                                "No admin email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Student Limit</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {school.studentLimit ?? "Not set"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Students</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {school._count?.students ?? 0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Teachers</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {school._count?.teachers ?? 0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Classes</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {school._count?.classes ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/dashboard/super-admin/schools/${school.id}/edit`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit School
                        </Link>

                        <button
                          onClick={() => handleDelete(school)}
                          disabled={deletingId === school.id}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === school.id
                            ? "Deleting..."
                            : "Delete School"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}