"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type Student = {
  id: string
  name: string
  class: string
  photo?: string
  school: string
  status: "active" | "inactive"
  admissionNo?: string
  dob?: string
  gender?: string
}

export default function StudentVerifyPage({
  params,
}: {
  params: { token: string }
}) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `/api/verify-student?token=${params.token}`
        )

        const data = await res.json()

        if (!data.valid) {
          setValid(false)
          setLoading(false)
          return
        }

        setStudent(data.student)
        setValid(true)
      } catch (err) {
        setValid(false)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [params.token])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading verification...
      </div>
    )
  }

  if (!valid || !student) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Invalid or Expired QR Code
          </h1>
          <p className="text-gray-500 mt-2">
            This student record could not be verified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">{student.school}</h1>
            <p className="text-sm opacity-80">
              Official Student Verification
            </p>
          </div>

          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Verified
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid md:grid-cols-2 gap-6">

          {/* Left */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 relative rounded-xl overflow-hidden border">
              <Image
                src={student.photo || "/avatar.png"}
                alt={student.name}
                fill
                className="object-cover"
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              {student.name}
            </h2>

            <p className="text-sm text-gray-500">{student.class}</p>

            <div className="mt-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
              Student
            </div>

            <div className="mt-5 text-xs text-gray-400 text-center">
              Scan verified via EduNerve Secure QR System
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Admission Number</p>
              <p className="font-semibold">{student.admissionNo || "-"}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Class</p>
              <p className="font-semibold">{student.class}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-semibold">{student.gender || "-"}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Status</p>
              <p
                className={`font-semibold ${
                  student.status === "active"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {student.status === "active"
                  ? "Active Student"
                  : "Inactive"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center text-xs text-gray-500">
          This verification page is system-generated and secure.
        </div>
      </div>
    </div>
  )
}