"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { io, Socket } from "socket.io-client"
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Clock3,
  Megaphone,
  School,
  Search,
} from "lucide-react"
import { API_BASE_URL, getAuthHeaders, getUser } from "@/lib/api"

type NotificationType = "announcement" | "attendance" | "result" | "event" | "message"

type NotificationItem = {
  id: number
  title: string
  message: string
  type?: string
  date?: string
  time?: string
  createdAt?: string
  read: boolean
  href?: string
}

type SocketNotificationPayload = {
  type?: string
  title?: string
  message?: string
  href?: string
  time?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [updating, setUpdating] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  const normalizeType = (value?: string): NotificationType => {
    const raw = String(value || "").toLowerCase()

    if (raw === "attendance") return "attendance"
    if (raw === "result") return "result"
    if (raw === "event") return "event"
    if (raw === "message") return "message"

    return "announcement"
  }

  const formatTime = (item: NotificationItem) => {
    if (item.time) return item.time
    if (!item.createdAt) return "Just now"

    const created = new Date(item.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()

    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`

    return created.toLocaleDateString("en-NG")
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setNotifications(data)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((item) => !item.read).length

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase())

      const itemType = normalizeType(item.type)
      const matchesFilter = filter === "all" ? true : itemType === filter

      return matchesSearch && matchesFilter
    })
  }, [notifications, search, filter])

  const markAllAsRead = async () => {
    if (unreadCount === 0 || updating) return

    const previousNotifications = [...notifications]

    try {
      setUpdating(true)

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read: true }))
      )

      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      setNotifications(previousNotifications)
    } finally {
      setUpdating(false)
    }
  }

  const markOneAsRead = async (id: number) => {
    const target = notifications.find((item) => item.id === id)
    if (!target || target.read) return

    try {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      )

      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to mark notification as read")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false } : item))
      )
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const currentUser = getUser?.()
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL || ""

    if (!socketUrl || !currentUser?.id) return

    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    })

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", Number(currentUser.id))
    })

    socketRef.current.on("notification", (payload: SocketNotificationPayload) => {
      const liveNotification: NotificationItem = {
        id: Date.now(),
        title: payload.title || "New Notification",
        message: payload.message || "You have a new update.",
        type: payload.type || "announcement",
        time: payload.time || "Just now",
        read: false,
        href: payload.href || "/dashboard/notifications",
      }

      setNotifications((prev) => [liveNotification, ...prev])
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-blue-100">Notification Center</p>
            <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
            <p className="mt-2 text-sm text-blue-100">
              Stay updated with messages, school announcements, attendance alerts,
              results, and events.
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={notifications.length === 0 || unreadCount === 0 || updating}
          >
            <CheckCheck className="h-4 w-4" />
            {updating ? "Please wait..." : "Mark all as read"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Notifications"
          value={String(notifications.length)}
          subtitle="All recent updates"
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
            notifications.filter(
              (item) => normalizeType(item.type) === "announcement"
            ).length
          )}
          subtitle="School notices"
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatCard
          title="Events"
          value={String(
            notifications.filter((item) => normalizeType(item.type) === "event")
              .length
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
              Review your most recent updates.
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
              <option value="message">Messages</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length > 0 ? (
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
                        {getNotificationIcon(normalizeType(item.type))}
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

                      <p className="mt-1 text-sm text-gray-600">{item.message}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{item.createdAt ? formatDate(item.createdAt) : "Today"}</span>
                        <span>{formatTime(item)}</span>
                        <span className="capitalize">{normalizeType(item.type)}</span>
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
              No notifications found.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QuickLinkCard
          title="Messages"
          href="/dashboard/messages"
          description="Open your inbox and conversations."
        />
        <QuickLinkCard
          title="Students"
          href="/dashboard/students"
          description="Review student records and updates."
        />
        <QuickLinkCard
          title="Results"
          href="/dashboard/results"
          description="Check academic result updates."
        />
      </section>
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

function getNotificationIcon(type: NotificationType) {
  if (type === "announcement") {
    return <Megaphone className="h-4 w-4" />
  }

  if (type === "attendance") {
    return <Clock3 className="h-4 w-4" />
  }

  if (type === "result") {
    return <School className="h-4 w-4" />
  }

  if (type === "message") {
    return <Bell className="h-4 w-4" />
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