"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getToken, getUser, logout } from "@/lib/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    const currentUser = getUser()

    if (!token) {
      router.push("/login")
      return
    }

    setUser(currentUser)
    setCheckedAuth(true)
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!checkedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    )
  }

  const linkClass = (href: string) =>
    `px-4 py-2 rounded-lg transition ${
      pathname === href ? "bg-blue-900 text-white" : "hover:bg-blue-600"
    }`

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="md:hidden bg-blue-700 text-white flex justify-between items-center px-4 py-3">
        <h1 className="font-bold">EduNerve</h1>
        <button onClick={() => setOpen(!open)}>☰</button>
      </div>

      {open && (
        <div className="md:hidden bg-blue-600 text-white px-4 py-3 space-y-3 flex flex-col">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </Link>

          <Link href="/dashboard/students" onClick={() => setOpen(false)}>
            Students
          </Link>

          <Link href="/dashboard/attendance" onClick={() => setOpen(false)}>
            Attendance
          </Link>

          {user?.role === "admin" && (
            <>
              <Link href="/dashboard/teachers" onClick={() => setOpen(false)}>
                Teachers
              </Link>

              <Link href="/dashboard/classes" onClick={() => setOpen(false)}>
                Classes
              </Link>

              <Link href="/dashboard/schools" onClick={() => setOpen(false)}>
                Schools
              </Link>
            </>
          )}

          <button onClick={handleLogout} className="text-left mt-2">
            Logout
          </button>
        </div>
      )}

      <div className="flex">
        <aside className="hidden md:flex w-64 bg-blue-700 text-white flex-col min-h-screen">
          <div className="p-6 border-b border-blue-600">
            <h1 className="text-xl font-bold">EduNerve</h1>
          </div>

          <nav className="flex-1 p-4 flex flex-col gap-2">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>

            <Link href="/dashboard/students" className={linkClass("/dashboard/students")}>
              Students
            </Link>

            <Link href="/dashboard/attendance" className={linkClass("/dashboard/attendance")}>
              Attendance
            </Link>

            {user?.role === "admin" && (
              <>
                <Link href="/dashboard/teachers" className={linkClass("/dashboard/teachers")}>
                  Teachers
                </Link>

                <Link href="/dashboard/classes" className={linkClass("/dashboard/classes")}>
                  Classes
                </Link>

                <Link href="/dashboard/schools" className={linkClass("/dashboard/schools")}>
                  Schools
                </Link>
              </>
            )}
          </nav>

          <button
            onClick={handleLogout}
            className="m-4 bg-red-600 hover:bg-red-700 py-2 rounded"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}