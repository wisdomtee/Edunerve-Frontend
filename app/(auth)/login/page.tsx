"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type LoginResponse = {
  token?: string
  user?: {
    id?: string
    name?: string
    email?: string
    role?: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | string
  }
  message?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data: LoginResponse = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid login response from server")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      const role = data.user.role

      if (role === "PARENT") {
        router.replace("/dashboard/parents")
        return
      }

      if (role === "SUPER_ADMIN") {
        router.replace("/dashboard")
        return
      }

      if (role === "SCHOOL_ADMIN") {
        router.replace("/dashboard")
        return
      }

      if (role === "TEACHER") {
        router.replace("/dashboard")
        return
      }

      router.replace("/dashboard")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during login"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-700">EduNerve</h1>
          <p className="mt-2 text-sm text-slate-500">Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Enter your email"
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
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Back to{" "}
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-700">
            home
          </Link>
        </p>
      </div>
    </div>
  )
}