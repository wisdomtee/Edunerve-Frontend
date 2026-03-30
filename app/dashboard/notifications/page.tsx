"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Clock3,
  Megaphone,
  School,
  Search,
} from "lucide-react"
import { getSelectedChild } from "@/lib/parent"

type NotificationItem = {
  id: number
  title: string
  message: string
  type: "announcement" | "attendance" | "result" | "event"
  date: string
  time: string
  read: boolean
  href?: string
}

type ChildNotificationsMap = Record<string, NotificationItem[]>

const notificationsByChild: ChildNotificationsMap = {
  "David Johnson": [
    {
      id: 1,
      title: "PTA Meeting Reminder",
      message: "The PTA meeting will hold on Friday by 10:00 AM in the school hall.",
      type: "announcement",
      date: "2026-03-29",
      time: "09:00 AM",
      read: false,
      href: "/dashboard/messages",
    },
    {
      id: 2,
      title: "Attendance Update",
      message: "David Johnson was marked present for today.",
      type: "attendance",
      date: "2026-03-29",
      time: "08:20 AM",
      read: false,
      href: "/dashboard/attendance",
    },
    {
      id: 3,
      title: "New Result Uploaded",
      message: "Second term Mathematics result has been uploaded.",
      type: "result",
      date: "2026-03-28",
      time: "04:15 PM",
      read: true,
      href: "/dashboard/results",
    },
    {
      id: 4,
      title: "Inter-house Sports",
      message: "Inter-house sports will take place on April 10, 2026.",
      type: "event",
      date: "2026-03-27",
      time: "01:30 PM",
      read: true,
      href: "/dashboard/parents",
    },
  ],
  "Sarah Johnson": [
    {
      id: 5,
      title: "Class Attendance Update",
      message: "Sarah Johnson arrived late to school today.",
      type: "attendance",
      date: "2026-03-29",
      time: "08:35 AM",
      read: false,
      href: "/dashboard/attendance",
    },
    {
      id: 6,
      title: "Art Materials Reminder",
      message: "Please send Sarah's art materials tomorrow.",
      type: "announcement",
      date: "2026-03-28",
      time: "01:15 PM",
      read: false,
      href: "/dashboard/messages",
    },
    {
      id: 7,
      title: "Excellent Result Update",
      message: "Sarah's English result has been uploaded with strong performance.",
      type: "result",
      date: "2026-03-27",
      time: "03:40 PM",
      read: true,
      href: "/dashboard/results",
    },
    {
      id: 8,
      title: "Open Day Notice",
      message: "Parents are invited for the school open day on April 2, 2026.",
      type: "event",
      date: "2026-03-26",
      time: "10:00 AM",
      read: true,
      href: "/dashboard/parents",
    },
  ],
}

export default function NotificationsPage() {
  const selectedChild = getSelectedChild()
  const selectedChildName = selectedChild?.name || ""

  const initialNotifications = selectedChildName
    ? notificationsByChild[selectedChildName] || []
    : []

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase())

      const matchesFilter = filter === "all" ? true : item.type === filter

      return matchesSearch && matchesFilter
    })
  }, [notifications, search, filter])

  const unreadCount = notifications.filter((item) => !item.read).length

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    )
  }

  const markOneAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-blue-100">Parent Portal</p>
            <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
            <p className="mt-2 text-sm text-blue-100">
              Stay updated with school announcements, attendance alerts, results, and events.
            </p>
            <p className="mt-3 text-sm font-semibold text-white/90">
              Selected Child: {selectedChildName || "No child selected"}
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedChildName || notifications.length === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      </section>

      {!selectedChildName ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
          Select a child from the top dashboard selector to view notifications.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Notifications"
              value={String(notifications.length)}
              subtitle="For selected child"
              icon={<Bell className="h-5 w-5" />}
            />
            <StatCard
              title="Unread"
              value={String(unreadCount)}
              subtitle="Need attention"
              icon={<Clock3 className="h-5 w-5" />}
            />
            <StatCard
              title="Announcements"
              value={String(
                notifications.filter((item) => item.type === "announcement").length
              )}
              subtitle="School notices"
              icon={<Megaphone className="h-5 w-5" />}
            />
            <StatCard
              title="Events"
              value={String(
                notifications.filter((item) => item.type === "event").length
              )}
              subtitle="Upcoming activities"
              icon={<CalendarDays className="h-5 w-5" />}
            />
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Notification Center
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review recent updates for {selectedChildName}.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-72"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="announcement">Announcements</option>
                  <option value="attendance">Attendance</option>
                  <option value="result">Results</option>
                  <option value="event">Events</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition ${
                      item.read
                        ? "border-slate-200 bg-white"
                        : "border-blue-200 bg-blue-50/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm">
                            {getNotificationIcon(item.type)}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            {!item.read && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                NEW
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-gray-600">
                            {item.message}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>{formatDate(item.date)}</span>
                            <span>{item.time}</span>
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={() => markOneAsRead(item.id)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Open
                          </Link>
                        ) : null}

                        {!item.read && (
                          <button
                            onClick={() => markOneAsRead(item.id)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-gray-500">
                  No notifications found for the selected child.
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <QuickLinkCard
              title="Parent Portal"
              href="/dashboard/parents"
              description="Go back to your dashboard."
            />
            <QuickLinkCard
              title="Messages"
              href="/dashboard/messages"
              description="Chat with the school."
            />
            <QuickLinkCard
              title="Fees"
              href="/dashboard/fees"
              description="Review payment status."
            />
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  )
}

function QuickLinkCard({
  title,
  href,
  description,
}: {
  title: string
  href: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <p className="mt-3 text-sm font-semibold text-blue-600">Open</p>
    </Link>
  )
}

function getNotificationIcon(type: NotificationItem["type"]) {
  if (type === "announcement") {
    return <Megaphone className="h-4 w-4" />
  }

  if (type === "attendance") {
    return <Clock3 className="h-4 w-4" />
  }

  if (type === "result") {
    return <School className="h-4 w-4" />
  }

  return <CalendarDays className="h-4 w-4" />
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString))
}