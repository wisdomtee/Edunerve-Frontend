"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import StudentIdCard from "@/components/student-id-card"

export default function StudentIdPage() {
  const params = useParams()

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/students/${params.id}`
        )

        const data = await res.json()

        setStudent(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudent()
    }
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
      <div className="p-6 text-red-500">
        Student not found
      </div>
    )
  }

  return (
    <div className="p-6">
      <StudentIdCard student={student} />
    </div>
  )
}