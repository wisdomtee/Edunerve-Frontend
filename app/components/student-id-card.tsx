"use client"

type Props = {
  student: {
    name: string
    studentId: string
    gender?: string
    session?: string
    passportUrl?: string
    class?: {
      name: string
    } | null
    school?: {
      name: string
    } | null
  }
}

export default function StudentIdCard({ student }: Props) {
  return (
    <div
      id="student-id-card"
      className="w-[340px] h-[210px] rounded-2xl shadow-xl bg-white border overflow-hidden"
    >
      {/* HEADER */}
      <div className="bg-blue-700 text-white p-3 text-center">
        <h1 className="text-lg font-bold">
          {student.school?.name || "EduNerve School"}
        </h1>

        <p className="text-xs">
          STUDENT IDENTIFICATION CARD
        </p>
      </div>

      {/* BODY */}
      <div className="flex p-4 gap-4">
        {/* PHOTO */}
        <div>
          <img
            src={
              student.passportUrl ||
              "https://via.placeholder.com/100x100.png?text=Photo"
            }
            alt="Student"
            className="w-24 h-24 rounded-lg object-cover border"
          />
        </div>

        {/* INFO */}
        <div className="flex-1 text-sm">
          <div className="mb-2">
            <p className="text-gray-500">Full Name</p>
            <p className="font-bold">{student.name}</p>
          </div>

          <div className="mb-2">
            <p className="text-gray-500">Student ID</p>
            <p className="font-semibold">{student.studentId}</p>
          </div>

          <div className="mb-2">
            <p className="text-gray-500">Class</p>
            <p>{student.class?.name || "N/A"}</p>
          </div>

          <div className="mb-2">
            <p className="text-gray-500">Session</p>
            <p>{student.session || "2025/2026"}</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-100 text-center text-xs py-2">
        Powered by TechNerve Inc.
      </div>
    </div>
  )
}