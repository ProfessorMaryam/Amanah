"use client"

import { useApp } from "@/lib/app-context"
import type { Child, Contribution } from "@/lib/types"

// ---- helpers ----

const GOAL_EMOJIS: Record<string, string> = {
  UNIVERSITY: "🎓",
  CAR: "🚗",
  WEDDING: "💍",
  BUSINESS: "💼",
  GENERAL: "⭐",
}

const GOAL_LABELS: Record<string, string> = {
  UNIVERSITY: "University Adventure",
  CAR: "Dream Car Fund",
  WEDDING: "Wedding Dream",
  BUSINESS: "Business Launch",
  GENERAL: "Savings Journey",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today 🌟"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
}

function getMonthsRemaining(targetDate: string) {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, diff)
}

// ---- Circular progress ----
function CircleProgress({ percentage }: { percentage: number }) {
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx="110" cy="110" r={radius}
          fill="none"
          stroke="#ede9fe"
          strokeWidth="18"
        />
        {/* Progress arc */}
        <circle
          cx="110" cy="110" r={radius}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      {/* Centre text */}
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black text-violet-700">{percentage}%</span>
        <span className="text-sm font-semibold text-pink-500">saved!</span>
      </div>
    </div>
  )
}

// ---- Milestone badges ----
const MILESTONES = [
  { pct: 25, emoji: "🌱", label: "Sprout" },
  { pct: 50, emoji: "⭐", label: "Star" },
  { pct: 75, emoji: "🚀", label: "Rocket" },
  { pct: 100, emoji: "🏆", label: "Champion" },
]

function Milestones({ percentage }: { percentage: number }) {
  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {MILESTONES.map((m) => {
        const achieved = percentage >= m.pct
        return (
          <div
            key={m.pct}
            className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 transition-all duration-300 ${
              achieved
                ? "bg-gradient-to-br from-violet-200 to-pink-200 shadow-md scale-105"
                : "bg-white/60 opacity-40 grayscale"
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className={`text-xs font-bold ${achieved ? "text-violet-700" : "text-gray-400"}`}>
              {m.pct}% {achieved && "✓"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- Stat card ----
function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl ${color} px-5 py-4 shadow-sm`}>
      <span className="text-3xl">{emoji}</span>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-black text-gray-800">{value}</p>
    </div>
  )
}

// ---- Contribution list ----
function ContributionList({ contributions }: { contributions: Contribution[] }) {
  if (contributions.length === 0) {
    return (
      <div className="rounded-2xl bg-white/70 p-6 text-center shadow-sm">
        <p className="text-4xl mb-2">🐷</p>
        <p className="text-base font-semibold text-violet-700">No savings yet!</p>
        <p className="text-sm text-gray-400 mt-1">Your parent will add contributions soon.</p>
      </div>
    )
  }

  const recent = [...contributions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const depositEmojis = ["💰", "🌟", "✨", "🎉", "💫", "🎊", "⭐", "🌈"]

  return (
    <div className="flex flex-col gap-2">
      {recent.map((c, i) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{depositEmojis[i % depositEmojis.length]}</span>
            <span className="text-sm font-medium text-gray-500">{timeAgo(c.date)}</span>
          </div>
          <span className="text-base font-extrabold text-violet-700">+{formatCurrency(c.amount)}</span>
        </div>
      ))}
    </div>
  )
}

// ---- No goal state ----
function NoGoalState({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <span className="text-7xl">🌱</span>
      <div>
        <h2 className="text-2xl font-black text-violet-700">Hi {name}!</h2>
        <p className="mt-2 text-base text-gray-500 max-w-xs mx-auto">
          Your savings goal hasn't been set up yet. Ask your parent to get started!
        </p>
      </div>
    </div>
  )
}

// ---- Main ChildDashboard ----
export function ChildDashboard() {
  const { user, myGoal } = useApp()

  if (!myGoal) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <NoGoalState name={user.name.split(" ")[0]} />
      </div>
    )
  }

  const goal = myGoal.goal
  const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
  const monthsLeft = getMonthsRemaining(goal.targetDate)
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const goalEmoji = GOAL_EMOJIS[goal.goalType] ?? "⭐"
  const goalLabel = GOAL_LABELS[goal.goalType] ?? "Savings Journey"
  const firstName = myGoal.name.split(" ")[0]

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Hero greeting */}
      <div className="mb-8 text-center">
        <p className="text-5xl mb-2">{goalEmoji}</p>
        <h1 className="text-3xl font-black text-violet-800 leading-tight">
          {firstName}&apos;s {goalLabel}
        </h1>
        <p className="mt-1 text-base text-pink-500 font-semibold">
          Keep going — you&apos;re doing amazing! 🎉
        </p>
      </div>

      {/* Circular progress */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <CircleProgress percentage={percentage} />
        <div className="text-center">
          <p className="text-sm text-gray-400 font-medium">
            {formatCurrency(goal.currentAmount)} saved of {formatCurrency(goal.targetAmount)}
          </p>
        </div>
      </div>

      {/* Milestone badges */}
      <div className="mb-8">
        <Milestones percentage={percentage} />
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCard
          emoji="🐷"
          label="Saved"
          value={formatCurrency(goal.currentAmount)}
          color="bg-violet-100"
        />
        <StatCard
          emoji="🎯"
          label="To Go"
          value={formatCurrency(remaining)}
          color="bg-pink-100"
        />
        <StatCard
          emoji="⏰"
          label="Months"
          value={String(monthsLeft)}
          color="bg-yellow-100"
        />
      </div>

      {/* Contribution history */}
      <div className="mb-4">
        <h2 className="mb-3 text-lg font-extrabold text-violet-700 flex items-center gap-2">
          💸 Recent Deposits
        </h2>
        <ContributionList contributions={myGoal.contributions} />
      </div>

      {/* Motivational footer */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-violet-200 via-pink-200 to-yellow-200 p-4 text-center shadow-sm">
        <p className="text-sm font-bold text-violet-800">
          {percentage >= 75
            ? "🏆 You're almost there! Keep it up!"
            : percentage >= 50
            ? "🚀 Halfway! You're on fire!"
            : percentage >= 25
            ? "⭐ Great start! Keep saving!"
            : "🌱 Every little bit counts!"}
        </p>
      </div>
    </div>
  )
}
