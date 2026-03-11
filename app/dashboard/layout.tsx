"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AppProvider } from "@/lib/app-context"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amanah-peach border-t-primary" />
          <p className="text-sm text-amanah-sage">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Child-view has its own full-screen gamified layout with its own sidebar
  if (pathname.startsWith("/dashboard/child-view")) {
    return <>{children}</>
  }
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </AppProvider>
    </AuthGuard>
  )
}
