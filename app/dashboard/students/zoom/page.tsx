"use client"

import { useEffect, useState } from "react"

type ZoomMeeting = {
  id: number
  title: string
  meetingId: string
  passcode?: string
  startTime: string
  joinUrl: string
}

export default function StudentZoomPage() {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/zoom/meetings")
        const data = await res.json()

        setMeetings(data.meetings || [])
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="p-10">Loading Zoom meetings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-5 rounded-xl mb-5">
        <h1 className="text-xl font-bold">Live Zoom Classes</h1>
        <p>Join your scheduled lessons</p>
      </div>

      {/* MEETINGS LIST */}
      {meetings.length === 0 ? (
        <div className="p-5 border rounded-lg text-gray-600">
          No scheduled meetings yet
        </div>
      ) : (
        meetings.map((m) => (
          <div key={m.id} className="border p-4 rounded-lg mb-4">
            <h2 className="font-bold text-lg">{m.title}</h2>

            <p className="text-sm text-gray-600">
              Meeting ID: {m.meetingId}
            </p>

            {m.passcode && (
              <p className="text-sm text-gray-600">
                Passcode: {m.passcode}
              </p>
            )}

            <p className="text-sm text-gray-500 mt-1">
              Starts: {new Date(m.startTime).toLocaleString()}
            </p>

            <a
              href={m.joinUrl}
              target="_blank"
              className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded"
            >
              Join Meeting
            </a>
          </div>
        ))
      )}
    </div>
  )
}