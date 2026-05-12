"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion/dist/framer-motion"

type Teacher = {
  id: string;
  name: string;
  avatar?: string;
};

type LessonNote = {
  id: string;
  title: string;
  subject: string;
  classId: number;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  teacher: Teacher;
};

export default function AdminLessonDashboard() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [selected, setSelected] = useState<LessonNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/lesson-notes/pending");
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reviewNote = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await fetch("/admin/lesson-notes/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      setNotes((prev) => prev.filter((n) => n.id !== id));
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Pending Lesson Notes</h2>

        {loading && <p>Loading...</p>}

        {!loading && notes.length === 0 && (
          <p className="text-gray-500">No pending notes</p>
        )}

        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ scale: 1.02 }}
              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setSelected(note)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                  {note.teacher?.name?.charAt(0) || "T"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {note.teacher?.name || "Unknown Teacher"}
                  </h3>
                  <p className="text-xs text-gray-400">Teacher</p>
                </div>
              </div>

              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-sm text-gray-500">
                Subject: {note.subject}
              </p>
              <p className="text-xs text-gray-400">
                Class ID: {note.classId}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 p-6">
        {!selected ? (
          <div className="text-gray-500">Select a lesson note to preview</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                {selected.teacher?.name?.charAt(0) || "T"}
              </div>
              <div>
                <h3 className="font-semibold">
                  {selected.teacher?.name || "Unknown Teacher"}
                </h3>
                <p className="text-sm text-gray-500">Teacher</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">{selected.title}</h2>

            <div className="text-sm text-gray-500 mb-4">
              Subject: {selected.subject} | Class: {selected.classId}
            </div>

            <div className="border p-4 rounded bg-gray-50 mb-6 whitespace-pre-wrap">
              {selected.content}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => reviewNote(selected.id, "APPROVED")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>

              <button
                onClick={() => reviewNote(selected.id, "REJECTED")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
