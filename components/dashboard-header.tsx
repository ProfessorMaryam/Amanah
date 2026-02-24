"use client"

import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { Heart, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  const { user } = useApp()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-amanah-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Amanah</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-base font-medium text-amanah-plum sm:inline">
            {user.name}
          </span>
          <Link href="/">
            <Button variant="ghost" size="lg" className="gap-2 text-amanah-sage hover:text-primary">
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
