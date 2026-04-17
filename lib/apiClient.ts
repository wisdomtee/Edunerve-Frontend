// /lib/apiClient.ts

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function handleUnauthorized(skipAuthRedirect?: boolean) {
  if (typeof window === "undefined") return

  localStorage.removeItem("token")

  if (!skipAuthRedirect) {
    window.location.href = "/login"
  }
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { skipAuthRedirect = false, headers, ...rest } = options
  const token = getToken()

  const finalHeaders = new Headers(headers || {})

  // Only set JSON content type if caller did not already provide one
  if (!finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json")
  }

  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  })

  if (response.status === 401) {
    console.error("Unauthorized → logging out")
    handleUnauthorized(skipAuthRedirect)
    throw new Error("Unauthorized")
  }

  return response
}

export async function apiFetchJson<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const response = await apiFetch(url, options)

  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`

    try {
      if (isJson) {
        const errorData = await response.json()
        errorMessage =
          errorData?.message ||
          errorData?.error ||
          errorMessage
      } else {
        const errorText = await response.text()
        if (errorText) errorMessage = errorText
      }
    } catch {
      // ignore parsing failure and keep default message
    }

    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return null as T
  }

  if (isJson) {
    return response.json() as Promise<T>
  }

  const text = await response.text()
  return text as T
}