"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Investment } from "@/lib/types"
import { Briefcase, TrendingUp, ShieldCheck, Zap, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const PORTFOLIO_META: Record<string, {
  label: string
  rate: number
  icon: React.ElementType
  badgeColor: string
  allocation: { label: string; percentage: number }[]
}> = {
  CONSERVATIVE: {
    label: "Conservative",
    rate: 4,
    icon: ShieldCheck,
    badgeColor: "bg-secondary/20 text-primary",
    allocation: [
      { label: "Bonds", percentage: 50 },
      { label: "Index Funds", percentage: 30 },
      { label: "Savings Account", percentage: 20 },
    ],
  },
  BALANCED: {
    label: "Balanced",
    rate: 7,
    icon: TrendingUp,
    badgeColor: "bg-accent/20 text-accent-foreground",
    allocation: [
      { label: "Index Funds", percentage: 50 },
      { label: "Bonds", percentage: 30 },
      { label: "Savings Account", percentage: 20 },
    ],
  },
  GROWTH: {
    label: "Growth",
    rate: 10,
    icon: Zap,
    badgeColor: "bg-amanah-sky/20 text-primary",
    allocation: [
      { label: "Index Funds", percentage: 70 },
      { label: "Bonds", percentage: 20 },
      { label: "Savings Account", percentage: 10 },
    ],
  },
}

const allocationColors = ["bg-primary", "bg-secondary", "bg-accent"]

interface InvestmentPortfolioProps {
  investment?: Investment
  childId: string
}

export function InvestmentPortfolio({ investment, childId }: InvestmentPortfolioProps) {
  if (!investment) {
    return (
      <Card className="border-0 bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-primary">
            <Briefcase className="h-6 w-6" />
            Investment Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-base text-amanah-sage">
            No investment portfolio set up yet.
          </p>
          <Link href={`/dashboard/child/${childId}/investment`}>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Set Up Portfolio
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const meta = PORTFOLIO_META[investment.portfolioType]
  const Icon = meta?.icon ?? Briefcase

  return (
    <Card className="border-0 bg-card shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <Briefcase className="h-6 w-6" />
          Investment Portfolio
          {meta && (
            <Badge className={cn("ml-1 text-xs font-semibold", meta.badgeColor)}>
              {meta.label}
            </Badge>
          )}
        </CardTitle>
        <Link href={`/dashboard/child/${childId}/investment`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-amanah-sage hover:text-primary">
            <ExternalLink className="h-4 w-4" />
            Manage
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amanah-sage">Current Investment Value</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(investment.currentValue)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-2">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
              <span className="text-lg font-bold text-accent-foreground">
                {investment.allocationPercentage}%
              </span>
              <span className="text-sm text-amanah-sage">allocated</span>
            </div>
            {meta && (
              <div className="flex items-center gap-2 rounded-xl bg-amanah-cream px-4 py-2">
                <Icon className="h-4 w-4 text-amanah-sage" />
                <span className="text-sm font-semibold text-primary">{meta.rate}% p.a.</span>
              </div>
            )}
          </div>
        </div>

        {meta && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-amanah-plum">Asset Allocation</p>
            <div className="flex h-3 overflow-hidden rounded-full">
              {meta.allocation.map((a, i) => (
                <div
                  key={a.label}
                  className={cn("h-full", allocationColors[i % allocationColors.length])}
                  style={{ width: `${a.percentage}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {meta.allocation.map((a, i) => (
                <div key={a.label} className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", allocationColors[i % allocationColors.length])} />
                  <span className="text-sm text-amanah-plum">{a.label}: {a.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
