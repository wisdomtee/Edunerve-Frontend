"use client"

import { useState } from "react"

export default function ExamControlPage() {
  const [loading, setLoading] = useState(false)

  const startExam = async () => {
    setLoading(true)

    await fetch("http://localhost:5000/exam/control/start", {
      method: "POST",
    })

    alert("Exam Started")

    setLoading(false)
  }

  const stopExam = async () => {
    setLoading(true)

    await fetch("http://localhost:5000/exam/control/stop", {
      method: "POST",
    })

    alert("Exam Stopped")

    setLoading(false)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Teacher Exam Control
      </h1>

      <div className="flex gap-4">
        <button
          onClick={startExam}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Start Exam
        </button>

        <button
          onClick={stopExam}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Stop Exam
        </button>
      </div>
    </div>
  )
}