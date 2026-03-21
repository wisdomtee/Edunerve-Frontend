export const saveAuth = (token: string, user: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
  return null
}

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}