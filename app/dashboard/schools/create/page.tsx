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
  subscriptionPlan: "NORMAL" | "PRO"
  billingCycle: "monthly" | "yearly"
}

type ApiError = {
  message?: string
  error?: string
}

type CreateSchoolResponse = {
  message?: string
  school?: {
    id: number
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
    schoolCode: string
    plan?: string | null
    billingCycle?: string | null
    subscriptionStatus?: string | null
    billingState?: any
  }
  admin?: {
    id: number
    name: string
    email: string
    role: string
    mustChangePassword?: boolean
  }
  credentials?: {
    schoolCode: string
    email: string
    temporaryPassword: string
  }
  emailStatus?: {
    sent: boolean
    error?: string
  }
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
    subscriptionPlan: "NORMAL",
    billingCycle: "monthly",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [createdSchoolCode, setCreatedSchoolCode] = useState("")
  const [createdAdminEmail, setCreatedAdminEmail] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [emailSent, setEmailSent] = useState<boolean | null>(null)
  const [emailError, setEmailError] = useState("")
  const [showCredentials, setShowCredentials] = useState(false)

  const selectedPlanNote = useMemo(() => {
    if (form.subscriptionPlan === "PRO") {
      return "Pro plan gives the school access to more advanced features and higher usage limits."
    }
    return "Normal plan is suitable for smaller schools starting with the platform."
  }, [form.subscriptionPlan])

  const billingCycleNote = useMemo(() => {
    return form.billingCycle === "yearly"
      ? "Yearly billing is better for schools that want fewer payment cycles."
      : "Monthly billing is flexible and easier for schools starting out."
  }, [form.billingCycle])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetCreatedDetails = () => {
    setCreatedSchoolCode("")
    setCreatedAdminEmail("")
    setTemporaryPassword("")
    setEmailSent(null)
    setEmailError("")
    setShowCredentials(false)
  }

  const validateForm = () => {
    if (!form.name.trim()) return "School name is required"
    if (!form.address.trim()) return "School address is required"
    if (!form.phone.trim()) return "School phone is required"
    if (!form.email.trim()) return "School email is required"
    if (!form.adminName.trim()) return "Admin name is required"
    if (!form.adminEmail.trim()) return "Admin email is required"
    return ""
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    resetCreatedDetails()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)

      const token = getToken()

      const payload = {
        schoolName: form.name,
        address: form.address,
        phone: form.phone,
        schoolEmail: form.email,
        website: form.website || null,
        principalName: form.principalName || null,
        principalEmail: form.principalEmail || null,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        plan: form.subscriptionPlan,
        billingCycle: form.billingCycle,
        subscriptionStatus: "active",
      }

      const res = await fetch(`${API_BASE_URL}/school-onboarding/create-school`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data: CreateSchoolResponse = await res.json().catch(() => ({}))

      if (!res.ok) {
        const err = data as ApiError
        throw new Error(err.message || err.error || "Failed to create school")
      }

      setSuccess(data.message || "School onboarded successfully")

      setCreatedSchoolCode(data.credentials?.schoolCode || data.school?.schoolCode || "")
      setCreatedAdminEmail(data.credentials?.email || data.admin?.email || "")
      setTemporaryPassword(data.credentials?.temporaryPassword || "")
      setEmailSent(
        typeof data.emailStatus?.sent === "boolean" ? data.emailStatus.sent : null
      )
      setEmailError(data.emailStatus?.error || "")
      setShowCredentials(true)

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
        subscriptionPlan: "NORMAL",
        billingCycle: "monthly",
      })
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredentials = async () => {
    const text = `School Code: ${createdSchoolCode}
Admin Email: ${createdAdminEmail}
Temporary Password: ${temporaryPassword}`

    try {
      await navigator.clipboard.writeText(text)
      setSuccess("Credentials copied successfully")
    } catch {
      setError("Failed to copy credentials")
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
              Register a new school, create its admin account, and send onboarding
              credentials automatically.
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

              {showCredentials ? (
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-blue-900">
                        Onboarding Successful
                      </h3>
                      <p className="mt-1 text-sm text-blue-800">
                        The school has been created. Share these login details if
                        needed.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Copy Credentials
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        School Code
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-900">
                        {createdSchoolCode || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Admin Email
                      </p>
                      <p className="mt-2 break-all text-base font-bold text-slate-900">
                        {createdAdminEmail || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Temporary Password
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-900">
                        {temporaryPassword || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-blue-100">
                    <p className="text-sm font-medium text-slate-700">
                      Email Status:{" "}
                      <span
                        className={
                          emailSent
                            ? "text-green-700"
                            : emailSent === false
                            ? "text-amber-700"
                            : "text-slate-700"
                        }
                      >
                        {emailSent === true
                          ? "Email sent successfully"
                          : emailSent === false
                          ? "School created but email failed to send"
                          : "No email status returned"}
                      </span>
                    </p>

                    {emailError ? (
                      <p className="mt-2 text-sm text-red-600">{emailError}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/schools")}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Go to Schools
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSuccess("")
                        setShowCredentials(false)
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Create Another School
                    </button>
                  </div>
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

                <div className="md:col-span-2">
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
                  This admin will manage the school after creation. A temporary
                  password will be generated automatically and sent by email.
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

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Billing Cycle
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        form.billingCycle === "monthly"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingCycle"
                        value="monthly"
                        checked={form.billingCycle === "monthly"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Monthly
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Flexible recurring monthly billing.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        form.billingCycle === "yearly"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingCycle"
                        value="yearly"
                        checked={form.billingCycle === "yearly"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Yearly
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Better for long-term school subscriptions.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {billingCycleNote}
                  </div>
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
                  <p className="text-slate-500">Billing Cycle</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.billingCycle}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-lg font-semibold text-blue-900">Onboarding Flow</h3>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                This page sends a POST request to{" "}
                <span className="font-semibold">
                  /school-onboarding/create-school
                </span>
                . The backend should:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-blue-800">
                <li>create the school record</li>
                <li>create the school admin user</li>
                <li>generate a school code automatically</li>
                <li>generate a temporary password automatically</li>
                <li>create billing state details</li>
                <li>send onboarding email to the school admin</li>
              </ul>
            </div>

            {showCredentials ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="text-lg font-semibold text-emerald-900">
                  Latest Credentials
                </h3>
                <div className="mt-3 space-y-3 text-sm text-emerald-900">
                  <div>
                    <p className="text-emerald-700">School Code</p>
                    <p className="font-semibold">{createdSchoolCode || "-"}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Admin Email</p>
                    <p className="font-semibold break-all">
                      {createdAdminEmail || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Temporary Password</p>
                    <p className="font-semibold">{temporaryPassword || "-"}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}