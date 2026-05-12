import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r p-4 space-y-3">
        <h2 className="font-bold text-lg">Admin Panel</h2>

        <nav className="flex flex-col gap-2">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/zoom">Zoom Meetings</Link>
          <Link href="/admin/cbt">CBT Exams</Link>
          <Link href="/admin/id-cards">Student ID Cards</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}