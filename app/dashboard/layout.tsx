"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppProvider } from "@/lib/app-context"
import { useAuth } from "@/lib/auth-context"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-amanah-plum text-lg">Loading…</p>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppProvider>{children}</AppProvider>
    </AuthGuard>
  )
}
