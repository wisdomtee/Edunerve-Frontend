"use client"

import { useEffect, useState } from "react"

type Question = {
  id: number
  question: string
  options?: string[]
  answer: string
}

export default function AdminCBTPage() {
  const [question, setQuestion] = useState("")
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [optionC, setOptionC] = useState("")
  const [optionD, setOptionD] = useState("")
  const [answer, setAnswer] = useState("")

  const [questions, setQuestions] = useState<Question[]>([])

  const fetchQuestions = async () => {
    try {
      const res = await fetch("http://localhost:5000/questions")
      const data = await res.json()

      setQuestions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleCreateQuestion = async () => {
    if (!question || !optionA || !optionB || !optionC || !optionD || !answer) {
      alert("Fill all fields")
      return
    }

    try {
      await fetch("http://localhost:5000/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          options: [optionA, optionB, optionC, optionD],
          answer,
        }),
      })

      alert("Question Added")

      setQuestion("")
      setOptionA("")
      setOptionB("")
      setOptionC("")
      setOptionD("")
      setAnswer("")

      fetchQuestions()
    } catch (err) {
      console.error(err)
      alert("Failed to create question")
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        CBT Question Builder
      </h1>

      {/* FORM */}
      <div className="border rounded p-4 space-y-4">
        <input
          type="text"
          placeholder="Enter Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Option A"
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Option B"
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Option C"
          value={optionC}
          onChange={(e) => setOptionC(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Option D"
          value={optionD}
          onChange={(e) => setOptionD(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Correct Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleCreateQuestion}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Question
        </button>
      </div>

      {/* QUESTIONS */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Existing Questions
        </h2>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="border rounded p-4">
              <h3 className="font-semibold">
                {index + 1}. {q.question}
              </h3>

              <ul className="mt-2 ml-4 list-disc">
                {(q.options ?? []).length > 0 ? (
                  q.options!.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">
                    No options available
                  </li>
                )}
              </ul>

              <p className="mt-2 text-green-600">
                Answer: {q.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}