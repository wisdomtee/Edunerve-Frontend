"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: number
  name: string
  address: string
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/schools`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()
      console.log("SCHOOLS RESPONSE:", data)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch schools")
      }

      if (Array.isArray(data)) {
        setSchools(data)
      } else if (Array.isArray(data.schools)) {
        setSchools(data.schools)
      } else {
        setSchools([])
      }
    } catch (err: any) {
      console.error("FETCH SCHOOLS ERROR:", err)
      setError(err.message || "Unable to load schools")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/schools/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, address }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create school")
      }

      setSuccess("School created successfully")
      setName("")
      setAddress("")
      await fetchSchools()
    } catch (err: any) {
      console.error("CREATE SCHOOL ERROR:", err)
      setError(err.message || "Unable to create school")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Add School</h2>

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

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School Name
            </label>
            <input
              type="text"
              placeholder="Enter school name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              placeholder="Enter school address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create School"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Schools</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : schools.length === 0 ? (
          <p className="text-gray-500">No schools found.</p>
        ) : (
          <div className="space-y-3">
            {schools.map((school) => (
              <div key={school.id} className="rounded-lg border p-4">
                <p className="font-bold text-gray-800">{school.name}</p>
                <p className="text-sm text-gray-500">{school.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}