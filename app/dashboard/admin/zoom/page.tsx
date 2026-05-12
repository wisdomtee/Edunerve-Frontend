"use client"

import { useEffect, useState } from "react"

type Meeting = {
  id: number
  title: string
  joinUrl: string
}

export default function ZoomPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [title, setTitle] = useState("")
  const [joinUrl, setJoinUrl] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchMeetings = async () => {
    const res = await fetch("http://localhost:5000/api/zoom")
    const data = await res.json()
    setMeetings(data.meetings || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  const createMeeting = async () => {
    if (!title || !joinUrl) return alert("Fill all fields")

    await fetch("http://localhost:5000/api/zoom/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, joinUrl }),
    })

    setTitle("")
    setJoinUrl("")
    fetchMeetings()
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Zoom Meetings</h1>

      {/* CREATE FORM */}
      <div className="border p-3 rounded mb-4">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Meeting Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Join URL"
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
        />

        <button
          onClick={createMeeting}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Meeting
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : meetings.length === 0 ? (
        <p>No meetings yet</p>
      ) : (
        meetings.map((m) => (
          <div key={m.id} className="p-3 border rounded mb-2">
            <h2 className="font-bold">{m.title}</h2>
            <a
              href={m.joinUrl}
              target="_blank"
              className="text-blue-600 underline"
            >
              Join Meeting
            </a>
          </div>
        ))
      )}
    </div>
  )
}