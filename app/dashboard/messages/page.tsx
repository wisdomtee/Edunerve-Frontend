"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { API_BASE_URL, getAuthHeaders, getToken, getUser } from "@/lib/api"

type UserSummary = {
  id: number
  name: string
  email: string
  role: string
  schoolId?: number | null
}

type MessageItem = {
  id: number
  subject?: string | null
  content: string
  isRead: boolean
  senderId: number
  receiverId: number
  schoolId?: number | null
  createdAt: string
  updatedAt: string
  sender: UserSummary
  receiver: UserSummary
}

type CurrentUser = {
  id: number
  name: string
  email: string
  role: string
  schoolId?: number | null
  token?: string
}

type MessageReadPayload = {
  messageId: number
  receiverId?: number
}

type MessageDeletedPayload = {
  messageId: number
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "inbox" | "sent">("all")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [subject, setSubject] = useState("")
  const [sending, setSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const token = useMemo(() => getToken(), [])
  const currentUser = useMemo<CurrentUser | null>(() => getUser(), [])

  const fetchMessages = async (tab: "all" | "inbox" | "sent" = activeTab) => {
    try {
      setLoading(true)
      setError("")

      const endpoint =
        tab === "all"
          ? `${API_BASE_URL}/messages`
          : `${API_BASE_URL}/messages/${tab}`

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })

      const data = await res.json().catch(() => [])

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch messages")
      }

      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => [])

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to fetch users")
      }

      const allUsers = Array.isArray(data) ? data : []

      const filteredUsers = currentUser
        ? allUsers.filter((user: UserSummary) => user.id !== currentUser.id)
        : allUsers

      setUsers(filteredUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchConversation = async (otherUserId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/messages/conversation/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      )

      const data = await res.json().catch(() => [])

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch conversation")
      }

      const conversation = Array.isArray(data) ? data : []

      setMessages((prev) => {
        const others = prev.filter(
          (msg) =>
            !(
              (msg.senderId === currentUser?.id &&
                msg.receiverId === otherUserId) ||
              (msg.senderId === otherUserId &&
                msg.receiverId === currentUser?.id)
            )
        )

        const merged = [...others, ...conversation]
        const uniqueMap = new Map<number, MessageItem>()

        merged.forEach((msg) => uniqueMap.set(msg.id, msg))

        return Array.from(uniqueMap.values())
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversation"
      )
    }
  }

  useEffect(() => {
    fetchMessages(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    fetchConversation(selectedUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  useEffect(() => {
    if (!currentUser || !token) return

    const socketInstance: Socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
    })

    socketRef.current = socketInstance

    socketInstance.on("connect", () => {
      setSocketConnected(true)
      socketInstance.emit("join", currentUser.id)
    })

    socketInstance.on("disconnect", () => {
      setSocketConnected(false)
    })

    socketInstance.on("new_message", (message: MessageItem) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [message, ...prev]
      })
    })

    socketInstance.on("message_sent", (message: MessageItem) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [message, ...prev]
      })
    })

    socketInstance.on("message_updated", (message: MessageItem) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      )
    })

    socketInstance.on("message_read", ({ messageId }: MessageReadPayload) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      )
    })

    socketInstance.on(
      "message_deleted",
      ({ messageId }: MessageDeletedPayload) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    )

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [currentUser, token])

  const conversationMessages = useMemo(() => {
    if (!selectedUserId || !currentUser) return []

    return messages
      .filter(
        (message) =>
          (message.senderId === currentUser.id &&
            message.receiverId === selectedUserId) ||
          (message.senderId === selectedUserId &&
            message.receiverId === currentUser.id)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
  }, [messages, selectedUserId, currentUser])

  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === selectedUserId) || null
  }, [users, selectedUserId])

  const unreadInboxCount = useMemo(() => {
    if (!currentUser) return 0

    return messages.filter(
      (m) => m.receiverId === currentUser.id && !m.isRead
    ).length
  }, [messages, currentUser])

  useEffect(() => {
    if (!selectedUserId || !currentUser || !token) return

    const unreadMessages = conversationMessages.filter(
      (msg) => !msg.isRead && msg.receiverId === currentUser.id
    )

    if (unreadMessages.length === 0) return

    const markMessagesAsRead = async () => {
      try {
        await Promise.all(
          unreadMessages.map((msg) =>
            fetch(`${API_BASE_URL}/messages/${msg.id}/read`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          )
        )

        setMessages((prev) =>
          prev.map((msg) =>
            unreadMessages.some((unread) => unread.id === msg.id)
              ? { ...msg, isRead: true }
              : msg
          )
        )
      } catch (err) {
        console.error("Failed to mark messages as read", err)
      }
    }

    markMessagesAsRead()
  }, [selectedUserId, conversationMessages, currentUser, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversationMessages])

  const handleSendMessage = async () => {
    if (!selectedUserId || !newMessage.trim()) return

    try {
      setSending(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/messages/send`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          receiverId: selectedUserId,
          subject: subject.trim() || null,
          content: newMessage.trim(),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send message")
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [data, ...prev]
      })

      setNewMessage("")
      setSubject("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      setDeletingMessageId(messageId)
      setError("")

      const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete message")
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message")
    } finally {
      setDeletingMessageId(null)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const handleSelectUser = async (userId: number) => {
    setSelectedUserId(userId)
    setError("")
  }

  return (
    <div className="h-[calc(100vh-100px)] p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-600">
          Chat with school staff and manage conversations
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : "border bg-white text-gray-700"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setActiveTab("inbox")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            activeTab === "inbox"
              ? "bg-blue-600 text-white"
              : "border bg-white text-gray-700"
          }`}
        >
          Inbox
          {unreadInboxCount > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
              {unreadInboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            activeTab === "sent"
              ? "bg-blue-600 text-white"
              : "border bg-white text-gray-700"
          }`}
        >
          Sent
        </button>

        <div className="ml-auto rounded-xl border bg-white px-3 py-2 text-xs text-gray-500">
          {socketConnected ? "Realtime connected" : "Connecting..."}
        </div>
      </div>

      <div className="grid h-[calc(100%-80px)] grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border bg-white lg:col-span-4 xl:col-span-3">
          <div className="border-b p-4">
            <h2 className="font-semibold text-gray-900">Users</h2>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {usersLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No users found</div>
            ) : (
              users.map((user) => {
                const unreadCount = messages.filter(
                  (m) =>
                    m.senderId === user.id &&
                    m.receiverId === currentUser?.id &&
                    !m.isRead
                ).length

                const lastMessage = messages
                  .filter(
                    (m) =>
                      (m.senderId === user.id &&
                        m.receiverId === currentUser?.id) ||
                      (m.senderId === currentUser?.id &&
                        m.receiverId === user.id)
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )[0]

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full border-b p-4 text-left transition hover:bg-gray-50 ${
                      selectedUserId === user.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {user.email}
                        </div>
                        <div className="mt-1 text-xs text-blue-600">
                          {user.role}
                        </div>
                        {lastMessage && (
                          <div className="mt-1 truncate text-xs text-gray-400">
                            {lastMessage.content}
                          </div>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border bg-white lg:col-span-8 xl:col-span-9">
          <div className="border-b p-4">
            {selectedUser ? (
              <div>
                <h2 className="font-semibold text-gray-900">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedUser.email} • {selectedUser.role}
                </p>
              </div>
            ) : (
              <h2 className="font-semibold text-gray-900">
                Select a conversation
              </h2>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading messages...
              </div>
            ) : !selectedUser ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Choose a user from the left to view messages
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No messages in this conversation yet
              </div>
            ) : (
              <>
                {conversationMessages.map((message) => {
                  const isMine = message.senderId === currentUser?.id

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "border bg-white text-gray-900"
                        }`}
                      >
                        {message.subject && (
                          <div
                            className={`mb-1 text-xs font-semibold ${
                              isMine ? "text-blue-100" : "text-blue-600"
                            }`}
                          >
                            {message.subject}
                          </div>
                        )}

                        <p className="text-sm leading-6">{message.content}</p>

                        <div className="mt-2 flex items-center justify-between gap-4">
                          <div
                            className={`text-[11px] ${
                              isMine ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                            {isMine && (
                              <span className="ml-2">
                                {message.isRead ? "• Read" : "• Sent"}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingMessageId === message.id}
                            className={`text-[11px] ${
                              isMine
                                ? "text-blue-100 hover:text-white"
                                : "text-red-500 hover:text-red-700"
                            } disabled:opacity-50`}
                          >
                            {deletingMessageId === message.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {selectedUser && (
            <div className="border-t bg-white p-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.name}`}
                  rows={3}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}