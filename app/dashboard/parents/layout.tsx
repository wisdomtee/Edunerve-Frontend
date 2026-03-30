"use client"

import ParentSidebar from "../../components/ParentSidebar"

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <ParentSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-100">{children}</main>
    </div>
  )
}