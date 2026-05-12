"use client"

type Student = {
  id: number
  name: string
  email: string
  passportUrl?: string
  class?: {
    name: string
  }
}

export default function StudentIdCard({
  student,
}: {
  student: Student
}) {
  return (
    <div
      id="student-id-card"
      className="w-[340px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* HEADER */}
      <div className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-full overflow-hidden">
          <img
            src="/school-logo.png"
            className="w-full h-full object-cover"
            alt="logo"
          />
        </div>

        <div>
          <h2 className="font-bold">
            EDU NERVE SCHOOL
          </h2>

          <p className="text-xs">
            Student ID Card
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-4 flex gap-4">
        {/* PHOTO */}
        <div className="w-24 h-28 border rounded-lg overflow-hidden bg-gray-100">
          {student.passportUrl ? (
            <img
              src={`http://localhost:5000/uploads/passports/${student.passportUrl}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              NO PHOTO
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-gray-500">
              Name
            </p>
            <p className="font-semibold">
              {student.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              ID
            </p>
            <p>STD-{student.id}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Class
            </p>
            <p>
              {student.class?.name || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t p-3 text-xs text-center text-gray-500">
        Official Student Identification
      </div>
    </div>
  )
}