"use client"

import { useEffect, useState } from "react"

export default function ActiveExams() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetch("http://localhost:5000/exam/sessions")
      const data = await res.json()
      setSessions(data)
    }

    fetchSessions()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Live Exam Sessions</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Started</th>
          </tr>
        </thead>

        <tbody>
          {sessions.map((s: any) => (
            <tr key={s.id}>
              <td>{s.studentId}</td>
              <td>{s.status}</td>
              <td>{new Date(s.startedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}