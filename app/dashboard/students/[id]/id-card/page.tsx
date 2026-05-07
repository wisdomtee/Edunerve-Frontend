"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import StudentIdCard from "@/components/student-id-card"
import { downloadStudentId } from "@/components/download-student-id"

export default function StudentIdPage() {
  const params = useParams()

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStudent(data)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="p-6">
        Loading ID card...
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        Student not found
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <StudentIdCard student={student} />

      <button
        onClick={downloadStudentId}
        className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl"
      >
        Download ID Card
      </button>
    </div>
  )
}