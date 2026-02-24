"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, Plus, X } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { Child } from "@/lib/types"

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

export function ChildCard({ child }: { child: Child }) {
  const { addContribution } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState("")

  const percentage = Math.min(
    100,
    Math.round((child.goal.currentAmount / child.goal.targetAmount) * 100)
  )
  const monthsLeft = getMonthsRemaining(child.goal.targetDate)

  function handleContribute(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (num > 0) {
      addContribution(child.id, num, "Quick contribution")
      setAmount("")
      setShowForm(false)
    }
  }

  return (
    <Card className="border-0 bg-card shadow-md transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Child name + goal */}
        <div>
          <h3 className="text-xl font-bold text-primary">{child.name}</h3>
          <p className="text-base text-amanah-sage">{child.goal.name}</p>
        </div>

        {/* Amounts */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-amanah-sage">Saved</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(child.goal.currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-amanah-sage">Target</p>
            <p className="text-lg font-semibold text-amanah-plum">
              {formatCurrency(child.goal.targetAmount)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <Progress value={percentage} className="h-3 bg-amanah-peach [&>div]:bg-accent" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-accent-foreground">
              {percentage}% complete
            </span>
            <span className="text-sm font-medium text-amanah-sage">
              {monthsLeft} months remaining
            </span>
          </div>
        </div>

        {/* Add contribution form */}
        {showForm && (
          <form onSubmit={handleContribute} className="flex flex-col gap-3 rounded-xl bg-amanah-cream p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`amount-${child.id}`} className="text-base font-medium text-amanah-plum">
                Contribution Amount
              </Label>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-amanah-sage hover:text-primary transition-colors"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-3">
              <Input
                id={`amount-${child.id}`}
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount (MYR)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 flex-1 text-base bg-card"
                required
              />
              <Button type="submit" className="h-12 px-6 text-base font-semibold">
                Add
              </Button>
            </div>
          </form>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link href={`/dashboard/child/${child.id}`} className="flex-1">
            <Button
              variant="outline"
              className="h-12 w-full gap-2 border-border text-base font-semibold text-primary hover:bg-amanah-cream"
            >
              <Eye className="h-5 w-5" />
              View Details
            </Button>
          </Link>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="h-12 flex-1 gap-2 bg-secondary text-secondary-foreground text-base font-semibold hover:bg-secondary/80"
            >
              <Plus className="h-5 w-5" />
              Add Contribution
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
