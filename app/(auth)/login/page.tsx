"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { API_BASE_URL, saveAuth } from "@/lib/api"

type LoginResponse = {
  token?: string
  user?: {
    id?: number | string
    name?: string
    email?: string
    role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
    schoolId?: number | null
    mustChangePassword?: boolean
  }
  message?: string
  linkedStudent?: {
    id?: number | string
    name?: string
  }
}

export default function LoginPage() {
  const router = useRouter()

  const [schoolCode, setSchoolCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()

    if (!schoolCode.trim() || !email.trim() || !password.trim()) {
      setError("School code, email and password are required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolCode: schoolCode.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      })

      const data: LoginResponse = await response.json()

      if (!response.ok) {
        setError(data.message || "Login failed")
        return
      }

      if (!data.token || !data.user) {
        setError("Invalid login response from server")
        return
      }

      saveAuth(data.token, data.user)

      if (typeof window !== "undefined") {
        localStorage.setItem("schoolCode", schoolCode.trim())

        if (data.linkedStudent?.id) {
          localStorage.setItem("studentId", String(data.linkedStudent.id))
        } else {
          localStorage.removeItem("studentId")
        }

        if (data.linkedStudent?.name) {
          localStorage.setItem("studentName", data.linkedStudent.name)
        } else {
          localStorage.removeItem("studentName")
        }
      }

      if (data.user.mustChangePassword) {
        router.push("/change-password")
        return
      }

      const role = (data.user.role || "").toUpperCase()

      if (role === "SUPER_ADMIN") {
        router.push("/dashboard/super-admin")
        return
      }

      if (role === "SCHOOL_ADMIN") {
        router.push("/dashboard")
        return
      }

      if (role === "TEACHER") {
        router.push("/dashboard")
        return
      }

      if (role === "PARENT") {
        router.push("/dashboard")
        return
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            E
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to EduNerve
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              School Code
            </label>
            <input
              type="text"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="Enter your school code"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Need help?{" "}
          <Link
            href="/"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  )
}