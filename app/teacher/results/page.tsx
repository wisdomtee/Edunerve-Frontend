"use client"

import { useEffect, useState } from "react"

export default function TeacherResults() {
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch("http://localhost:5000/exam-results")
      const data = await res.json()
      setResults(data)
    }

    fetchResults()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Student Results</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Score</th>
            <th>Total</th>
            <th>Percentage</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.studentId}</td>
              <td>{r.score}</td>
              <td>{r.total}</td>
              <td>{r.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}