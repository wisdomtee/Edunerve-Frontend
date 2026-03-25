"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string
  gender?: string
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

type ResultItem = {
  id: number
  score: number | string
  term?: string | null
  session?: string | null
  subject?: {
    id?: number
    name: string
  } | null
  teacher?: {
    id?: number
    name: string
  } | null
}

export default function StudentReportPage() {
  const params = useParams()
  const id = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")

      const [studentRes, resultsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students/${id}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/results/student/${id}`, {
          headers: getAuthHeaders(),
        }),
      ])

      if (!studentRes.ok) {
        throw new Error("Failed to fetch student")
      }

      const studentData = await studentRes.json()

      if (studentData?.student) {
        setStudent(studentData.student)
      } else {
        setStudent(studentData)
      }

      if (resultsRes.ok) {
        const resultsData = await resultsRes.json()

        if (Array.isArray(resultsData)) {
          setResults(resultsData)
        } else if (Array.isArray(resultsData.results)) {
          setResults(resultsData.results)
        } else {
          setResults([])
        }
      } else {
        setResults([])
      }
    } catch (err) {
      console.error(err)
      setError("Unable to load student report")
    } finally {
      setLoading(false)
    }
  }

  const processedResults = useMemo(() => {
    return results.map((item) => {
      const score = Number(item.score) || 0
      const subjectName = item.subject?.name || "Unknown Subject"

      let grade = "F"
      if (score >= 70) grade = "A"
      else if (score >= 60) grade = "B"
      else if (score >= 50) grade = "C"
      else if (score >= 45) grade = "D"

      return {
        ...item,
        score,
        subjectName,
        grade,
      }
    })
  }, [results])

  const averageScore = useMemo(() => {
    if (processedResults.length === 0) return 0
    const total = processedResults.reduce((sum, item) => sum + item.score, 0)
    return total / processedResults.length
  }, [processedResults])

  const overallGrade = useMemo(() => {
    if (averageScore >= 70) return "A"
    if (averageScore >= 60) return "B"
    if (averageScore >= 50) return "C"
    if (averageScore >= 45) return "D"
    return "F"
  }, [averageScore])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Student not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Report</h1>
          <p className="mt-1 text-gray-600">
            View student academic performance and summary
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Print Report
        </button>
      </div>

      <div
        id="print-area"
        className="rounded-2xl bg-white p-6 shadow print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="mb-8 border-b pb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Student Report Card</h1>
          <p className="mt-2 text-gray-600">
            {student.school?.name || "EduNerve School System"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Academic Performance Summary
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Student Name</p>
            <h2 className="mt-2 text-lg font-bold text-gray-800">{student.name}</h2>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Student ID</p>
            <h2 className="mt-2 text-lg font-bold text-gray-800">
              {student.studentId || "-"}
            </h2>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Class</p>
            <h2 className="mt-2 text-lg font-bold text-gray-800">
              {student.class?.name || student.className || "-"}
            </h2>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">School</p>
            <h2 className="mt-2 text-lg font-bold text-gray-800">
              {student.school?.name || "-"}
            </h2>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-blue-50 p-5">
            <p className="text-sm text-gray-600">Subjects Taken</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-700">
              {processedResults.length}
            </h2>
          </div>

          <div className="rounded-2xl border bg-green-50 p-5">
            <p className="text-sm text-gray-600">Average Score</p>
            <h2 className="mt-2 text-2xl font-bold text-green-700">
              {averageScore.toFixed(1)}%
            </h2>
          </div>

          <div className="rounded-2xl border bg-purple-50 p-5">
            <p className="text-sm text-gray-600">Overall Grade</p>
            <h2 className="mt-2 text-2xl font-bold text-purple-700">
              {overallGrade}
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Result Details</h2>

          {processedResults.length === 0 ? (
            <p className="text-gray-500">No result found for this student.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-100 text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Score</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Remark</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Term</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {processedResults.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.subjectName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{item.score}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        {item.grade}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.score >= 50 ? "Passed" : "Failed"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.term || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.session || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-12 text-sm text-gray-500">Teacher's Signature</p>
            <div className="border-t border-gray-400 pt-2 text-sm text-gray-700">
              Signature
            </div>
          </div>

          <div>
            <p className="mb-12 text-sm text-gray-500">Principal's Signature</p>
            <div className="border-t border-gray-400 pt-2 text-sm text-gray-700">
              Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}