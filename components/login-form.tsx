"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!username.trim()) { setError("Username is required."); return }
    if (!password.trim()) { setError("Password is required."); return }
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: username.trim(), password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.message ?? "Invalid credentials.")
        setLoading(false)
        return
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.message ?? "Login failed.")
        setLoading(false)
        return
      }

      // Save token and user to sessionStorage
      sessionStorage.setItem("token",       data.token)
      sessionStorage.setItem("currentUser", JSON.stringify(data.user))

      router.push("/dashboard/projects")
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Tiuquin account
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username or ID"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground">
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : "Login"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account? <a href="#" className="underline underline-offset-4">Sign up</a>
              </p>
            </div>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/assets/tiuquin_logo.png"
              alt="Tiuquin"
              className="absolute inset-0 h-full w-full object-contain object-center scale-90 dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <p className="px-6 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4">Privacy Policy</a>.
      </p>
    </div>
  )
}