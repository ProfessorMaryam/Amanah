"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Coins, Target, Sparkles } from "lucide-react"
import type { PersonalGoal } from "@/lib/app-context"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount)
}

const GOAL_PRESETS: { type: string; label: string; emoji: string }[] = [
  { type: "BICYCLE",  label: "Bicycle",     emoji: "🚲" },
  { type: "GAME",     label: "Game",        emoji: "🎮" },
  { type: "TRIP",     label: "Trip",        emoji: "✈️" },
  { type: "GADGET",   label: "Gadget",      emoji: "📱" },
  { type: "SPORTS",   label: "Sports",      emoji: "⚽" },
  { type: "BOOK",     label: "Books",       emoji: "📚" },
  { type: "PET",      label: "Pet",         emoji: "🐾" },
  { type: "CLOTHES",  label: "Clothes",     emoji: "👟" },
  { type: "CAMP",     label: "Camp",        emoji: "🏕️" },
  { type: "OTHER",    label: "Other",       emoji: "⭐" },
  // parent-type goals also visible for completeness
  { type: "UNIVERSITY", label: "University", emoji: "🎓" },
  { type: "CAR",       label: "Car",         emoji: "🚗" },
  { type: "WEDDING",   label: "Wedding",     emoji: "💍" },
  { type: "BUSINESS",  label: "Business",    emoji: "💼" },
  { type: "GENERAL",   label: "General",     emoji: "🌟" },
]

function presetFor(type: string) {
  return GOAL_PRESETS.find((p) => p.type === type) ?? { label: type, emoji: "🎯" }
}

const LEVEL_THRESHOLDS = [0, 50, 200, 500, 1000, 2500, 5000, 10000]
const LEVEL_NAMES = ["Starter 🌱", "Saver 🐣", "Explorer 🚀", "Achiever ⭐", "Champion 🏆", "Legend 💎", "Master 👑", "Grand Master 🌟"]

function getLevel(amount: number) {
  let level = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (amount >= LEVEL_THRESHOLDS[i]) level = i
    else break
  }
  return level
}

const TIPS = [
  "Saving a little every day adds up to a lot! 💰",
  "Every dinar saved today is a dream closer tomorrow! 🌈",
  "You're building your future one save at a time! 🏗️",
  "Small savings today = big adventures tomorrow! 🗺️",
  "You're a savings superhero in the making! 🦸",
  "The best time to save was yesterday. The next best time is now! ⏰",
]

