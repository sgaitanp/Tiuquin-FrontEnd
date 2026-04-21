"use server"

import fs   from "fs"
import path from "path"

const DB_PATH    = path.join(process.cwd(), "db.json")
const API_BASE   = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1"

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function createUser(user: { id: string; name: string; type: string; status: string }) {
  const res = await fetch(`${API_BASE}/users`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(user),
  })
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`)
  return res.json()
}

export async function updateUser(id: string, data: any) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
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