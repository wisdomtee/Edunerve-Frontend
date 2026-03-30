"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  UserCircle2,
  BookOpen,
} from "lucide-react"
import { logout } from "@/lib/auth"
import { clearSelectedChild } from "@/lib/parent"

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Parent Portal",
    href: "/dashboard/parents",
    icon: UserCircle2,
  },
  {
    name: "Attendance",
    href: "/dashboard/attendance",
    icon: CalendarCheck2,
  },
  {
    name: "Results",
    href: "/dashboard/results",
    icon: BookOpen,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
]

export default function ParentSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActivePath = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = () => {
    clearSelectedChild()
    logout()
    router.replace("/login")
  }

  return (
    <aside className="hidden w-72 flex-col bg-blue-700 text-white shadow-2xl md:flex">
      <div className="border-b border-blue-600 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-blue-700 shadow-sm">
            E
          </div>
          <div>
            <h1 className="text-2xl font-bold">EduNerve</h1>
            <p className="text-sm text-blue-100">Parent Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActivePath(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-blue-50 hover:bg-blue-600/80 hover:text-white",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 transition",
                    active
                      ? "text-blue-700"
                      : "text-blue-100 group-hover:text-white",
                  ].join(" ")}
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-blue-600 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}