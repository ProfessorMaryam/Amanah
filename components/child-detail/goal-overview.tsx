"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SavingsGoal } from "@/lib/types"
import { Target, Calendar, TrendingUp, PiggyBank, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthsRemaining(targetDate: string) {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, diff)
}

function getProjectedCompletion(remaining: number, monthlyNeeded: number, isPaused: boolean): string {
  if (remaining <= 0) return "Goal achieved!"
  if (isPaused) return "Paused"
  if (monthlyNeeded <= 0) return "—"
  const monthsNeeded = Math.ceil(remaining / monthlyNeeded)
  const date = new Date()
  date.setMonth(date.getMonth() + monthsNeeded)
  return date.toLocaleDateString("en-MY", { year: "numeric", month: "long" })
}

const MILESTONES = [25, 50, 75, 100]

export function GoalOverview({ goal }: { goal: SavingsGoal }) {
  const percentage = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  )
  const monthsLeft = getMonthsRemaining(goal.targetDate)
  const remaining = goal.targetAmount - goal.currentAmount
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : 0
  const isPaused = goal.paused ?? false
  const projectedCompletion = getProjectedCompletion(remaining, monthlyNeeded, isPaused)

  return (
    <Card className="border-0 bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <Target className="h-6 w-6" />
          Goal Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Progress bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-base font-semibold text-amanah-plum">
              of {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-3.5 rounded-full bg-amanah-peach [&>div]:rounded-full [&>div]:bg-accent"
          />
          <p className="text-sm font-semibold text-accent-foreground">
            {percentage}% of your goal reached
          </p>
        </div>

        {/* Milestone indicators */}
        <div className="flex items-center gap-2">
          {MILESTONES.map((milestone) => {
            const achieved = percentage >= milestone
            return (
              <div key={milestone} className="flex flex-1 flex-col items-center gap-1">
                {achieved ? (
                  <CheckCircle2 className="h-5 w-5 text-accent transition-colors duration-300" />
                ) : (
                  <Circle className="h-5 w-5 text-amanah-peach" />
                )}
                <span
                  className={cn(
                    "text-xs font-semibold transition-colors duration-300",
                    achieved ? "text-accent-foreground" : "text-amanah-sage"
                  )}
                >
                  {milestone}%
                </span>
              </div>
            )
          })}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <Calendar className="h-5 w-5 shrink-0 text-amanah-sage" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amanah-sage">Months Left</p>
              <p className="text-lg font-bold text-primary">{monthsLeft}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <PiggyBank className="h-5 w-5 shrink-0 text-amanah-sage" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amanah-sage">Still Needed</p>
              <p className="text-base font-bold text-primary truncate">{formatCurrency(Math.max(0, remaining))}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <TrendingUp className="h-5 w-5 shrink-0 text-amanah-sage" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amanah-sage">Monthly Target</p>
              <p className="text-base font-bold text-primary truncate">{formatCurrency(Math.round(monthlyNeeded))}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <Target className="h-5 w-5 shrink-0 text-amanah-sage" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amanah-sage">Projected</p>
              <p className="text-xs font-bold text-primary leading-tight">{projectedCompletion}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
