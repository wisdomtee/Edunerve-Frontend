"use client"

import QRCode from "react-qr-code"

type Props = {
  student: any
}

export default function StudentIdCard({
  student,
}: Props) {
  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-[900px] rounded-3xl overflow-hidden shadow-2xl border bg-white">

        {/* HEADER */}
        <div className="bg-blue-950 text-white px-10 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold">
              EDU NERVE SCHOOL
            </h1>

            <p className="text-yellow-400 text-xl mt-2">
              Excellence in Education
            </p>
          </div>

          <div className="bg-yellow-400 text-blue-950 px-6 py-3 rounded-xl font-bold text-lg">
            STUDENT ID CARD
          </div>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-3 gap-8 p-10">

          {/* PASSPORT */}
          <div className="flex flex-col items-center">

            <div className="w-64 h-72 rounded-2xl overflow-hidden border-4 border-yellow-400 shadow-lg">
              {student?.passportUrl ? (
                <img
                  src={`http://localhost:5000/uploads/passports/${student.passportUrl}`}
                  alt="passport"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  PHOTO
                </div>
              )}
            </div>

            <div className="mt-4 bg-blue-950 text-white px-6 py-2 rounded-lg font-bold">
              2024 - 2025
            </div>
          </div>

          {/* DETAILS */}
          <div className="col-span-1 flex flex-col justify-center space-y-5">

            <div>
              <p className="text-blue-800 font-bold uppercase text-sm">
                Name
              </p>

              <h2 className="text-3xl font-bold">
                {student?.name || "N/A"}
              </h2>
            </div>

            <div>
              <p className="text-blue-800 font-bold uppercase text-sm">
                Student ID
              </p>

              <h2 className="text-2xl">
                STD-{student?.id || "0000"}
              </h2>
            </div>

            <div>
              <p className="text-blue-800 font-bold uppercase text-sm">
                Class
              </p>

              <h2 className="text-2xl">
                {student?.class?.name || "N/A"}
              </h2>
            </div>

            <div>
              <p className="text-blue-800 font-bold uppercase text-sm">
                Email
              </p>

              <h2 className="text-lg break-all">
                {student?.email || "N/A"}
              </h2>
            </div>
          </div>

          {/* QR + BARCODE */}
          <div className="flex flex-col items-center justify-center border-l pl-6">

            <div className="bg-white p-4 rounded-xl border shadow">
              <QRCode
                size={170}
                value={JSON.stringify({
                  id: student?.id,
                  name: student?.name,
                  class: student?.class?.name,
                })}
              />
            </div>

            <p className="mt-4 font-bold text-blue-900">
              QR CODE
            </p>

            {/* Fake Barcode */}
            <div className="mt-8 w-full flex flex-col items-center">
              <div className="flex gap-[2px] h-24 items-end">
                {Array.from({ length: 50 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`bg-black ${
                        i % 2 === 0
                          ? "w-[3px]"
                          : "w-[1px]"
                      }`}
                      style={{
                        height: `${
                          40 + (i % 5) * 10
                        }px`,
                      }}
                    />
                  )
                )}
              </div>

              <p className="mt-2 text-xl tracking-widest">
                {student?.studentId}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-blue-950 text-white px-10 py-5 flex items-center justify-between">

          <div className="flex gap-6 text-lg">
            <p>📞 +234 800 000 0000</p>
            <p>🌐 www.edunerve.com</p>
          </div>

          <div className="text-right">
            <p className="italic text-2xl">
              Principal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}