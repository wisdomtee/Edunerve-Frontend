"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: number
  name: string
}

type Subject = {
  id: number
  name: string
  school?: {
    id: number
    name: string
  } | null
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [name, setName] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")

      const [subjectsRes, schoolsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/schools`, {
          headers: getAuthHeaders(),
        }),
      ])

      const subjectsData = await subjectsRes.json()
      const schoolsData = await schoolsRes.json()

      console.log("SUBJECTS:", subjectsData)
      console.log("SCHOOLS:", schoolsData)

      if (!subjectsRes.ok) {
        throw new Error(subjectsData?.message || "Failed to fetch subjects")
      }

      if (!schoolsRes.ok) {
        throw new Error(schoolsData?.message || "Failed to fetch schools")
      }

      if (Array.isArray(subjectsData)) {
        setSubjects(subjectsData)
      } else if (Array.isArray(subjectsData.subjects)) {
        setSubjects(subjectsData.subjects)
      } else {
        setSubjects([])
      }

      if (Array.isArray(schoolsData)) {
        setSchools(schoolsData)
      } else if (Array.isArray(schoolsData.schools)) {
        setSchools(schoolsData.schools)
      } else {
        setSchools([])
      }
    } catch (err: any) {
      console.error("FETCH SUBJECTS ERROR:", err)
      setError(err.message || "Unable to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !schoolId) {
      setError("Subject name and school are required")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/subjects/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          schoolId: Number(schoolId),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create subject")
      }

      setSuccess("Subject created successfully")
      setName("")
      setSchoolId("")
      await fetchData()
    } catch (err: any) {
      console.error("CREATE SUBJECT ERROR:", err)
      setError(err.message || "Unable to create subject")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-3">
      {/* CREATE FORM */}
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Add Subject</h2>

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
              Subject Name
            </label>
            <input
              type="text"
              placeholder="Enter subject name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              required
            >
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Subject"}
          </button>
        </form>
      </div>

      {/* SUBJECT LIST */}
      <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Subjects</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : subjects.length === 0 ? (
          <p className="text-gray-500">No subjects found.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-lg border p-4">
                <p className="font-bold text-gray-800">{subject.name}</p>
                <p className="text-sm text-gray-500">
                  {subject.school?.name || "No school"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}