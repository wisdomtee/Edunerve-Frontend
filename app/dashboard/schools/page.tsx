"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"
import RoleGuard from "@/app/components/RoleGuard" // ✅ ADD THIS

type School = {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  createdAt?: string
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/schools`, {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch schools")
      }

      const data = await res.json()
      setSchools(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch schools")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCreateSchool = async (e: any) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/schools/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || "Failed to create school")
      }

      setSuccess("School created successfully")

      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
      })

      fetchSchools()
    } catch (err: any) {
      setError(err.message || "Failed to create school")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchool = async (id: number) => {
    if (!confirm("Delete this school?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to delete school")
      }

      setSchools((prev) => prev.filter((s) => s.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      {/* ✅ EVERYTHING BELOW IS YOUR ORIGINAL UI */}
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Schools</h1>

        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form
            onSubmit={handleCreateSchool}
            className="bg-white p-4 rounded-xl border space-y-3"
          >
            <h2 className="font-semibold">Add School</h2>

            <input name="name" value={formData.name} onChange={handleChange} placeholder="School Name" required className="w-full border p-2 rounded" />
            <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="w-full border p-2 rounded" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full border p-2 rounded" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded" />

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2 rounded">
              {submitting ? "Creating..." : "Create School"}
            </button>
          </form>

          <div className="md:col-span-2 bg-white rounded-xl border overflow-hidden">
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : schools.length === 0 ? (
              <div className="p-4">No schools found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr key={school.id} className="border-t">
                      <td className="p-3">{school.name}</td>
                      <td className="p-3">{school.phone || "-"}</td>
                      <td className="p-3 flex gap-2">
                        <Link href={`/dashboard/schools/${school.id}`} className="bg-blue-600 text-white px-3 py-1 rounded">
                          View
                        </Link>

                        <button
                          onClick={() => handleDeleteSchool(school.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}