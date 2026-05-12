"use client"

import { useEffect, useRef, useState } from "react"

type Question = {
  id: number
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
}

type Exam = {
  id: number
  title: string
  subject: string
  duration?: number
  questions: Question[]
}

export default function StudentCBTPage() {
  const [exam, setExam] = useState<Exam | null>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(1800)
  const [warnings, setWarnings] = useState(0)

  const submittedRef = useRef(false)
  const warningLockRef = useRef(false)

  /* =========================
     FULLSCREEN ENFORCEMENT
  ========================= */
  const enterFullscreen = async () => {
    try {
      const el = document.documentElement as any
      if (el.requestFullscreen) {
        await el.requestFullscreen()
      }
    } catch (err) {
      console.log("Fullscreen failed")
    }
  }

  const exitHandler = () => {
    if (!document.fullscreenElement) {
      triggerWarning("FULLSCREEN_EXIT")
    }
  }

  /* =========================
     FETCH EXAM
  ========================= */
  useEffect(() => {
    const load = async () => {
      const res = await fetch("http://localhost:5000/api/exam/1")
      const data = await res.json()

      setExam(data.exam)
      setTimeLeft((data.exam?.duration || 30) * 60)

      await enterFullscreen()
    }

    load()

    document.addEventListener("fullscreenchange", exitHandler)

    return () => {
      document.removeEventListener("fullscreenchange", exitHandler)
    }
  }, [])

  /* =========================
     SAFE WARNING SYSTEM (FIXED)
  ========================= */
  const triggerWarning = async (type: string) => {
    if (warningLockRef.current) return
    warningLockRef.current = true

    setWarnings((prev) => {
      const updated = prev + 1

      // auto submit on 3 warnings
      if (updated >= 3) {
        handleSubmit()
      }

      return updated
    })

    try {
      await fetch("http://localhost:5000/api/exam/cheat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: 1,
          studentId: 1,
          type,
        }),
      })
    } catch (err) {
      console.log(err)
    }

    // unlock after delay (prevents spam)
    setTimeout(() => {
      warningLockRef.current = false
    }, 2000)
  }

  /* =========================
     TAB SWITCH DETECTION
  ========================= */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        triggerWarning("TAB_SWITCH")
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  /* =========================
     COPY / PASTE BLOCK
  ========================= */
  useEffect(() => {
    const block = (e: any) => {
      e.preventDefault()

      if (e.type === "copy") triggerWarning("COPY")
      if (e.type === "paste") triggerWarning("PASTE")
      if (e.type === "cut") triggerWarning("CUT")
      if (e.type === "contextmenu") triggerWarning("RIGHT_CLICK")
    }

    document.addEventListener("copy", block)
    document.addEventListener("paste", block)
    document.addEventListener("cut", block)
    document.addEventListener("contextmenu", block)

    return () => {
      document.removeEventListener("copy", block)
      document.removeEventListener("paste", block)
      document.removeEventListener("cut", block)
      document.removeEventListener("contextmenu", block)
    }
  }, [])

  /* =========================
     STABLE TIMER (FIXED)
  ========================= */
  useEffect(() => {
    if (!exam) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [exam])

  /* =========================
     ANSWERS
  ========================= */
  const handleSelect = (questionId: number, answer: string) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId)
      return [...filtered, { questionId, answer }]
    })
  }

  /* =========================
     SUBMIT (NO DOUBLE SUBMIT)
  ========================= */
  const handleSubmit = async () => {
    if (submittedRef.current) return
    submittedRef.current = true

    try {
      await fetch("http://localhost:5000/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: 1,
          studentId: 1,
          answers,
        }),
      })

      alert("Exam submitted successfully")
    } catch (err) {
      console.log(err)
      alert("Submission failed")
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (!exam) return <div className="p-10">Loading...</div>

  const q = exam.questions[current]

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* HEADER */}
      <div className="bg-black text-white p-5 rounded-xl mb-5">
        <h1 className="text-xl font-bold">{exam.title}</h1>
        <p>{exam.subject}</p>

        <div className="text-2xl mt-2 text-red-400">
          ⏳ {formatTime(timeLeft)}
        </div>

        <div className="text-sm mt-1 text-yellow-300">
          Warnings: {warnings}/3
        </div>
      </div>

      {/* QUESTION */}
      <div className="border p-5 rounded-lg">
        <h2 className="font-bold mb-4">
          {current + 1}. {q.question}
        </h2>

        {[
          { key: "A", value: q.optionA },
          { key: "B", value: q.optionB },
          { key: "C", value: q.optionC },
          { key: "D", value: q.optionD },
        ].map((opt) => (
          <label key={opt.key} className="block border p-2 mb-2">
            <input
              type="radio"
              name={`q-${q.id}`}
              onChange={() => handleSelect(q.id, opt.key)}
            />{" "}
            {opt.key}. {opt.value}
          </label>
        ))}
      </div>

      {/* NAV */}
      <div className="flex justify-between mt-5">
        <button
          disabled={current === 0}
          onClick={() => setCurrent((p) => p - 1)}
          className="px-4 py-2 bg-gray-400 rounded"
        >
          Prev
        </button>

        <button
          disabled={current === exam.questions.length - 1}
          onClick={() => setCurrent((p) => p + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Next
        </button>
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded"
      >
        Submit Exam
      </button>
    </div>
  )
}