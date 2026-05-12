"use client"

import { useEffect, useState } from "react"

export default function StudentExams() {
  const [exams, setExams] = useState([])

  useEffect(() => {
    const student =
  JSON.parse(localStorage.getItem("student") || "{}")

const studentId = student.id// later from login session

    fetch(`http://localhost:5000/exams/student/${studentId}`)
      .then((res) => res.json())
      .then(setExams)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        My Exams
      </h1>

      <div className="space-y-3">
        {exams.map((exam: any) => (
          <div
            key={exam.id}
            className="border p-4 rounded"
          >
            <h2 className="font-bold">{exam.title}</h2>
            <p>Duration: {exam.duration} mins</p>

            <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
              Start Exam
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}