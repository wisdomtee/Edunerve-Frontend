"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type RoleGuardProps = {
  children: ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

type StoredUser = {
  id?: number | string
  name?: string
  email?: string
  role?: string
  schoolId?: number | null
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/dashboard",
}: RoleGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")

      if (!storedUser) {
        router.replace("/login")
        return
      }

      const user: StoredUser = JSON.parse(storedUser)

      if (!user?.role) {
        router.replace("/login")
        return
      }

      if (!allowedRoles.includes(user.role)) {
        router.replace(fallbackPath)
        return
      }

      setAuthorized(true)
    } catch {
      router.replace("/login")
    } finally {
      setChecking(false)
    }
  }, [allowedRoles, fallbackPath, router])

  if (checking) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Checking access...</p>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}