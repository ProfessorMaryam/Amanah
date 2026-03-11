"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Heart,
  LogOut,
  Menu,
  Star,
  Target,
  ShoppingBag,
  Home,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PersonalGoal } from "@/lib/app-context"
import { PET_STAGE_NAMES, PET_STAGE_THRESHOLDS, getPetStage } from "@/components/child-pet-sprite"

const GOAL_PRESETS: Record<string, { emoji: string; label: string }> = {
  BICYCLE: { emoji: "🚲", label: "Bicycle" },
  GAME:    { emoji: "🎮", label: "Game" },
  TRIP:    { emoji: "✈️", label: "Trip" },
  GADGET:  { emoji: "📱", label: "Gadget" },
  SPORTS:  { emoji: "⚽", label: "Sports" },
  BOOK:    { emoji: "📚", label: "Books" },
  PET:     { emoji: "🐾", label: "Pet" },
  CLOTHES: { emoji: "👟", label: "Clothes" },
  CAMP:    { emoji: "🏕️", label: "Camp" },
  OTHER:   { emoji: "⭐", label: "Other" },
  UNIVERSITY: { emoji: "🎓", label: "University" },
  CAR:     { emoji: "🚗", label: "Car" },
  WEDDING: { emoji: "💍", label: "Wedding" },
  BUSINESS:{ emoji: "💼", label: "Business" },
  GENERAL: { emoji: "🌟", label: "General" },
}

function presetFor(type: string) {
  return GOAL_PRESETS[type] ?? { emoji: "🎯", label: type }
}

function formatBHD(n: number) {
  return n.toFixed(3) + " BD"
}

// Happiness to color + label
function happinessLabel(h: number) {
  if (h >= 80) return { label: "Overjoyed!", color: "text-green-600" }
  if (h >= 60) return { label: "Happy", color: "text-emerald-600" }
  if (h >= 40) return { label: "OK", color: "text-yellow-600" }
  if (h >= 20) return { label: "Sad", color: "text-orange-600" }
  return { label: "Needs love!", color: "text-red-600" }
}

interface ChildSidebarContentProps {
  userName: string
  petName: string
  petType: string | null
  petStage: number
  petHappiness: number
  coins: number
  personalGoals: PersonalGoal[]
  totalSaved: number
  activeSection: string
  onNavigate?: () => void
}

function SidebarContent({
  userName,
  petName,
  petType,
  petStage,
  petHappiness,
  coins,
  personalGoals,
  totalSaved,
  activeSection,
  onNavigate,
}: ChildSidebarContentProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const firstName = userName.split(" ")[0]
  const stageName = PET_STAGE_NAMES[petStage - 1] ?? "Egg"
  const nextThreshold = PET_STAGE_THRESHOLDS[petStage] // undefined at max
  const currentThreshold = PET_STAGE_THRESHOLDS[petStage - 1] ?? 0
  const stagePct = nextThreshold
    ? Math.min(100, Math.round(((totalSaved - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100

  const mood = happinessLabel(petHappiness)

  const NAV_ITEMS = [
    { id: "home",    label: "Home",      icon: Home,        href: "/dashboard/child-view" },
    { id: "pet",     label: "My Pet",    icon: Star,        href: "/dashboard/child-view/pet" },
    { id: "goals",   label: "My Goals",  icon: Target,      href: "/dashboard/child-view/goals" },
    { id: "store",   label: "Pet Store", icon: ShoppingBag, href: "/dashboard/child-view/store" },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="border-b border-border px-5 py-4 bg-gradient-to-r from-violet-100 to-pink-100">
        <Link href="/dashboard/child-view" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-primary">Amanah</span>
            <p className="text-xs text-violet-600 font-medium">Kids Zone ✨</p>
          </div>
        </Link>
      </div>

      {/* Greeting */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-pink-50 border-b border-border">
        <p className="text-sm font-bold text-primary">Hey {firstName}! 👋</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600">{coins} coins</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-3">
        <p className="mb-1.5 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Navigate
        </p>
        {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
              activeSection === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-amanah-plum hover:bg-violet-100 hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {id === "goals" && personalGoals.length > 0 && (
              <span className="ml-auto rounded-full bg-pink-400 text-white text-xs px-1.5 py-0.5 font-bold">
                {personalGoals.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Pet Status Card */}
      {petType && (
        <div className="mx-3 mb-2 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-violet-700">
              {petName || "My Pet"}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">
              {stageName}
            </span>
          </div>
          {/* Happiness */}
          <div className="mb-1.5">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Happiness</span>
              <span className={cn("font-bold", mood.color)}>{mood.label}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${petHappiness}%`,
                  background: petHappiness >= 60
                    ? "linear-gradient(90deg, #34d399, #10b981)"
                    : petHappiness >= 30
                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(90deg, #f87171, #ef4444)",
                }}
              />
            </div>
          </div>
          {/* Stage progress */}
          {nextThreshold && (
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">Next Stage</span>
                <span className="font-bold text-violet-700">{stagePct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
                  style={{ width: `${stagePct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Save {formatBHD(nextThreshold - totalSaved)} more to evolve!
              </p>
            </div>
          )}
          {!nextThreshold && (
            <p className="text-xs text-center font-bold text-amber-600 mt-1">🌟 MAX STAGE! 🌟</p>
          )}
        </div>
      )}

      {/* Goals mini-list */}
      {personalGoals.length > 0 && (
        <div className="mx-3 mb-2 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
          <p className="text-xs font-bold text-emerald-700 mb-2">My Goals 🎯</p>
          <div className="flex flex-col gap-1.5" style={{ maxHeight: 150, overflowY: "auto" }}>
            {personalGoals.map((g) => {
              const pct = g.targetAmount > 0
                ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                : 0
              const p = presetFor(g.name)
              return (
                <div key={g.id} className="rounded-xl bg-white/70 px-2.5 py-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amanah-plum flex items-center gap-1">
                      <span>{p.emoji}</span> {p.label}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* User + Logout */}
      <div className="border-t border-border px-4 py-4">
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

interface ChildSidebarProps {
  userName: string
  petName: string
  petType: string | null
  petStage: number
  petHappiness: number
  coins: number
  personalGoals: PersonalGoal[]
  totalSaved: number
  activeSection: string
}

export function ChildSidebar(props: ChildSidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-gradient-to-b from-amanah-cream to-white lg:flex lg:flex-col overflow-y-auto">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-gradient-to-r from-violet-100 to-pink-100 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link href="/dashboard/child-view" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-primary">Amanah Kids ✨</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">{props.coins}</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-amanah-plum">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-gradient-to-b from-amanah-cream to-white p-0 overflow-y-auto">
              <SheetTitle className="sr-only">Kids Navigation</SheetTitle>
              <SidebarContent {...props} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
