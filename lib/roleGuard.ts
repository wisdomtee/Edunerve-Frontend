export const requireRole = (allowedRoles: string[]) => {
  if (typeof window === "undefined") return true

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!user?.role || !allowedRoles.includes(user.role)) {
    window.location.href = "/login"
    return false
  }

  return true
}