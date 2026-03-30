"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"

export default function SocketProvider() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      transports: ["websocket"],
      withCredentials: true,
    })

    socketRef.current.on("connect", () => {
      console.log("✅ Connected:", socketRef.current?.id)
    })

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  return null
}