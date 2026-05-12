"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { adminSidebarLinks } from "@/config/adminSidebar"

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-black text-white p-4 flex flex-col gap-2">

      <h1 className="text-xl font-bold mb-4">
        Admin Panel
      </h1>

      {adminSidebarLinks.map((item) => {
        const Icon = item.icon
        const active = pathname === item.path

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 p-2 rounded ${
              active ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}