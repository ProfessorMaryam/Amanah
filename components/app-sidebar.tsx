"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useApp } from "@/lib/app-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Heart,
  LayoutDashboard,
  UserPlus,
  LogOut,
  Menu,
  ChevronRight,
  LayoutList,
  Briefcase,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-amanah-plum hover:bg-amanah-peach/50 hover:text-primary"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    </Link>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, children } = useApp()
  const { signOut } = useAuth()

  // Detect if we're on a child route and extract the child id
  const childRouteMatch = pathname.match(/^\/dashboard\/child\/([^/]+)/)
  const activeChildId = childRouteMatch ? childRouteMatch[1] : null
  const activeChild = activeChildId ? children.find((c) => c.id === activeChildId) : null

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary">Amanah</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-amanah-sage">
          Menu
        </p>
        <NavLink
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />
        {user.role !== "child" && (
          <NavLink
            href="/dashboard/add-child"
            icon={UserPlus}
            label="Add Child"
            active={pathname === "/dashboard/add-child"}
          />
        )}
      </nav>

      {/* Child sub-navigation (shown when viewing a child) */}
      {activeChild && (
        <div className="flex flex-col gap-1 border-t border-border px-3 py-4">
          <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-amanah-sage">
            {activeChild.name}
          </p>
          <NavLink
            href={`/dashboard/child/${activeChildId}`}
            icon={LayoutList}
            label="Overview"
            active={pathname === `/dashboard/child/${activeChildId}`}
          />
          <NavLink
            href={`/dashboard/child/${activeChildId}/investment`}
            icon={Briefcase}
            label="Investment"
            active={pathname === `/dashboard/child/${activeChildId}/investment`}
          />
          <NavLink
            href={`/dashboard/child/${activeChildId}/directive`}
            icon={Shield}
            label="Fund Directive"
            active={pathname === `/dashboard/child/${activeChildId}/directive`}
          />
        </div>
      )}

      {/* Children list */}
      {children.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border px-3 py-4">
          <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-amanah-sage">
            Children
          </p>
          <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: "180px" }}>
            {children.map((child) => {
              const isActive = pathname.startsWith(`/dashboard/child/${child.id}`)
              const pct = Math.min(100, Math.round((child.goal.currentAmount / child.goal.targetAmount) * 100))
              return (
                <Link key={child.id} href={`/dashboard/child/${child.id}`} onClick={onNavigate}>
                  <span
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-amanah-plum hover:bg-amanah-peach/50 hover:text-primary"
                    )}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          pct >= 75 ? "bg-accent" : pct >= 40 ? "bg-yellow-400" : "bg-amanah-peach"
                        )}
                      />
                      <span className="truncate font-medium">{child.name}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User + Logout */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amanah-peach text-sm font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{user.name}</p>
            <p className="truncate text-xs text-amanah-sage">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-amanah-sage hover:bg-destructive/10 hover:text-destructive"
          onClick={async () => { await signOut() }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-gradient-to-b from-amanah-cream to-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-amanah-cream/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-primary">Amanah</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-amanah-plum">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-gradient-to-b from-amanah-cream to-white p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
