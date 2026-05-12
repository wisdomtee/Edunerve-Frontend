"use client"

import { useEffect, useState } from "react"

export default function ResultPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchResult()
  }, [])

  const fetchResult = async () => {
    const res = await fetch("http://localhost:5000/api/exam/submit-result")
    const data = await res.json()
    setData(data)
  }

  if (!data) return <div>Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-4">
        Exam Result Review
      </h1>

      <div className="bg-blue-600 text-white p-4 rounded mb-5">
        Score: {data.result.score} / {data.result.total} (
        {data.result.percentage}%)
      </div>

      {data.review.map((q: any, i: number) => (
        <div key={i} className="border p-4 mb-3 rounded">

          <p className="font-bold">
            {i + 1}. {q.question}
          </p>

          <p className="text-green-600">
            Correct: {q.correctAnswer}
          </p>

          <p className="text-red-600">
            Your Answer: {q.selectedAnswer || "Not answered"}
          </p>

          <p>
            {q.isCorrect ? "✅ Correct" : "❌ Wrong"}
          </p>

        </div>
      ))}
    </div>
  )
}