"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type AttendanceItem = {
  id: string
  date: string
  status: string
}

type ResultItem = {
  id: string
  subject: string
  score: number
}

type Student = {
  id: string
  name: string
  studentId: string
  photo?: string | null
  school?: {
    name: string
  }
  classItem?: {
    name: string
  }
  attendance?: AttendanceItem[]
  results?: ResultItem[]
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()

  const rawId = params?.id
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId

  const [student, setStudent] = useState<Student | null>(null)
  const [subject, setSubject] = useState("")
  const [score, setScore] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingResult, setSavingResult] = useState(false)

  const fetchStudent = async () => {
    if (!studentId) return

    try {
      const res = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch student")
      }

      setStudent(data)
    } catch (error) {
      console.error(error)
      alert("Failed to load student profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchStudent()
    }
  }, [studentId])

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentId) return
    if (!subject || !score) {
      alert("Please fill subject and score")
      return
    }

    try {
      setSavingResult(true)

      const res = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          studentId,
          subject,
          score: Number(score),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to add result")
      }

      setSubject("")
      setScore("")
      fetchStudent()
    } catch (error) {
      console.error(error)
      alert("Failed to add result")
    } finally {
      setSavingResult(false)
    }
  }

  const handleDeleteResult = async (id: string) => {
    const confirmed = window.confirm("Delete this result?")
    if (!confirmed) return

    try {
      const res = await fetch(`${API_BASE_URL}/results/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete result")
      }

      fetchStudent()
    } catch (error) {
      console.error(error)
      alert("Failed to delete result")
    }
  }

  const downloadReportCard = async () => {
    if (!studentId) return

    try {
      const res = await fetch(`${API_BASE_URL}/report/${studentId}`, {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to generate report card")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (error) {
      console.error(error)
      alert("Failed to generate report card")
    }
  }

  const results = student?.results || []

  const averageScore = useMemo(() => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, item) => sum + item.score, 0)
    return Math.round((total / results.length) * 100) / 100
  }, [results])

  const grade = useMemo(() => {
    if (results.length === 0) return "-"
    if (averageScore >= 70) return "A"
    if (averageScore >= 60) return "B"
    if (averageScore >= 50) return "C"
    if (averageScore >= 45) return "D"
    return "F"
  }, [averageScore, results.length])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Loading student profile...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Student not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Profile</h1>

        <div className="flex gap-3">
          <button
            onClick={downloadReportCard}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Report Card PDF
          </button>

          <button
            onClick={() => router.push("/dashboard/students")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border flex flex-col items-center">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              No Photo
            </div>
          )}

          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-gray-500">Student ID: {student.studentId}</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-bold mb-4">Student Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-semibold">{student.name}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-semibold">{student.studentId}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">School</p>
              <p className="font-semibold">{student.school?.name || "-"}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-semibold">{student.classItem?.name || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">Attendance History</h2>

        {!student.attendance || student.attendance.length === 0 ? (
          <p>No attendance history found.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {student.attendance.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Results</h2>

          <div className="flex gap-4 text-sm">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              Average: <span className="font-bold">{averageScore}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              Grade: <span className="font-bold">{grade}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddResult} className="grid md:grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          />

          <input
            type="number"
            placeholder="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          />

          <button
            type="submit"
            disabled={savingResult}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {savingResult ? "Saving..." : "Add Result"}
          </button>
        </form>

        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Subject</th>
                <th className="border p-2 text-left">Score</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="border p-2">{r.subject}</td>
                  <td className="border p-2">{r.score}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteResult(r.id)}
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
  )
}