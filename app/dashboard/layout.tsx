"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppProvider, useApp } from "@/lib/app-context"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Heart, LogOut } from "lucide-react"
import Link from "next/link"

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

/** Colourful top bar for child-role users — replaces the sidebar entirely. */
function ChildTopBar() {
  const { user } = useApp()
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-purple-200 bg-gradient-to-r from-violet-100 via-pink-100 to-yellow-100 px-4 py-3 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm">
          <Heart className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-violet-700">Amanah</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold text-violet-600 sm:inline">
          Hi, {user.name.split(" ")[0]}! 👋
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-violet-500 hover:bg-violet-100 hover:text-violet-700"
          onClick={async () => { await signOut() }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}

/**
 * Inner layout — must be rendered inside AppProvider so it can read user.role.
 * Renders the child-friendly layout for role="child", normal sidebar for everyone else.
 */
function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useApp()

  if (user.role === "child") {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-50 via-pink-50 to-yellow-50">
        <ChildTopBar />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
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
        <InnerLayout>{children}</InnerLayout>
      </AppProvider>
    </AuthGuard>
  )
}
