"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Investment } from "@/lib/types"
import { Briefcase, TrendingUp } from "lucide-react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const allocationColors = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-amanah-peach",
]

export function InvestmentPortfolio({ investment }: { investment?: Investment }) {
  if (!investment || !investment.active) {
    return (
      <Card className="border-0 bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-primary">
            <Briefcase className="h-6 w-6" />
            Investment Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-base text-amanah-sage">
            No active investment portfolio for this child.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <Briefcase className="h-6 w-6" />
          Investment Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Value + Growth */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amanah-sage">Current Investment Value</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(investment.currentValue)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-2">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
            <span className="text-lg font-bold text-accent-foreground">
              +{investment.growthPercentage}%
            </span>
            <span className="text-sm text-amanah-sage">growth</span>
          </div>
        </div>

        {/* Allocation */}
        <div className="flex flex-col gap-3">
          <p className="text-base font-semibold text-amanah-plum">Allocation</p>

          {/* Bar */}
          <div className="flex h-4 overflow-hidden rounded-full">
            {investment.allocation.map((a, i) => (
              <div
                key={a.label}
                className={`${allocationColors[i % allocationColors.length]} h-full`}
                style={{ width: `${a.percentage}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {investment.allocation.map((a, i) => (
              <div key={a.label} className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${allocationColors[i % allocationColors.length]}`}
                />
                <span className="text-base text-amanah-plum">
                  {a.label}: {a.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
