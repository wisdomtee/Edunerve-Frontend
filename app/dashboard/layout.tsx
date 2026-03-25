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

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Students", href: "/dashboard/students" },
  { name: "Attendance", href: "/dashboard/attendance" },
  { name: "Teachers", href: "/dashboard/teachers" },
  { name: "Classes", href: "/dashboard/classes" },
  { name: "Schools", href: "/dashboard/schools" },
  { name: "Subjects", href: "/dashboard/subjects" },
  { name: "Results", href: "/dashboard/results" },
]

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
      router.replace("/login")
      return
    }

    setUser(currentUser)
    setCheckedAuth(true)
  }, [router])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const linkClass = (href: string) =>
    [
      "block",
      "w-full",
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
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="md:hidden flex items-center justify-between bg-blue-700 px-4 py-3 text-white shadow">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-extrabold text-blue-700 shadow">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold">EduNerve</h1>
            <p className="text-xs text-blue-100">School Management</p>
          </div>
        </div>

        <button type="button" onClick={() => setOpen(!open)} className="text-2xl">
          ☰
        </button>
      </div>

      {open && (
        <div className="bg-blue-700 px-4 pb-4 shadow md:hidden">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="mt-2 rounded-xl bg-red-600 px-4 py-3 text-left font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-blue-700 text-white shadow-xl md:flex">
          <div className="border-b border-blue-600 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-blue-700 shadow">
                E
              </div>
              <div>
                <h1 className="text-2xl font-bold">EduNerve</h1>
                <p className="text-sm text-blue-100">School Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-blue-600 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-left font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden items-center justify-between border-b bg-white px-6 py-4 shadow-sm md:flex">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">EduNerve Admin Panel</h2>
              <p className="text-sm text-gray-500">
                Manage your school system from one place
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {user?.name?.[0] || "A"}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-gray-500">{user?.role || "ADMIN"}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}