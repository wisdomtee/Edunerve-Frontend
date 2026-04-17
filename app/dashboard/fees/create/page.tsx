"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  API_BASE_URL,
  authFetch,
  getAuthHeaders,
  getUser,
} from "@/lib/api"

type User = {
  id?: number | string
  name?: string
  role?: string
  schoolId?: number | null
}

type School = {
  id: number
  name: string
}

type StudentClass =
  | string
  | {
      id?: number
      name?: string
      teacherId?: number | null
    }
  | null
  | undefined

type Student = {
  id: number
  name?: string
  firstName?: string
  lastName?: string
  studentId?: string
  admissionNo?: string
  class?: StudentClass
  className?: string
  schoolId?: number
}

function getStudentDisplayName(student: Student) {
  const joined = `${student.firstName || ""} ${student.lastName || ""}`.trim()
  return student.name || joined || `Student #${student.id}`
}

function getStudentClassName(student: Student) {
  if (typeof student.class === "string") {
    return student.class
  }

  if (student.class && typeof student.class === "object") {
    return student.class.name || "-"
  }

  return student.className || "-"
}

function getStudentCode(student: Student) {
  return student.studentId || student.admissionNo || "-"
}

export default function CreateInvoicePage() {
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState("")

  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const user = getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setCurrentUser(user)

    if (user.role === "SCHOOL_ADMIN" && user.schoolId) {
      setSelectedSchoolId(String(user.schoolId))
    }
  }, [router])

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const user = getUser()

        if (user?.role !== "SUPER_ADMIN") return

        setLoadingSchools(true)

        const res = await authFetch(`${API_BASE_URL}/schools`, {
          headers: getAuthHeaders(),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "Failed to load schools")
        }

        setSchools(Array.isArray(data) ? data : data.schools || [])
      } catch (err: any) {
        console.error("LOAD SCHOOLS ERROR:", err)
        setError(err.message || "Failed to load schools")
      } finally {
        setLoadingSchools(false)
      }
    }

    loadSchools()
  }, [])

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSchoolId) {
        setStudents([])
        setSelectedStudentId("")
        return
      }

      try {
        setLoadingStudents(true)
        setError("")

        const res = await authFetch(
          `${API_BASE_URL}/students?schoolId=${selectedSchoolId}`,
          {
            headers: getAuthHeaders(),
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "Failed to load students")
        }

        const incomingStudents = Array.isArray(data) ? data : data.students || []
        setStudents(incomingStudents)
      } catch (err: any) {
        console.error("LOAD STUDENTS ERROR:", err)
        setStudents([])
        setError(err.message || "Failed to load students")
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [selectedSchoolId])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return students

    return students.filter((student) => {
      const name = getStudentDisplayName(student).toLowerCase()
      const className = getStudentClassName(student).toLowerCase()
      const studentId = (student.studentId || "").toLowerCase()
      const admissionNo = (student.admissionNo || "").toLowerCase()

      return (
        name.includes(q) ||
        className.includes(q) ||
        studentId.includes(q) ||
        admissionNo.includes(q)
      )
    })
  }, [students, search])

  const selectedStudent = students.find(
    (student) => String(student.id) === selectedStudentId
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      if (!selectedSchoolId) {
        setError("Select a school")
        return
      }

      if (!selectedStudentId) {
        setError("Select a student")
        return
      }

      if (!title.trim()) {
        setError("Invoice title is required")
        return
      }

      if (!amount || Number(amount) <= 0) {
        setError("Enter a valid amount")
        return
      }

      if (!dueDate) {
        setError("Select due date")
        return
      }

      const payload = {
        studentId: Number(selectedStudentId),
        schoolId: Number(selectedSchoolId),
        title: title.trim(),
        amount: Number(amount),
        dueDate,
      }

      // ✅ changed from /fees/invoices to /billing/invoices
      const res = await authFetch(`${API_BASE_URL}/billing/invoices`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create invoice")
      }

      setSuccess("Invoice created successfully")

      setTimeout(() => {
        router.push("/dashboard/fees")
      }, 1000)
    } catch (err: any) {
      console.error("CREATE INVOICE ERROR:", err)
      setError(err.message || "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {currentUser?.role === "SUPER_ADMIN" && (
          <div>
            <label className="block mb-1 text-sm font-medium">
              Select School
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value)
                setSelectedStudentId("")
                setSearch("")
              }}
              className="w-full border rounded p-3"
              disabled={loadingSchools}
            >
              <option value="">
                {loadingSchools ? "Loading schools..." : "Select school"}
              </option>

              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium">
            Search Student
          </label>
          <input
            type="text"
            placeholder="Search by student name, class, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded p-3"
            disabled={!selectedSchoolId}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            Select Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full border rounded p-3"
            disabled={!selectedSchoolId || loadingStudents}
          >
            <option value="">
              {loadingStudents
                ? "Loading students..."
                : !selectedSchoolId
                ? "Select school first"
                : "Select student"}
            </option>

            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {getStudentDisplayName(student)} - {getStudentClassName(student)}
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="rounded bg-blue-50 border border-blue-100 p-4 text-sm space-y-1">
            <p>
              <strong>Name:</strong> {getStudentDisplayName(selectedStudent)}
            </p>
            <p>
              <strong>Class:</strong> {getStudentClassName(selectedStudent)}
            </p>
            <p>
              <strong>Student ID:</strong> {getStudentCode(selectedStudent)}
            </p>
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium">
            Invoice Title
          </label>
          <input
            type="text"
            placeholder="e.g. First Term School Fees"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Amount</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded p-3"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-70"
        >
          {submitting ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  )
}