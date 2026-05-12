"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Exam = {
  id: number
  title: string
  subject: string
  className: string
  duration: number
  startTime?: string | null
  endTime?: string | null
  questions?: any[]
}

export default function CBTPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [classId, setClassId] = useState("")
  const [className, setClassName] = useState("")
  const [duration, setDuration] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const fetchExams = async () => {
    try {
      setFetching(true)
      const res = await fetch(`${API_BASE_URL}/api/cbt`, { // FIX: added /api
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setExams(Array.isArray(data) ? data : data.exams || [])
    } catch (err) {
      console.error("Failed to fetch exams:", err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const createExam = async () => {
    if (!title.trim() || !subject.trim() || !classId.trim() || !className.trim() || !duration.trim()) {
      setError("Title, subject, class ID, class name and duration are required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/cbt/create`, { // FIX: added /api
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          subject,
          classId: Number(classId),
          className,
          duration: Number(duration),
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create exam")
      }

      setTitle("")
      setSubject("")
      setClassId("")
      setClassName("")
      setDuration("")
      setStartTime("")
      setEndTime("")
      fetchExams()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">CBT Exams</h1>

      {/* CREATE EXAM */}
      <div className="border p-4 rounded-xl mb-6 bg-white shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-3">Create New Exam</h2>

        {error ? (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2">
          <input
            id="exam-title"
            name="examTitle"
            placeholder="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 w-full rounded outline-none focus:border-blue-500"
            autoComplete="off"
          />

          <input
            id="exam-subject"
            name="examSubject"
            placeholder="Subject (e.g Mathematics)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border p-2 w-full rounded outline-none focus:border-blue-500"
            autoComplete="off"
          />

          <input
            id="exam-class-id"
            name="examClassId"
            placeholder="Class ID (numeric)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="border p-2 w-full rounded outline-none focus:border-blue-500"
            type="number"
            min="1"
            autoComplete="off"
          />

          <input
            id="exam-class-name"
            name="examClassName"
            placeholder="Class Name (e.g JSS1)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="border p-2 w-full rounded outline-none focus:border-blue-500"
            autoComplete="off"
          />

          <input
            id="exam-duration"
            name="examDuration"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border p-2 w-full rounded outline-none focus:border-blue-500"
            type="number"
            min="1"
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Start Time (optional)
              </label>
              <input
                id="exam-start-time"
                name="examStartTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border p-2 w-full rounded outline-none focus:border-blue-500"
                type="datetime-local"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                End Time (optional)
              </label>
              <input
                id="exam-end-time"
                name="examEndTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border p-2 w-full rounded outline-none focus:border-blue-500"
                type="datetime-local"
              />
            </div>
          </div>
        </div>

        <button
          onClick={createExam}
          disabled={loading}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Exam"}
        </button>
      </div>

      {/* LIST */}
      <h2 className="font-semibold text-slate-800 mb-3">All Exams</h2>

      {fetching ? (
        <p className="text-sm text-slate-500">Loading exams...</p>
      ) : exams.length === 0 ? (
        <p className="text-sm text-slate-500">No exams created yet.</p>
      ) : (
        exams.map((exam) => (
          <div key={exam.id} className="border p-4 rounded-xl mb-3 bg-white shadow-sm">
            <h2 className="font-bold text-slate-900">{exam.title}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {exam.subject} • {exam.className} • {exam.duration} mins
            </p>
            {exam.questions && (
              <p className="text-xs text-slate-400 mt-1">
                {exam.questions.length} question{exam.questions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}