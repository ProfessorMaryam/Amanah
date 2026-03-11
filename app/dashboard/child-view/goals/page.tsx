"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import type { PersonalGoal } from "@/lib/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Coins, Target, Sparkles, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

function formatBHD(n: number) {
  return new Intl.NumberFormat("en-BH", { style: "currency", currency: "BHD", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n)
}

const GOAL_PRESETS: { type: string; label: string; emoji: string }[] = [
  { type: "BICYCLE",    label: "Bicycle",    emoji: "🚲" },
  { type: "GAME",       label: "Game",       emoji: "🎮" },
  { type: "TRIP",       label: "Trip",       emoji: "✈️" },
  { type: "GADGET",     label: "Gadget",     emoji: "📱" },
  { type: "SPORTS",     label: "Sports",     emoji: "⚽" },
  { type: "BOOK",       label: "Books",      emoji: "📚" },
  { type: "PET",        label: "Pet",        emoji: "🐾" },
  { type: "CLOTHES",    label: "Clothes",    emoji: "👟" },
  { type: "CAMP",       label: "Camp",       emoji: "🏕️" },
  { type: "OTHER",      label: "Other",      emoji: "⭐" },
  { type: "UNIVERSITY", label: "University", emoji: "🎓" },
  { type: "CAR",        label: "Car",        emoji: "🚗" },
  { type: "GENERAL",    label: "General",    emoji: "🌟" },
]

function presetFor(type: string) {
  return GOAL_PRESETS.find(p => p.type === type) ?? { label: type, emoji: "🎯" }
}

const GOAL_GRADIENTS: Record<string, string> = {
  BICYCLE: "from-sky-400 to-blue-500",
  GAME:    "from-violet-400 to-purple-500",
  TRIP:    "from-amber-400 to-orange-500",
  GADGET:  "from-pink-400 to-rose-500",
  SPORTS:  "from-green-400 to-emerald-500",
  BOOK:    "from-teal-400 to-cyan-500",
  PET:     "from-pink-300 to-pink-500",
  CLOTHES: "from-indigo-400 to-violet-500",
}

// ── Goal Card ──────────────────────────────────────────────────────────────

function GoalCard({ goal, onContribute, onDelete }: {
  goal: PersonalGoal
  onContribute: (id: string, amount: number) => void
  onDelete: (id: string) => void
}) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState("")
  const [showDelete, setShowDelete] = useState(false)

  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const preset = presetFor(goal.name)
  const done = pct >= 100
  const grad = GOAL_GRADIENTS[goal.name] ?? "from-primary to-secondary"

  return (
    <>
      <Card className="border-0 shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-200">
        <div className={`h-2 w-full bg-gradient-to-r ${done ? "from-green-400 to-emerald-500" : grad}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} shadow-md text-2xl`}>
                {preset.emoji}
              </div>
              <div>
                <p className="text-base font-extrabold text-primary">{preset.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Goal: {formatBHD(goal.targetAmount)}
                  {goal.targetDate && ` · ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-1 flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">{formatBHD(goal.currentAmount)} saved</span>
            <span className={done ? "text-green-600" : "text-primary"}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${done ? "from-green-400 to-emerald-500" : grad} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {done ? (
            <div className="rounded-2xl bg-green-50 border-2 border-green-200 px-4 py-3 text-center">
              <p className="text-lg">🎉</p>
              <p className="text-sm font-extrabold text-green-700">Goal Reached! Amazing!</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{formatBHD(remaining)} left</p>
                <p className="text-xs text-muted-foreground">{goal.monthsRemaining} months to go</p>
              </div>
              <Button
                size="sm"
                className={cn("h-9 gap-1.5 text-xs font-bold rounded-xl text-white border-0 shadow-md bg-gradient-to-r", grad)}
                onClick={() => setShowContribute(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Save!
              </Button>
            </div>
          )}

          {goal.transactions.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {goal.transactions.slice(0, 2).map((tx) => (
                <div key={tx.id} className="flex justify-between rounded-xl bg-muted/50 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="font-bold text-primary">+{formatBHD(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent className="bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">{preset.emoji} Save to &ldquo;{preset.label}&rdquo;</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const n = parseFloat(amount); if (n > 0) { onContribute(goal.id, n); setAmount(""); setShowContribute(false) } }} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-amanah-plum">Amount (BHD)</Label>
              <Input type="number" min="0.001" step="0.001" placeholder="0.000" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 text-lg bg-muted font-bold" required autoFocus />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["0.500","1.000","2.000","5.000"].map(v => (
                <button key={v} type="button" onClick={() => setAmount(v)} className="rounded-xl border-2 border-primary/20 bg-primary/5 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                  {v} BD
                </button>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowContribute(false)}>Cancel</Button>
              <Button type="submit" className="gap-1.5 font-bold"><Coins className="h-4 w-4" /> Save! 💰</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{preset.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the goal and all its savings history. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(goal.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { personalGoals, createPersonalGoal, contributeToPersonalGoal, deletePersonalGoal } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedType, setSelectedType] = useState(GOAL_PRESETS[0].type)
  const [newTarget, setNewTarget] = useState("")
  const [newDate, setNewDate] = useState("")
  const [creating, setCreating] = useState(false)

  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)
  const goalsCompleted = personalGoals.filter(g => g.currentAmount >= g.targetAmount).length

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
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 flex flex-col gap-5">

      {/* Back */}
      <Link href="/dashboard/child-view" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-500" /> My Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goalsCompleted}/{personalGoals.length} completed · {formatBHD(totalSaved)} saved total
          </p>
        </div>
        <Button
          className="h-10 gap-1.5 font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 shadow-md hover:shadow-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {/* Goals list */}
      {personalGoals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="text-6xl child-bob inline-block">🐣</div>
            <p className="text-xl font-extrabold text-primary">No goals yet!</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">Create your first savings goal and start your adventure. What are you dreaming of?</p>
            <Button className="gap-2 font-bold rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 shadow-md" onClick={() => setShowCreate(true)}>
              <Sparkles className="h-4 w-4" /> Create my first goal!
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {personalGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onContribute={contributeToPersonalGoal} onDelete={deletePersonalGoal} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-background sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2"><Target className="h-5 w-5" /> Create a New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-bold text-amanah-plum">What are you saving for?</Label>
              <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                {GOAL_PRESETS.map(p => (
                  <button key={p.type} type="button" onClick={() => setSelectedType(p.type)}
                    className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-xs font-bold transition-all",
                      selectedType === p.type ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-amanah-plum hover:border-primary/40"
                    )}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="leading-tight text-center">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-bold text-amanah-plum">Target (BHD)</Label>
                <Input type="number" min="0.001" step="0.001" placeholder="0.000" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="h-11 bg-muted font-bold" required />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-bold text-amanah-plum">By when?</Label>
                <Input type="date" min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} value={newDate} onChange={e => setNewDate(e.target.value)} className="h-11 bg-muted" required />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="gap-1.5 font-bold">
                {creating ? "Creating..." : <><Sparkles className="h-4 w-4" /> Let&apos;s Go! 🚀</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