// ── Goal Card ──────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onContribute,
  onDelete,
}: {
  goal: PersonalGoal
  onContribute: (goalId: string, amount: number) => void
  onDelete: (goalId: string) => void
}) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState("")
  const [showDelete, setShowDelete] = useState(false)

  const pct = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const preset = presetFor(goal.name)
  const done = pct >= 100

  function handleContribute(e: { preventDefault(): void }) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (num > 0) {
      onContribute(goal.id, num)
      setAmount("")
      setShowContribute(false)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-md overflow-hidden">
        <div className={`h-1.5 w-full ${done ? "bg-green-400" : "bg-primary"}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{preset.emoji}</span>
              <div>
                <p className="text-base font-bold text-primary leading-tight">{preset.label}</p>
                <p className="text-xs text-amanah-sage mt-0.5">
                  Goal: {formatCurrency(goal.targetAmount)}
                  {goal.targetDate && ` · Due ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amanah-sage hover:text-destructive shrink-0"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-1 flex justify-between text-xs font-semibold text-amanah-sage">
            <span>{formatCurrency(goal.currentAmount)} saved</span>
            <span className={done ? "text-green-600" : "text-primary"}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-3 rounded-full mb-3" />

          {done ? (
            <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-center text-sm font-bold text-green-700">
              🎉 Goal reached! Amazing work!
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-amanah-sage">
                {formatCurrency(remaining)} left · {goal.monthsRemaining} months to go
              </p>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
                onClick={() => setShowContribute(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}

          {goal.transactions.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {goal.transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex justify-between rounded-lg bg-amanah-cream px-3 py-1.5 text-xs">
                  <span className="text-amanah-plum">
                    {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="font-semibold text-primary">+{formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent className="bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary">{preset.emoji} Save to &ldquo;{preset.label}&rdquo;</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContribute} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-amanah-plum">Amount (BHD)</Label>
              <Input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 text-base bg-amanah-cream"
                required
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowContribute(false)}>Cancel</Button>
              <Button type="submit">Add Savings 💰</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{preset.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the goal and all its savings history. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(goal.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ChildViewPage() {
  const { user, personalGoals, createPersonalGoal, contributeToPersonalGoal, deletePersonalGoal } = useApp()

  const [showCreate, setShowCreate] = useState(false)
  const [selectedType, setSelectedType] = useState(GOAL_PRESETS[0].type)
  const [newTarget, setNewTarget] = useState("")
  const [newDate, setNewDate] = useState("")
  const [creating, setCreating] = useState(false)

  const firstName = user.name.split(" ")[0]
  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)
  const level = getLevel(totalSaved)
  const levelName = LEVEL_NAMES[level]
  const nextThreshold = LEVEL_THRESHOLDS[level + 1]
  const tip = TIPS[new Date().getDate() % TIPS.length]

  const levelPct = nextThreshold
    ? Math.min(100, Math.round(((totalSaved - LEVEL_THRESHOLDS[level]) / (nextThreshold - LEVEL_THRESHOLDS[level])) * 100))
    : 100

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    const amount = parseFloat(newTarget)
    if (!selectedType || amount <= 0 || !newDate) return
    setCreating(true)
    await createPersonalGoal(selectedType, amount, newDate)
    setCreating(false)
    setSelectedType(GOAL_PRESETS[0].type)
    setNewTarget("")
    setNewDate("")
    setShowCreate(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amanah-cream via-amanah-peach/20 to-white">
      <main className="mx-auto max-w-xl px-4 py-8 lg:px-8">

        {/* Hero */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">✨</div>
          <h1 className="text-3xl font-extrabold text-primary">Hey {firstName}!</h1>
          <p className="mt-1 text-base text-amanah-sage font-medium">Your savings adventure awaits</p>
        </div>

        {/* Level card */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amanah-sage">Your Level</p>
                <p className="text-xl font-extrabold text-primary mt-0.5">{levelName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-amanah-sage">Total Saved</p>
                <p className="text-2xl font-extrabold text-primary mt-0.5">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
            <Progress value={levelPct} className="h-2.5 rounded-full" />
            {nextThreshold && (
              <p className="mt-1.5 text-xs text-amanah-sage text-right">
                {formatCurrency(nextThreshold - totalSaved)} to next level
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goals section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
            <Target className="h-5 w-5" /> My Goals
          </h2>
          <Button size="sm" className="h-9 gap-1.5 font-semibold" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>

        {personalGoals.length === 0 ? (
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="text-5xl">🐣</div>
              <p className="text-lg font-extrabold text-primary">No goals yet!</p>
              <p className="text-sm text-amanah-sage text-center max-w-xs">
                Create your first savings goal and start your adventure. What are you saving for?
              </p>
              <Button className="gap-2 font-semibold" onClick={() => setShowCreate(true)}>
                <Sparkles className="h-4 w-4" />
                Create my first goal!
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6 flex flex-col gap-4">
            {personalGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onContribute={contributeToPersonalGoal}
                onDelete={deletePersonalGoal}
              />
            ))}
          </div>
        )}

        {/* Daily tip */}
        <Card className="border-0 bg-primary shadow-md">
          <CardContent className="p-4 flex items-start gap-3">
            <Coins className="h-5 w-5 text-primary-foreground/80 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-primary-foreground">{tip}</p>
          </CardContent>
        </Card>
      </main>

      {/* Create goal dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary">🎯 Create a New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-amanah-plum">What are you saving for?</Label>
              <div className="grid grid-cols-5 gap-2">
                {GOAL_PRESETS.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => setSelectedType(p.type)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-semibold transition-all ${
                      selectedType === p.type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-amanah-cream text-amanah-plum hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="leading-tight text-center">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">Target (BHD)</Label>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="0.000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="h-11 bg-amanah-cream"
                  required
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">By when?</Label>
                <Input
                  type="date"
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-11 bg-amanah-cream"
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Let's Go! 🚀"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
