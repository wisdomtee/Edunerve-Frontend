"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Question = {
  id: number
  question: string
  options: string[]
  answer: string
}

export default function CBTExamPage() {
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const [timeLeft, setTimeLeft] = useState(5 * 60)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [sessionId, setSessionId] = useState<number | null>(null)

  const [examActive, setExamActive] = useState(false)

  // ANTI CHEAT
  const [cheatCount, setCheatCount] = useState(0)

  // =========================
  // START EXAM SESSION
  // =========================
  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/exam/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: 1,
          }),
        })

        const data = await res.json()

        setSessionId(data.id)
      } catch (err) {
        console.error("Failed to start session", err)
      }
    }

    startSession()
  }, [])

  // =========================
  // CHECK IF TEACHER STARTED EXAM
  // =========================
  useEffect(() => {
    const checkExamStatus = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/exam/control/status"
        )

        const data = await res.json()

        setExamActive(data.isActive)
      } catch (err) {
        console.error("Failed to check exam status")
      }
    }

    checkExamStatus()

    const interval = setInterval(checkExamStatus, 3000)

    return () => clearInterval(interval)
  }, [])

  // =========================
  // LOAD QUESTIONS
  // =========================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/questions")

        const data = await res.json()

        setQuestions(data)
      } catch (err) {
        console.error("Failed to load questions", err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // =========================
  // TIMER
  // =========================
  useEffect(() => {
    if (submitted) return

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
  }, [submitted])

  // =========================
  // ANTI CHEAT - TAB SWITCH
  // =========================
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        setCheatCount((prev) => prev + 1)

        alert(
          "Warning: Tab switching detected. Multiple violations may auto-submit your exam."
        )
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    )

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      )
    }
  }, [submitted])

  // =========================
  // AUTO SUBMIT AFTER 3 CHEATS
  // =========================
  useEffect(() => {
    if (cheatCount >= 3 && !submitted) {
      alert("Exam auto-submitted for cheating.")

      handleSubmit()
    }
  }, [cheatCount, submitted])

  // =========================
  // SELECT ANSWER
  // =========================
  const handleSelect = (
    questionId: number,
    option: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  // =========================
  // SUBMIT EXAM
  // =========================
  const handleSubmit = async () => {
    if (submitted || submitting) return

    setSubmitting(true)
    setSubmitted(true)

    const score = questions.reduce((acc, q) => {
      return answers[q.id] === q.answer ? acc + 1 : acc
    }, 0)

    const percentage = questions.length
      ? (score / questions.length) * 100
      : 0

    try {
      // SAVE RESULT
      await fetch("http://localhost:5000/exam-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: 1,
          sessionId,
          score,
          total: questions.length,
          percentage,
          answers,
          cheatCount,
        }),
      })

      // CLOSE SESSION
      await fetch("http://localhost:5000/exam/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      })
    } catch (err) {
      console.error("Submission failed", err)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================
  // LIVE GRADING
  // =========================
  const score = questions.reduce((acc, q) => {
    return answers[q.id] === q.answer ? acc + 1 : acc
  }, 0)

  const percentage = questions.length
    ? (score / questions.length) * 100
    : 0

  const q = questions[current]

  // =========================
  // RESULT SCREEN
  // =========================
  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">
          Exam Result
        </h1>

        <div className="mt-4 space-y-2">
          <p>Total Questions: {questions.length}</p>

          <p>Score: {score}</p>

          <p>
            Percentage: {percentage.toFixed(2)}%
          </p>

          <p className="text-red-500">
            Tab Warnings: {cheatCount}
          </p>
        </div>

        <button
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  // =========================
  // EXAM NOT STARTED
  // =========================
  if (!examActive) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Exam Not Started
        </h1>

        <p className="text-gray-600">
          Please wait for your teacher to start the exam.
        </p>
      </div>
    )
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold">
          Loading Exam...
        </h2>
      </div>
    )
  }

  // =========================
  // MAIN EXAM UI
  // =========================
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">
          CBT Exam
        </h2>

        <div className="text-red-600 font-semibold">
          Time Left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60)
            .toString()
            .padStart(2, "0")}
        </div>
      </div>

      {/* CHEAT WARNING */}
      <div className="mb-4 text-sm text-red-500">
        Tab Switch Warnings: {cheatCount}/3
      </div>

      {/* QUESTION */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-3">
          {current + 1}. {q?.question}
        </h3>

        <div className="space-y-2">
          {q?.options?.map((opt) => (
            <label
              key={opt}
              className="block cursor-pointer"
            >
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={answers[q.id] === opt}
                onChange={() =>
                  handleSelect(q.id, opt)
                }
              />

              <span className="ml-2">
                {opt}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex justify-between mt-4">
        <button
          disabled={current === 0}
          onClick={() =>
            setCurrent((prev) => prev - 1)
          }
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() =>
              setCurrent((prev) => prev + 1)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {submitting
              ? "Submitting..."
              : "Submit Exam"}
          </button>
        )}
      </div>
    </div>
  )
}