"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { useApp } from "@/lib/app-context"
import type { GoalType } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  UNIVERSITY: "University Fund",
  CAR: "Car Fund",
  WEDDING: "Wedding Fund",
  BUSINESS: "Business Fund",
  GENERAL: "General Savings",
}

export default function AddChildPage() {
  const router = useRouter()
  const { addChild, user } = useApp()

  // Only parents can add children
  if (user.role === "child") {
    router.replace("/dashboard")
    return null
  }

  const [childName, setChildName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [goalType, setGoalType] = useState<GoalType>("GENERAL")
  const [targetAmount, setTargetAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    console.log("[AddChildPage] Submitting name=%s goalType=%s target=%s date=%s", childName, goalType, targetAmount, targetDate)
    try {
      await addChild(
        childName,
        dateOfBirth,
        goalType,
        parseFloat(targetAmount) || 10000,
        targetDate || "2035-01-01",
      )
      console.log("[AddChildPage] Child added successfully, redirecting to dashboard")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("[AddChildPage] Failed to add child:", err)
      setError(err?.message ?? "Failed to save child. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-base font-medium text-amanah-sage hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Add a New Child</CardTitle>
            <CardDescription className="text-base text-amanah-sage">
              Set up a savings plan for your child. You can update goals and details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="childName" className="text-base font-medium text-amanah-plum">Child Name</Label>
                <Input
                  id="childName"
                  type="text"
                  placeholder="Enter your child's name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="dateOfBirth" className="text-base font-medium text-amanah-plum">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base font-medium text-amanah-plum">Savings Goal Type</Label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                  <SelectTrigger className="h-12 text-base bg-amanah-cream border-input">
                    <SelectValue placeholder="Select a goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((key) => (
                      <SelectItem key={key} value={key}>{GOAL_TYPE_LABELS[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="targetAmount" className="text-base font-medium text-amanah-plum">Target Amount (BHD)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="100"
                  step="100"
                  placeholder="Enter target savings amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="targetDate" className="text-base font-medium text-amanah-plum">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Link href="/dashboard" className="sm:order-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full border-border text-base font-semibold text-amanah-plum hover:bg-amanah-cream sm:w-auto sm:px-8"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 text-base font-semibold sm:order-2 sm:px-8"
                >
                  {submitting ? "Saving..." : "Save Child"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
