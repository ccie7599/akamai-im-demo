const API_BASE = import.meta.env.VITE_API_BASE || ""
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || ""

function withAuth(path: string): string {
  if (!AUTH_TOKEN) return path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}auth=${AUTH_TOKEN}`
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${withAuth(path)}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `API error: ${response.status}`)
  }
  return response.json()
}

export async function fetchWithHeaders(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  const size = parseInt(headers["content-length"] || "0", 10)
  return { response, headers, size, status: response.status }
}
