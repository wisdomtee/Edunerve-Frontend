"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function CreateInvoicePage() {
  const router = useRouter()
  const token = getToken()

  const [schoolId, setSchoolId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [title, setTitle] = useState("First Term School Fees")
  const [description, setDescription] = useState("Tuition and development levy")
  const [amount, setAmount] = useState("50000")
  const [dueDate, setDueDate] = useState("2026-04-30")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleCreate = async () => {
    setMessage("")
    setError("")

    if (!token) {
      setError("No auth token found. Please log in again.")
      return
    }

    if (!schoolId.trim()) {
      setError("School ID is required")
      return
    }

    if (!studentId.trim()) {
      setError("Student ID is required")
      return
    }

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount")
      return
    }

    if (!dueDate.trim()) {
      setError("Due date is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/fee-invoices/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: Number(schoolId),
          studentId: Number(studentId),
          title: title.trim(),
          description: description.trim(),
          amount: numericAmount,
          dueDate: dueDate.trim(),
        }),
      })

      const text = await res.text()
      let data: any = {}

      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(
          `Server returned non-JSON response. Check API URL and backend route. Response: ${text.slice(0, 120)}`
        )
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to create invoice")
      }

      setMessage(data.message || "Invoice created successfully")

      setTimeout(() => {
        router.push("/dashboard/fees")
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create Invoice</h1>
        <p className="text-slate-600">Create a fee invoice for a student</p>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              School ID
            </label>
            <input
              type="number"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="Enter school ID"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Student ID
            </label>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Invoice Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Invoice title"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Invoice description"
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>

          <button
            onClick={() => router.push("/dashboard/super-admin")}
            className="rounded-lg bg-slate-200 px-4 py-2 text-slate-800"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}