"use client"

import { useEffect, useState } from "react"

type Question = {
  id: number
  question: string
  options: string[]
  answer: string
}

type ShuffledQuestion = Question & {
  shuffledOptions: string[]
}

export default function ExamPage() {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [score, setScore] = useState<number | null>(null)

  const [timeLeft, setTimeLeft] = useState(10 * 60)

  // 🔀 shuffle helper
  const shuffleArray = (arr: string[]) => {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  const shuffleQuestions = (data: Question[]) => {
    return data
      .sort(() => Math.random() - 0.5)
      .map((q) => ({
        ...q,
        shuffledOptions: shuffleArray(q.options),
      }))
  }

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/questions")
        const data = await res.json()

        const safeData = Array.isArray(data) ? data : []
        setQuestions(shuffleQuestions(safeData))
      } catch (err) {
        console.error(err)
      }
    }

    fetchQuestions()
  }, [])

  // ⏱ TIMER + AUTO SUBMIT
  useEffect(() => {
    if (score !== null) return
    if (questions.length === 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          submit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [questions, score])

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  const handleSelect = (option: string) => {
    setSelected({
      ...selected,
      [current]: option,
    })
  }

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
    }
  }

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1)
    }
  }

  const submit = () => {
    if (score !== null) return

    let sc = 0

    questions.forEach((q, i) => {
      if (selected[i] === q.answer) {
        sc++
      }
    })

    setScore(sc)
  }

  if (questions.length === 0) {
    return <div className="p-6">Loading exam...</div>
  }

  if (score !== null) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Exam Completed 🎉</h1>
        <p className="mt-4 text-lg">
          Your Score: {score} / {questions.length}
        </p>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* TIMER */}
      <div className="mb-4 text-red-600 font-bold text-lg">
        Time Left: {formatTime(timeLeft)}
      </div>

      <h1 className="text-xl font-bold mb-4">
        Question {current + 1} / {questions.length}
      </h1>

      <p className="mb-4">{q.question}</p>

      <div className="space-y-3">
        {q.shuffledOptions.map((opt, i) => (
          <label
            key={i}
            className="block border p-2 rounded cursor-pointer"
          >
            <input
              type="radio"
              name={`option-${current}`}
              checked={selected[current] === opt}
              onChange={() => handleSelect(opt)}
              className="mr-2"
            />
            {opt}
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prev}
          disabled={current === 0}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Prev
        </button>

        {current === questions.length - 1 ? (
          <button
            onClick={submit}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={next}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}