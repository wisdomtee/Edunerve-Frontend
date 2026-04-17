export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const TOKEN_KEY = "token"
const USER_KEY = "user"

export type StoredUser = {
  id?: number | string
  name?: string
  email?: string
  role?: string
  schoolId?: number | null
  mustChangePassword?: boolean
  token?: string
  [key: string]: any
}

export const saveAuth = (token: string, user: StoredUser) => {
  if (typeof window === "undefined") return

  const userWithToken: StoredUser = {
    ...user,
    token,
    mustChangePassword: Boolean(user.mustChangePassword),
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(userWithToken))
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null

  const directToken = localStorage.getItem(TOKEN_KEY)
  if (directToken) return directToken

  const rawUser = localStorage.getItem(USER_KEY)
  if (!rawUser) return null

  try {
    const parsedUser: StoredUser = JSON.parse(rawUser)
    return parsedUser.token || null
  } catch {
    return null
  }
}

export const getUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    const parsedUser: StoredUser = JSON.parse(raw)

    return {
      ...parsedUser,
      mustChangePassword: Boolean(parsedUser.mustChangePassword),
    }
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

export const logout = () => {
  if (typeof window === "undefined") return

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getAuthHeaders = (
  includeJsonContentType = true
): HeadersInit => {
  const token = getToken()

  return {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken()
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  })

  if (response.status === 401) {
    console.error("Unauthorized → logging out")
    logout()

    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }

    throw new Error("Unauthorized")
  }

  return response
}