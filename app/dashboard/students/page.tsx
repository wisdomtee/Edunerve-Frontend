"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: number
  name: string
}

type ClassItem = {
  id: number
  name: string
}

type Student = {
  id: number
  name: string
  studentId?: string
  gender?: string
  photo?: string | null
  class?: {
    id?: number
    name: string
  } | null
  className?: string
  school?: {
    id?: number
    name: string
  } | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    classId: "",
    schoolId: "",
    photo: "",
  })

  useEffect(() => {
    fetchPageData()
  }, [])

  const fetchPageData = async () => {
    try {
      setLoading(true)
      setError("")

      const [studentsRes, schoolsRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/schools`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/classes`, {
          headers: getAuthHeaders(),
        }),
      ])

      const studentsData = await studentsRes.json()
      const schoolsData = await schoolsRes.json()
      const classesData = await classesRes.json()

      console.log("STUDENTS RESPONSE:", studentsData)
      console.log("SCHOOLS RESPONSE:", schoolsData)
      console.log("CLASSES RESPONSE:", classesData)

      if (!studentsRes.ok) {
        throw new Error(studentsData?.message || "Failed to fetch students")
      }

      if (Array.isArray(studentsData)) {
        setStudents(studentsData)
      } else if (Array.isArray(studentsData.students)) {
        setStudents(studentsData.students)
      } else {
        setStudents([])
      }

      if (schoolsRes.ok) {
        if (Array.isArray(schoolsData)) {
          setSchools(schoolsData)
        } else if (Array.isArray(schoolsData.schools)) {
          setSchools(schoolsData.schools)
        } else {
          setSchools([])
        }
      } else {
        setSchools([])
      }

      if (classesRes.ok) {
        if (Array.isArray(classesData)) {
          setClasses(classesData)
        } else if (Array.isArray(classesData.classes)) {
          setClasses(classesData.classes)
        } else {
          setClasses([])
        }
      } else {
        setClasses([])
      }
    } catch (err: any) {
      console.error("FETCH PAGE DATA ERROR:", err)
      setError(err.message || "Unable to load page data")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch students")
      }

      if (Array.isArray(data)) {
        setStudents(data)
      } else if (Array.isArray(data.students)) {
        setStudents(data.students)
      } else {
        setStudents([])
      }
    } catch (err: any) {
      console.error("FETCH STUDENTS ERROR:", err)
      setError(err.message || "Unable to refresh students")
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/students/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          studentId: formData.studentId,
          classId: Number(formData.classId),
          schoolId: Number(formData.schoolId),
          photo: formData.photo || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create student")
      }

      setSuccess("Student created successfully")

      setFormData({
        name: "",
        studentId: "",
        classId: "",
        schoolId: "",
        photo: "",
      })

      await fetchStudents()
    } catch (err: any) {
      console.error("CREATE STUDENT ERROR:", err)
      setError(err.message || "Unable to create student")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <p className="text-sm text-gray-500">Manage all registered students</p>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-1">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Add Student</h2>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Student Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter student name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter student ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                School
              </label>
              <select
                name="schoolId"
                value={formData.schoolId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              >
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Photo URL
              </label>
              <input
                type="text"
                name="photo"
                value={formData.photo}
                onChange={handleChange}
                placeholder="Optional photo URL"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Add Student"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Student List</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
              {students.length} Students
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Student ID</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Class</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">School</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {student.studentId || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {student.class?.name || student.className || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {student.school?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/report/${student.id}`}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            View Result
                          </Link>

                          <Link
                            href={`/dashboard/attendance?studentId=${student.id}`}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            Attendance
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}