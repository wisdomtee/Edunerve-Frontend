"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

type Teacher = {
  id: string
  name: string
  avatar?: string
}

type LessonNote = {
  id: string
  title: string
  subject: string
  classId: number
  content: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  teacher: Teacher
}

export default function AdminLessonDashboard() {
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [selected, setSelected] = useState<LessonNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setLoading(true)

    try {
      const res = await fetch("/admin/lesson-notes/pending")
      const data = await res.json()

      setNotes(data.notes || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Lesson Notes
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : notes.length === 0 ? (
        <p>No lesson notes found.</p>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ scale: 1.01 }}
              className="border rounded-xl p-4 shadow bg-white"
            >
              <h2 className="text-xl font-semibold">
                {note.title}
              </h2>

              <p className="text-sm text-gray-500">
                {note.subject}
              </p>

              <p className="mt-2 line-clamp-3">
                {note.content}
              </p>

              <button
                onClick={() => setSelected(note)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                View Note
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">
              {selected.title}
            </h2>

            <p className="mb-4">
              {selected.content}
            </p>

            <button
              onClick={() => setSelected(null)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}