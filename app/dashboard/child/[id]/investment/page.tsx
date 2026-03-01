"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import type { PortfolioType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Briefcase, TrendingUp, ShieldCheck, Zap, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ProfileDef {
  key: PortfolioType
  label: string
  icon: React.ElementType
  rate: number
  description: string
  /** Informational allocation breakdown — display only, not sent to backend */
  allocation: { label: string; percentage: number }[]
  color: string
  badgeColor: string
  /** Default allocation % of each contribution routed to investments */
  defaultAllocationPercent: number
}

const PROFILES: ProfileDef[] = [
  {
    key: "CONSERVATIVE",
    label: "Conservative",
    icon: ShieldCheck,
    rate: 4,
    description: "Lower risk. Prioritises capital preservation with steady, modest returns.",
    allocation: [
      { label: "Bonds", percentage: 50 },
      { label: "Index Funds", percentage: 30 },
      { label: "Savings Account", percentage: 20 },
    ],
    defaultAllocationPercent: 20,
    color: "border-secondary bg-secondary/10",
    badgeColor: "bg-secondary/20 text-primary",
  },
  {
    key: "BALANCED",
    label: "Balanced",
    icon: TrendingUp,
    rate: 7,
    description: "Medium risk. A mix of growth and stability suited for long-term goals.",
    allocation: [
      { label: "Index Funds", percentage: 50 },
      { label: "Bonds", percentage: 30 },
      { label: "Savings Account", percentage: 20 },
    ],
    defaultAllocationPercent: 40,
    color: "border-accent bg-accent/10",
    badgeColor: "bg-accent/20 text-accent-foreground",
  },
  {
    key: "GROWTH",
    label: "Growth",
    icon: Zap,
    rate: 10,
    description: "Higher risk. Maximises long-term growth potential with equity-heavy allocation.",
    allocation: [
      { label: "Index Funds", percentage: 70 },
      { label: "Bonds", percentage: 20 },
      { label: "Savings Account", percentage: 10 },
    ],
    defaultAllocationPercent: 60,
    color: "border-amanah-sky bg-amanah-sky/10",
    badgeColor: "bg-amanah-sky/20 text-primary",
  },
]

const allocationColors = ["bg-primary", "bg-secondary", "bg-accent"]

export default function InvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getChild, setInvestment } = useApp()
  const child = getChild(id)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<PortfolioType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
          <p className="text-amanah-sage">Child not found.</p>
        </main>
      </div>
    )
  }

  const currentProfile = child.investment
    ? PROFILES.find((p) => p.key === child.investment!.portfolioType) ?? null
    : null

  async function handleSave() {
    if (!selected) return
    const profile = PROFILES.find((p) => p.key === selected)
    if (!profile) return
    setError(null)
    setSubmitting(true)
    console.log("[InvestmentPage] setInvestment childId=%s type=%s alloc=%d",
      id, profile.key, profile.defaultAllocationPercent)
    try {
      await setInvestment(child!.id, profile.key, profile.defaultAllocationPercent)
      setSelecting(false)
      setSelected(null)
    } catch (err: any) {
      console.error("[InvestmentPage] setInvestment error:", err)
      setError(err?.message ?? "Failed to save portfolio.")
    } finally {
      setSubmitting(false)
    }
  }

  const showSelector = selecting || !child.investment

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <Link
          href={`/dashboard/child/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amanah-sage hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {child.name}
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Investment Portfolio</h1>
            <p className="mt-1 text-sm text-amanah-sage">{child.name} · Simulated growth only — no real investments</p>
          </div>
          {child.investment && !selecting && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelecting(true)}>
              <Pencil className="h-4 w-4" />
              Change Profile
            </Button>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        {/* Current portfolio summary */}
        {child.investment && !selecting && (
          <Card className="mb-8 border-0 bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <Briefcase className="h-6 w-6" />
                Current Portfolio
                {currentProfile && (
                  <Badge className={cn("ml-1 text-xs font-semibold", currentProfile.badgeColor)}>
                    {currentProfile.label}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amanah-sage">Current Investment Value</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(child.investment.currentValue)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-3">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                  <span className="text-xl font-bold text-accent-foreground">
                    {child.investment.allocationPercentage}%
                  </span>
                  <span className="text-sm text-amanah-sage">allocated</span>
                </div>
              </div>

              {currentProfile && (
                <>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-amanah-plum">Asset Allocation</p>
                    <div className="flex h-4 overflow-hidden rounded-full">
                      {currentProfile.allocation.map((a, i) => (
                        <div
                          key={a.label}
                          className={cn("h-full", allocationColors[i % allocationColors.length])}
                          style={{ width: `${a.percentage}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {currentProfile.allocation.map((a, i) => (
                        <div key={a.label} className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", allocationColors[i % allocationColors.length])} />
                          <span className="text-sm text-amanah-plum">{a.label}: {a.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-amanah-sage">
                    Expected annual return: <span className="font-semibold text-primary">{currentProfile.rate}%</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile selector */}
        {showSelector && (
          <>
            <p className="mb-4 text-sm text-amanah-sage">
              {child.investment
                ? "Select a new risk profile for this portfolio."
                : `Choose a risk profile to set up a simulated investment portfolio for ${child.name}.`}
            </p>
            <div className="flex flex-col gap-4">
              {PROFILES.map((profile) => {
                const Icon = profile.icon
                const isSelected = selected === profile.key
                return (
                  <button
                    key={profile.key}
                    type="button"
                    onClick={() => setSelected(profile.key)}
                    className={cn(
                      "w-full rounded-2xl border-2 p-5 text-left transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : cn("hover:shadow-md", profile.color)
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isSelected ? "bg-primary" : "bg-card"
                      )}>
                        <Icon className={cn("h-5 w-5", isSelected ? "text-primary-foreground" : "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-base font-bold text-primary">{profile.label}</span>
                          <Badge className={cn("text-xs", profile.badgeColor)}>{profile.rate}% p.a.</Badge>
                        </div>
                        <p className="text-sm text-amanah-sage mb-3">{profile.description}</p>
                        <div className="flex h-2.5 overflow-hidden rounded-full">
                          {profile.allocation.map((a, i) => (
                            <div
                              key={a.label}
                              className={cn("h-full", allocationColors[i])}
                              style={{ width: `${a.percentage}%` }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {profile.allocation.map((a, i) => (
                            <span key={a.label} className="flex items-center gap-1.5 text-xs text-amanah-plum">
                              <span className={cn("h-2 w-2 rounded-full", allocationColors[i])} />
                              {a.label} {a.percentage}%
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex gap-3">
              {selecting && (
                <Button variant="outline" onClick={() => { setSelecting(false); setSelected(null) }}>
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={!selected || submitting}
                onClick={handleSave}
              >
                {submitting ? "Saving..." : child.investment ? "Update Portfolio" : "Set Up Portfolio"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
