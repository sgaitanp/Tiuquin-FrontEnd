import { Status, type CreateUserInput, type User } from "@/types/user"

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

export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`)
  return res.json()
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function createUser(user: CreateUserInput): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(user),
  })
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`)
  return res.json()
}

export async function updateUser(id: string, data: Partial<CreateUserInput>): Promise<User> {
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

export async function deactivateUser(id: string): Promise<User> {
  return updateUser(id, { status: Status.INACTIVE })
}

export async function getUsersByType(type: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users/type/${type}`, {
    headers: authHeaders(),
    cache:   "no-store",
  })
  if (!res.ok) return []
  return res.json()
}