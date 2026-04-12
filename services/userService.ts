const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

function getToken(): string {
  return sessionStorage.getItem("token") ?? ""
}

function authHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getToken()}`,
  }
}

export async function getUserById(id: string) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`)
  return res.json()
}

export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function createUser(user: { name: string; type: string; status: string; password: string }) {
  const id  = crypto.randomUUID()
  const res = await fetch(`${API_BASE}/users`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ id, ...user }),
  })
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`)
  return res.json()
}

export async function updateUser(id: string, data: any) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method:  "PATCH",
    headers: authHeaders(),
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Failed to update user (${res.status}): ${body}`)
  }
  return res.json()
}

export async function deactivateUser(id: string) {
  return updateUser(id, { status: "INACTIVE" })
}

export async function getUsersByType(type: string) {
  const res = await fetch(`${API_BASE}/users/type/${type}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) return []
  return res.json()
}