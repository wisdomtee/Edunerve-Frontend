"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: number
  name: string
}

type ClassType = {
  id: number
  name: string
}

type Subject = {
  id: number
  name: string
}

type Teacher = {
  id: number
  name: string
}

type Result = {
  id: number
  score: number
  createdAt?: string
  term?: string | null
  session?: string | null
  subject?: Subject
  teacher?: Teacher
}

type Attendance = {
  id: number
  date: string
  status: string
}

type Student = {
  id: number
  name: string
  studentId: string
  gender?: string | null
  photo?: string | null
  createdAt?: string
  teacherRemark?: string | null
  principalRemark?: string | null
  school?: School
  class?: ClassType
  results?: Result[]
  attendance?: Attendance[]
}

type RankingItem = {
  id: number
  name: string
  studentId: string
  averageScore: number
}

type RankingData = {
  studentId: number
  studentName: string
  classId: number | null
  className: string | null
  averageScore: number
  position: number | null
  positionText: string
  totalStudents: number
  ranking: RankingItem[]
  message?: string
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function formatDate(value?: string) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

function getGrade(score: number) {
  if (score >= 70) return "A"
  if (score >= 60) return "B"
  if (score >= 50) return "C"
  if (score >= 45) return "D"
  return "F"
}

function getOrdinal(position: number | null) {
  if (!position) return "—"

  const mod10 = position % 10
  const mod100 = position % 100

  if (mod10 === 1 && mod100 !== 11) return `${position}st`
  if (mod10 === 2 && mod100 !== 12) return `${position}nd`
  if (mod10 === 3 && mod100 !== 13) return `${position}rd`
  return `${position}th`
}

export default function StudentReportPage() {
  const params = useParams()
  const id = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)

  const fetchStudent = async () => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch student")
    }

    setStudent(data)
  }

  const fetchRanking = async () => {
    const response = await fetch(`${API_BASE_URL}/students/${id}/ranking`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch ranking")
    }

    setRanking(data)
  }

  useEffect(() => {
    if (!id) return

    const loadPage = async () => {
      try {
        setLoading(true)
        setError("")
        await Promise.all([fetchStudent(), fetchRanking()])
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [id])

  const results = useMemo(() => student?.results || [], [student])
  const attendance = useMemo(() => student?.attendance || [], [student])

  const averageScore = useMemo(() => {
    if (!results.length) return 0
    const total = results.reduce((sum, item) => sum + Number(item.score || 0), 0)
    return total / results.length
  }, [results])

  const overallGrade = useMemo(() => {
    if (!results.length) return "—"
    return getGrade(averageScore)
  }, [averageScore, results.length])

  const attendanceSummary = useMemo(() => {
    const present = attendance.filter((item) => item.status?.toLowerCase() === "present").length
    const absent = attendance.filter((item) => item.status?.toLowerCase() === "absent").length
    const late = attendance.filter((item) => item.status?.toLowerCase() === "late").length

    return {
      total: attendance.length,
      present,
      absent,
      late,
    }
  }, [attendance])

  const term = useMemo(() => {
    return results[0]?.term || "First Term"
  }, [results])

  const session = useMemo(() => {
    return results[0]?.session || "2025/2026"
  }, [results])

  const positionLabel = useMemo(() => {
    if (!ranking?.position) return "—"
    return `${getOrdinal(ranking.position)} out of ${ranking.totalStudents}`
  }, [ranking])

  const generatePdf = async () => {
    if (!student) return

    try {
      setDownloading(true)
      setError("")

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const loadImageAsBase64 = (url: string) =>
        new Promise<string>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "Anonymous"
          img.src = url

          img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
              reject(new Error("Canvas error"))
              return
            }

            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL("image/png"))
          }

          img.onerror = () => reject(new Error("Failed to load image"))
        })

      let logoBase64 = ""
      try {
        logoBase64 = await loadImageAsBase64("/logo.png")
      } catch {
        console.log("Logo not found, continuing without logo")
      }

      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 14, 10, 20, 20)
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text(student.school?.name || "School Report Card", pageWidth / 2, 18, {
        align: "center",
      })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      doc.text("Official Student Report Card", pageWidth / 2, 25, {
        align: "center",
      })

      doc.setDrawColor(220, 220, 220)
      doc.line(14, 30, 196, 30)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Student Information", 14, 40)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Full Name: ${student.name || "—"}`, 14, 48)
      doc.text(`Student ID: ${student.studentId || "—"}`, 105, 48)
      doc.text(`Gender: ${student.gender || "—"}`, 14, 55)
      doc.text(`Class: ${student.class?.name || "—"}`, 105, 55)
      doc.text(`Term: ${term}`, 14, 62)
      doc.text(`Session: ${session}`, 105, 62)
      doc.text(`Position: ${positionLabel}`, 14, 69)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Performance Summary", 14, 80)

      autoTable(doc, {
        startY: 84,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
          valign: "middle",
        },
        head: [["Metric", "Value"]],
        body: [
          ["Average Score", results.length ? averageScore.toFixed(2) : "—"],
          ["Overall Grade", overallGrade],
          ["Position", positionLabel],
          ["Total Subjects", String(results.length)],
          ["Attendance Records", String(attendanceSummary.total)],
          ["Present", String(attendanceSummary.present)],
          ["Absent", String(attendanceSummary.absent)],
          ["Late", String(attendanceSummary.late)],
        ],
        headStyles: {
          fillColor: [41, 128, 185],
        },
      })

      const resultRows = results.map((result, index) => [
        String(index + 1),
        result.subject?.name || "—",
        String(result.score ?? "—"),
        getGrade(Number(result.score || 0)),
        result.term || "—",
        result.session || "—",
        result.teacher?.name || "—",
      ])

      const resultsTableStartY = (doc as any).lastAutoTable.finalY + 10

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Result Details", 14, resultsTableStartY)

      autoTable(doc, {
        startY: resultsTableStartY + 4,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 2.8,
          valign: "middle",
        },
        head: [["#", "Subject", "Score", "Grade", "Term", "Session", "Teacher"]],
        body: resultRows.length
          ? resultRows
          : [["", "No results found", "", "", "", "", ""]],
        headStyles: {
          fillColor: [46, 134, 193],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 42 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 28, halign: "center" },
          5: { cellWidth: 30, halign: "center" },
          6: { cellWidth: 40 },
        },
      })

      const gradingY = (doc as any).lastAutoTable.finalY + 10

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Grading Key", 14, gradingY)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("A (70–100)   B (60–69)   C (50–59)   D (45–49)   F (0–44)", 14, gradingY + 7)

      let remarksStartY = gradingY + 18

      if (remarksStartY > 240) {
        doc.addPage()
        remarksStartY = 20
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Remarks", 14, remarksStartY)

      autoTable(doc, {
        startY: remarksStartY + 4,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4,
          valign: "middle",
        },
        head: [["Type", "Remark"]],
        body: [
          ["Teacher Remark", student.teacherRemark || "—"],
          ["Principal Remark", student.principalRemark || "—"],
        ],
        headStyles: {
          fillColor: [52, 152, 219],
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 144 },
        },
      })

      const signatureY = (doc as any).lastAutoTable.finalY + 20

      if (signatureY > 270) {
        doc.addPage()
        doc.setFont("helvetica", "normal")
        doc.text("__________________________", 20, 30)
        doc.text("Class Teacher", 20, 35)

        doc.text("__________________________", 120, 30)
        doc.text("Principal", 120, 35)
      } else {
        doc.setFont("helvetica", "normal")
        doc.text("__________________________", 20, signatureY)
        doc.text("Class Teacher", 20, signatureY + 5)

        doc.text("__________________________", 120, signatureY)
        doc.text("Principal", 120, signatureY + 5)
      }

      const footerY = pageHeight - 10
      const pageCount = doc.getNumberOfPages()

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        )
      }

      const safeName = student.name.replace(/\s+/g, "_")
      doc.save(`${safeName}_Report_Card.pdf`)
    } catch (err: any) {
      setError(err.message || "Failed to generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Unable to load report</h2>
          <p className="mt-2 text-red-600">{error}</p>

          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/students"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-700">Student not found.</p>
          <Link
            href="/dashboard/students"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Card</h1>
          <p className="mt-1 text-gray-600">
            Preview and download student report card as PDF
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePdf}
            disabled={downloading}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {downloading ? "Generating PDF..." : "Download PDF"}
          </button>

          <Link
            href={`/dashboard/students/${id}`}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to Student
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard label="Average Score" value={results.length ? averageScore.toFixed(2) : "—"} />
        <StatCard label="Overall Grade" value={overallGrade} />
        <StatCard
          label="Position"
          value={ranking?.position ? getOrdinal(ranking.position) : "—"}
        />
        <StatCard label="Subjects" value={String(results.length)} />
        <StatCard label="Attendance" value={String(attendanceSummary.total)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Student Profile</h2>
          <div className="space-y-4">
            <InfoRow label="Full Name" value={student.name} />
            <InfoRow label="Student ID" value={student.studentId} />
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Class" value={student.class?.name || "—"} />
            <InfoRow label="School" value={student.school?.name || "—"} />
            <InfoRow label="Term" value={term} />
            <InfoRow label="Session" value={session} />
            <InfoRow label="Position" value={positionLabel} />
            <InfoRow label="Date Generated" value={new Date().toLocaleDateString()} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Results Summary</h2>

            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Teacher
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.subject?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{result.score}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {getGrade(Number(result.score || 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.teacher?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {formatDate(result.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No results found for this student.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Attendance Summary</h2>
              <div className="space-y-4">
                <InfoRow label="Total" value={String(attendanceSummary.total)} />
                <InfoRow label="Present" value={String(attendanceSummary.present)} />
                <InfoRow label="Absent" value={String(attendanceSummary.absent)} />
                <InfoRow label="Late" value={String(attendanceSummary.late)} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Remarks</h2>
              <div className="space-y-4">
                <InfoRow label="Teacher" value={student.teacherRemark || "—"} />
                <InfoRow label="Principal" value={student.principalRemark || "—"} />
              </div>
            </div>
          </div>

          {ranking?.ranking && ranking.ranking.length > 0 && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Class Ranking Preview</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Average
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.ranking.slice(0, 10).map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b ${item.id === student.id ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {getOrdinal(index + 1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.studentId}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {item.averageScore.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Showing top {Math.min(ranking.ranking.length, 10)} students in the class.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm text-gray-900">{value}</span>
    </div>
  )
}