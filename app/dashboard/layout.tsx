"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getToken, getUser, logout } from "@/lib/auth"

type AppUser = {
  id?: string
  name?: string
  email?: string
  role?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)

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

  const linkClass = (href: string) =>
    [
      "!block",
      "!w-full",
      "px-4",
      "py-3",
      "rounded-xl",
      "font-medium",
      "text-left",
      "transition",
      pathname === href
        ? "bg-blue-900 text-white shadow"
        : "text-white hover:bg-blue-600",
    ].join(" ")

  if (!checkedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile top bar */}
      <div className="md:hidden bg-blue-700 text-white flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center font-extrabold shadow">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold">EduNerve</h1>
            <p className="text-xs text-blue-100">School Management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-2xl leading-none"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-blue-700 px-4 pb-4 shadow">
          <div className="!flex !flex-col gap-2">
            <Link
              href="/dashboard"
              className={linkClass("/dashboard")}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/students"
              className={linkClass("/dashboard/students")}
              onClick={() => setOpen(false)}
            >
              Students
            </Link>

            <Link
              href="/dashboard/attendance"
              className={linkClass("/dashboard/attendance")}
              onClick={() => setOpen(false)}
            >
              Attendance
            </Link>

            {user?.role === "admin" && (
              <>
                <Link
                  href="/dashboard/teachers"
                  className={linkClass("/dashboard/teachers")}
                  onClick={() => setOpen(false)}
                >
                  Teachers
                </Link>

                <Link
                  href="/dashboard/classes"
                  className={linkClass("/dashboard/classes")}
                  onClick={() => setOpen(false)}
                >
                  Classes
                </Link>

                <Link
                  href="/dashboard/schools"
                  className={linkClass("/dashboard/schools")}
                  onClick={() => setOpen(false)}
                >
                  Schools
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="!block !w-full mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-left font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-72 bg-blue-700 text-white flex-col shadow-xl">
          <div className="p-6 border-b border-blue-600">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 flex items-center justify-center text-2xl font-extrabold shadow">
                E
              </div>

              <div>
                <h1 className="text-2xl font-bold">EduNerve</h1>
                <p className="text-sm text-blue-100">School Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="!flex !flex-col gap-2">
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>

              <Link
                href="/dashboard/students"
                className={linkClass("/dashboard/students")}
              >
                Students
              </Link>

              <Link
                href="/dashboard/attendance"
                className={linkClass("/dashboard/attendance")}
              >
                Attendance
              </Link>

              {user?.role === "admin" && (
                <>
                  <Link
                    href="/dashboard/teachers"
                    className={linkClass("/dashboard/teachers")}
                  >
                    Teachers
                  </Link>

                  <Link
                    href="/dashboard/classes"
                    className={linkClass("/dashboard/classes")}
                  >
                    Classes
                  </Link>

                  <Link
                    href="/dashboard/schools"
                    className={linkClass("/dashboard/schools")}
                  >
                    Schools
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-blue-600">
            <button
              type="button"
              onClick={handleLogout}
              className="!block !w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium text-left"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="hidden md:flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">EduNerve Admin Panel</h2>
              <p className="text-sm text-gray-500">
                Manage your school system from one place
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {user?.name?.[0] || "A"}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{user?.name || "Administrator"}</p>
                <p className="text-gray-500">{user?.role || "admin"}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}