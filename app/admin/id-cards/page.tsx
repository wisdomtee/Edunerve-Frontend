"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "react-qr-code"

type Student = {
  id: number
  name: string
  email: string
  passportUrl?: string

  class?: {
    name: string
  }
}

export default function StudentIDCardsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  const fetchStudents = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/students"
      )

      const data = await res.json()

      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Student ID Cards
          </h1>

          <p className="text-gray-500 mt-1">
            Generate and print student identification cards
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Print Cards
        </button>
      </div>

      {/* CARDS */}
      <div
        ref={printRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
      >
        {students.map((student) => (
          <div
            key={student.id}
            className="w-[340px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl"
          >

            {/* TOP HEADER */}
            <div className="bg-blue-700 text-white px-4 py-4">

              <div className="flex items-center gap-3">

                {/* SCHOOL LOGO */}
                <div className="w-14 h-14 bg-white rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src="/school-logo.png"
                    alt="School Logo"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* SCHOOL INFO */}
                <div>
                  <h2 className="font-bold text-lg leading-tight">
                    EDU NERVE SCHOOL
                  </h2>

                  <p className="text-xs opacity-90">
                    Student Identification Card
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="p-4">

              <div className="flex gap-4">

                {/* PASSPORT */}
                <div className="w-24 h-28 rounded-xl overflow-hidden border bg-gray-100 flex-shrink-0">
                  {student.passportUrl ? (
                    <img
                      src={`http://localhost:5000/uploads/passports/${student.passportUrl}`}
                      alt="passport"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      NO PHOTO
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex-1 space-y-2">

                  <div>
                    <p className="text-xs text-gray-500">
                      Full Name
                    </p>

                    <h3 className="font-bold text-lg text-gray-800 leading-tight">
                      {student.name}
                    </h3>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Student ID
                    </p>

                    <p className="font-medium">
                      STD-{student.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Class
                    </p>

                    <p className="font-medium">
                      {student.class?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Email
                    </p>

                    <p className="text-sm break-all">
                      {student.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50">

              {/* QR */}
              <div className="bg-white p-1 rounded">
                <QRCode
                  size={70}
                  value={JSON.stringify({
                    id: student.id,
                    name: student.name,
                    class: student.class?.name,
                  })}
                />
              </div>

              {/* VERIFY */}
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Valid School ID
                </p>

                <p className="text-xs text-gray-500">
                  Scan QR to verify
                </p>

                <p className="text-[10px] text-gray-400 mt-2">
                  www.edunerve.com
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button {
            display: none !important;
          }

          .shadow-xl {
            box-shadow: none !important;
          }

          .bg-gray-100 {
            background: white !important;
          }

          .grid {
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}