"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"
import { apiFetch } from "@/lib/apiClient"

type School = {
  id: number
  name: string
}

type Class = {
  id: number
  name: string
}

export default function BulkInvoicePage() {
  const router = useRouter()

  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])

  const [schoolId, setSchoolId] = useState("")
  const [className, setClassName] = useState("")

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  // =============================
  // LOAD USER + SCHOOLS
  // =============================
  useEffect(() => {
    const load = async () => {
      const user = getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // SCHOOL ADMIN → lock school
      if (user.role === "SCHOOL_ADMIN") {
        setSchoolId(String(user.schoolId))
      } else {
        const res = await apiFetch(`${API_BASE_URL}/schools`, {
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        setSchools(data)
      }
    }

    load()
  }, [])

  // =============================
  // LOAD CLASSES BASED ON SCHOOL
  // =============================
  useEffect(() => {
    const loadClasses = async () => {
      if (!schoolId) return

      try {
        const res = await apiFetch(
          `${API_BASE_URL}/classes?schoolId=${schoolId}`,
          {
            headers: getAuthHeaders(),
          }
        )

        const data = await res.json()

        setClasses(Array.isArray(data) ? data : data.classes || [])
      } catch (err) {
        console.error("Failed to load classes", err)
      }
    }

    loadClasses()
  }, [schoolId])

  // =============================
  // SUBMIT
  // =============================
  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      setLoading(true)
      setMsg("")

      if (!schoolId || !className) {
        setMsg("Select school and class")
        return
      }

      const res = await apiFetch(`${API_BASE_URL}/fees/bulk-create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          schoolId,
          className, // 🔥 EXACT match to Class.name
          title,
          amount,
          dueDate,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setMsg(`✅ ${data.count} invoices created for ${className}`)

      setTimeout(() => {
        router.push("/dashboard/fees")
      }, 1500)
    } catch (err: any) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">
        Bulk Generate Invoices
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SCHOOL */}
        {!schoolId && (
          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value)
              setClassName("") // reset class when school changes
            }}
            className="w-full border p-3 rounded"
          >
            <option value="">Select school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* CLASS DROPDOWN 🔥 */}
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full border p-3 rounded"
          disabled={!schoolId}
        >
          <option value="">
            {schoolId ? "Select class" : "Select school first"}
          </option>

          {classes.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* TITLE */}
        <input
          placeholder="Invoice title (e.g. First Term Fees)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-3 rounded"
        />

        {/* AMOUNT */}
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border p-3 rounded"
        />

        {/* DATE */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-3 rounded"
        >
          {loading ? "Generating..." : "Generate for Class"}
        </button>

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </div>
  )
}