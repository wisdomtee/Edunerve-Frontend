"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { API_BASE_URL, getToken } from "@/lib/api"

type FormData = {
  name: string
  address: string
  phone: string
  email: string
  website: string
  principalName: string
  principalEmail: string
  adminName: string
  adminEmail: string
  adminPassword: string
  subscriptionPlan: "NORMAL" | "PRO"
  studentLimit: string
}

type ApiError = {
  message?: string
  error?: string
}

export default function CreateSchoolPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    principalName: "",
    principalEmail: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    subscriptionPlan: "NORMAL",
    studentLimit: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const selectedPlanNote = useMemo(() => {
    if (form.subscriptionPlan === "PRO") {
      return "Pro plan gives the school access to more advanced features and higher usage limits."
    }
    return "Normal plan is suitable for smaller schools starting with the platform."
  }, [form.subscriptionPlan])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!form.name.trim()) return "School name is required"
    if (!form.address.trim()) return "School address is required"
    if (!form.phone.trim()) return "School phone is required"
    if (!form.email.trim()) return "School email is required"
    if (!form.adminName.trim()) return "Admin name is required"
    if (!form.adminEmail.trim()) return "Admin email is required"
    if (!form.adminPassword.trim()) return "Admin password is required"
    if (form.adminPassword.length < 6) return "Admin password must be at least 6 characters"
    return ""
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)

      const token = getToken()

      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website || null,
        principalName: form.principalName || null,
        principalEmail: form.principalEmail || null,
        subscriptionPlan: form.subscriptionPlan,
        studentLimit: form.studentLimit ? Number(form.studentLimit) : null,

        admin: {
          name: form.adminName,
          email: form.adminEmail,
          password: form.adminPassword,
        },
      }

      const res = await fetch(`${API_BASE_URL}/schools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const err = data as ApiError
        throw new Error(err.message || err.error || "Failed to create school")
      }

      setSuccess("School created successfully")

      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        principalName: "",
        principalEmail: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        subscriptionPlan: "NORMAL",
        studentLimit: "",
      })

      setTimeout(() => {
        router.push("/dashboard/schools")
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Super Admin</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Create New School
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Register a new school, assign its admin, and choose a subscription plan.
            </p>
          </div>

          <Link
            href="/dashboard/schools"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Back to Schools
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  School Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in the school details below.
                </p>
              </div>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    School Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Bright Future Academy"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter school address"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    School Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="school@email.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://schoolsite.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Student Limit
                  </label>
                  <input
                    type="number"
                    name="studentLimit"
                    value={form.studentLimit}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Principal Name
                  </label>
                  <input
                    type="text"
                    name="principalName"
                    value={form.principalName}
                    onChange={handleChange}
                    placeholder="Principal full name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Principal Email
                  </label>
                  <input
                    type="email"
                    name="principalEmail"
                    value={form.principalEmail}
                    onChange={handleChange}
                    placeholder="principal@email.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="my-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  School Admin Account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This admin will manage the school after creation.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={form.adminName}
                      onChange={handleChange}
                      placeholder="Admin full name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={form.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@email.com"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Admin Password
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={form.adminPassword}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Subscription Plan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the subscription type for this school.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      form.subscriptionPlan === "NORMAL"
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscriptionPlan"
                      value="NORMAL"
                      checked={form.subscriptionPlan === "NORMAL"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Normal
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Good for standard school operations.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Starter
                      </span>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      form.subscriptionPlan === "PRO"
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscriptionPlan"
                      value="PRO"
                      checked={form.subscriptionPlan === "PRO"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Pro
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Best for advanced analytics, billing, and scale.
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Premium
                      </span>
                    </div>
                  </label>
                </div>

                <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {selectedPlanNote}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating School..." : "Create School"}
                </button>

                <Link
                  href="/dashboard/schools"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Quick Summary</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">School</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.name || "No school name yet"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">Admin</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.adminName || "No admin name yet"}
                  </p>
                  <p className="text-slate-600">
                    {form.adminEmail || "No admin email yet"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">Plan</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.subscriptionPlan}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">Student Limit</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.studentLimit || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-lg font-semibold text-blue-900">Backend Note</h3>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                This UI sends a POST request to <span className="font-semibold">/schools</span>.
                Your backend should create:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-blue-800">
                <li>the school record</li>
                <li>the school admin user</li>
                <li>the subscription plan details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}