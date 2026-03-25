"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = { id: number; name: string }
type Subject = { id: number; name: string }

type Result = {
  id: number
  score: number
  student?: { name: string }
  subject?: { name: string }
}

export default function ResultsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [studentId, setStudentId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [score, setScore] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes, resultsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/subjects`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/results`, { headers: getAuthHeaders() }),
      ])

      const studentsData = await studentsRes.json()
      const subjectsData = await subjectsRes.json()
      const resultsData = await resultsRes.json()

      setStudents(studentsData.students || studentsData || [])
      setSubjects(subjectsData.subjects || subjectsData || [])
      setResults(resultsData.results || resultsData || [])
    } catch {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const getGrade = (score: number) => {
    if (score >= 70) return "A"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    if (score >= 45) return "D"
    return "F"
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      const res = await fetch(`${API_BASE_URL}/results/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          score: Number(score),
        }),
      })

      if (!res.ok) throw new Error("Failed")

      setSuccess("Result added")
      setScore("")
      fetchData()
    } catch {
      setError("Failed to create result")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this result?")) return

    try {
      await fetch(`${API_BASE_URL}/results/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      fetchData()
    } catch {
      alert("Failed to delete")
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-2">
      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">Add Result</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full border p-3 rounded">
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full border p-3 rounded">
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Score"
            className="w-full border p-3 rounded"
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded">
            Add Result
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">All Results</h2>

        {results.length === 0 ? (
          <p>No results yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b">
                  <td>{r.student?.name}</td>
                  <td>{r.subject?.name}</td>
                  <td>{r.score}</td>
                  <td>{getGrade(r.score)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-500"
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