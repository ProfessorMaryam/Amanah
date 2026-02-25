"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardHeader } from "@/components/dashboard-header"
import { useApp } from "@/lib/app-context"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddChildPage() {
  const router = useRouter()
  const { addChild } = useApp()

  const [childName, setChildName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [goalName, setGoalName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addChild({
      id: "",
      name: childName,
      dateOfBirth,
      goal: {
        name: goalName || "Savings Goal",
        targetAmount: parseFloat(targetAmount) || 10000,
        currentAmount: 0,
        startDate: new Date().toISOString().split("T")[0],
        targetDate: targetDate || "2035-01-01",
      },
    })
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-base font-medium text-amanah-sage hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">
              Add a New Child
            </CardTitle>
            <CardDescription className="text-base text-amanah-sage">
              Set up a savings plan for your child. You can update goals and details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Child Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="childName" className="text-base font-medium text-amanah-plum">
                  Child Name
                </Label>
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

              {/* Date of Birth */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateOfBirth" className="text-base font-medium text-amanah-plum">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              {/* Goal Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="goalName" className="text-base font-medium text-amanah-plum">
                  Savings Goal Name
                </Label>
                <Input
                  id="goalName"
                  type="text"
                  placeholder="e.g., University Fund, Wedding Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                />
              </div>

              {/* Target Amount */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetAmount" className="text-base font-medium text-amanah-plum">
                  Target Amount (BHD)
                </Label>
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

              {/* Target Date */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetDate" className="text-base font-medium text-amanah-plum">
                  Target Date
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              {/* Actions */}
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
                  className="h-12 text-base font-semibold sm:order-2 sm:px-8"
                >
                  Save Child
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
