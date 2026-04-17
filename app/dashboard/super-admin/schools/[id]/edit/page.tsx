"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { API_BASE_URL, authFetch } from "@/lib/api"

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
}

export default function EditSchoolPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [form, setForm] = useState<Partial<School>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // FETCH SCHOOL
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/schools/${id}`)
        const data = await res.json()

        setForm(data)
      } catch (err: any) {
        setError("Failed to load school")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchSchool()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const res = await authFetch(`${API_BASE_URL}/schools/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          studentLimit: form.studentLimit
            ? Number(form.studentLimit)
            : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Update failed")
      }

      setSuccess("School updated successfully")

      setTimeout(() => {
        router.push("/dashboard/super-admin/schools")
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-600">
        Loading school...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard/super-admin/schools"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Schools
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Edit School
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
              {success}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="School Name"
              className="input"
            />

            <input
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              placeholder="Email"
              className="input"
            />

            <input
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              placeholder="Phone"
              className="input"
            />

            <input
              name="website"
              value={form.website || ""}
              onChange={handleChange}
              placeholder="Website"
              className="input"
            />

            <input
              name="principalName"
              value={form.principalName || ""}
              onChange={handleChange}
              placeholder="Principal Name"
              className="input"
            />

            <input
              name="principalEmail"
              value={form.principalEmail || ""}
              onChange={handleChange}
              placeholder="Principal Email"
              className="input"
            />

            <input
              name="studentLimit"
              type="number"
              value={form.studentLimit || ""}
              onChange={handleChange}
              placeholder="Student Limit"
              className="input"
            />

            <select
              name="subscriptionPlan"
              value={form.subscriptionPlan || "NORMAL"}
              onChange={handleChange}
              className="input"
            >
              <option value="NORMAL">Normal</option>
              <option value="PRO">Pro</option>
            </select>

            <select
              name="subscriptionStatus"
              value={form.subscriptionStatus || "active"}
              onChange={handleChange}
              className="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <textarea
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              placeholder="Address"
              className="input md:col-span-2"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold"
            >
              {saving ? "Saving..." : "Update School"}
            </button>

            <Link
              href="/dashboard/super-admin/schools"
              className="rounded-xl border px-5 py-3"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}