"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudentLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const handleLogin = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/student-auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        alert(data.message)
        return
      }

      localStorage.setItem(
        "studentToken",
        data.token
      )

      localStorage.setItem(
        "student",
        JSON.stringify(data.student)
      )

      alert("Login successful")

      router.push("/student/exams")
    } catch (err) {
      console.error(err)
      alert("Login failed")
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded">
      <h1 className="text-2xl font-bold mb-6">
        Student Login
      </h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  )
}