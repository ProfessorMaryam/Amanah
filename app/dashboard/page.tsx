"use client"

import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { ChildCard } from "@/components/child-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, PiggyBank, Users, TrendingUp } from "lucide-react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const { user, children, totalSavings } = useApp()

  const totalTarget = children.reduce(
    (sum, c) => sum + c.goal.targetAmount,
    0
  )
  const overallPercent = totalTarget > 0
    ? Math.round((totalSavings / totalTarget) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary lg:text-4xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-lg text-amanah-sage">
            {"Here's an overview of your family savings plan."}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 bg-primary shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">
                  Total Family Savings
                </p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {formatCurrency(totalSavings)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amanah-peach">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-amanah-sage">
                  Children
                </p>
                <p className="text-2xl font-bold text-primary">
                  {children.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/30">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-amanah-sage">
                  Overall Progress
                </p>
                <p className="text-2xl font-bold text-primary">
                  {overallPercent}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section header + add button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">
            Your Children
          </h2>
          <Link href="/dashboard/add-child">
            <Button className="h-12 gap-2 text-base font-semibold" size="lg">
              <UserPlus className="h-5 w-5" />
              Add Child
            </Button>
          </Link>
        </div>

        {/* Children grid */}
        {children.length === 0 ? (
          <Card className="border-0 bg-card shadow-md">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <PiggyBank className="h-16 w-16 text-amanah-sage" />
              <h3 className="text-xl font-semibold text-primary">
                No children added yet
              </h3>
              <p className="text-base text-amanah-sage">
                Start by adding your first child and setting up a savings goal.
              </p>
              <Link href="/dashboard/add-child">
                <Button className="h-12 gap-2 text-base font-semibold" size="lg">
                  <UserPlus className="h-5 w-5" />
                  Add Your First Child
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
