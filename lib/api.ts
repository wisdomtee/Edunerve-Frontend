export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export const getAuthHeaders = () => {
  const token = getToken()

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}