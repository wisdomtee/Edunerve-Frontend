import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 p-4 border-r">
        <h2 className="font-bold mb-4">Admin</h2>

        <nav className="flex flex-col gap-2">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/zoom">Zoom</Link>
          <Link href="/admin/cbt">CBT</Link>
          <Link href="/admin/id-cards">ID Cards</Link>
        </nav>
      </aside>

      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}