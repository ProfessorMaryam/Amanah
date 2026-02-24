"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SavingsGoal } from "@/lib/types"
import { Target, Calendar, TrendingUp, PiggyBank } from "lucide-react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
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

export function GoalOverview({ goal }: { goal: SavingsGoal }) {
  const percentage = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  )
  const monthsLeft = getMonthsRemaining(goal.targetDate)
  const remaining = goal.targetAmount - goal.currentAmount
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : 0

  return (
    <Card className="border-0 bg-card shadow-md">
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
            <span className="text-lg font-semibold text-amanah-plum">
              of {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <Progress value={percentage} className="h-4 bg-amanah-peach [&>div]:bg-accent" />
          <p className="text-base font-semibold text-accent-foreground">
            {percentage}% of your goal reached
          </p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <Calendar className="h-5 w-5 text-amanah-sage" />
            <div>
              <p className="text-sm font-medium text-amanah-sage">Months Remaining</p>
              <p className="text-lg font-bold text-primary">{monthsLeft}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <PiggyBank className="h-5 w-5 text-amanah-sage" />
            <div>
              <p className="text-sm font-medium text-amanah-sage">Still Needed</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(Math.max(0, remaining))}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <TrendingUp className="h-5 w-5 text-amanah-sage" />
            <div>
              <p className="text-sm font-medium text-amanah-sage">Monthly Target</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(monthlyNeeded))}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
