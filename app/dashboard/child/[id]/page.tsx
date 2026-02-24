"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { GoalOverview } from "@/components/child-detail/goal-overview"
import { SavingsChart } from "@/components/child-detail/savings-chart"
import { ContributionHistory } from "@/components/child-detail/contribution-history"
import { InvestmentPortfolio } from "@/components/child-detail/investment-portfolio"
import { FutureInstructions } from "@/components/child-detail/future-instructions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, X, Calendar } from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getAge(dateOfBirth: string) {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getChild, addContribution } = useApp()
  const [showContributeForm, setShowContributeForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  const child = getChild(id)

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
          <Card className="border-0 bg-card shadow-md">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <h2 className="text-xl font-semibold text-primary">Child not found</h2>
              <p className="text-base text-amanah-sage">
                The child you are looking for does not exist.
              </p>
              <Link href="/dashboard">
                <Button className="h-12 text-base font-semibold">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  function handleContribute(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (num > 0) {
      addContribution(child!.id, num, note || undefined)
      setAmount("")
      setNote("")
      setShowContributeForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-base font-medium text-amanah-sage hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        {/* Child header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary lg:text-4xl">
              {child.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-base text-amanah-sage">
              <Calendar className="h-4 w-4" />
              <span>Born {formatDate(child.dateOfBirth)}</span>
              <span className="text-amanah-plum font-medium">
                ({getAge(child.dateOfBirth)} years old)
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowContributeForm(!showContributeForm)}
            className="h-12 gap-2 text-base font-semibold"
            size="lg"
          >
            {showContributeForm ? (
              <>
                <X className="h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Contribution
              </>
            )}
          </Button>
        </div>

        {/* Quick contribute form */}
        {showContributeForm && (
          <Card className="mb-8 border-0 bg-amanah-peach/30 shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleContribute} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="contribute-amount" className="text-base font-medium text-amanah-plum">
                    Amount (MYR)
                  </Label>
                  <Input
                    id="contribute-amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-base bg-card"
                    required
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="contribute-note" className="text-base font-medium text-amanah-plum">
                    Note (optional)
                  </Label>
                  <Input
                    id="contribute-note"
                    type="text"
                    placeholder="e.g., Monthly savings"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-12 text-base bg-card"
                  />
                </div>
                <Button type="submit" className="h-12 px-8 text-base font-semibold">
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        <div className="flex flex-col gap-8">
          <GoalOverview goal={child.goal} />
          <SavingsChart contributions={child.contributions} currentAmount={child.goal.currentAmount} />
          <ContributionHistory contributions={child.contributions} />
          <InvestmentPortfolio investment={child.investment} />
          <FutureInstructions instructions={child.futureInstructions} />
        </div>
      </main>
    </div>
  )
}
