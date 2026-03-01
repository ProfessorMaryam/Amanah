"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Plus, X, Pencil, Trash2, PauseCircle, PlayCircle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { Child, GoalType } from "@/lib/types"
import { cn } from "@/lib/utils"

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  UNIVERSITY: "University Fund",
  CAR: "Car Fund",
  WEDDING: "Wedding Fund",
  BUSINESS: "Business Fund",
  GENERAL: "General Savings",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: "BHD",
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
  const { addContribution, updateChild, deleteChild, togglePausedGoal, setGoal } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(child.name)
  const [editDob, setEditDob] = useState(child.dateOfBirth)
  const [editGoalType, setEditGoalType] = useState<GoalType>(child.goal.goalType)
  const [editTargetAmount, setEditTargetAmount] = useState(String(child.goal.targetAmount))
  const [editTargetDate, setEditTargetDate] = useState(child.goal.targetDate)

  const percentage = Math.min(
    100,
    Math.round((child.goal.currentAmount / child.goal.targetAmount) * 100)
  )
  const monthsLeft = getMonthsRemaining(child.goal.targetDate)
  const isPaused = child.goal.isPaused ?? false

  const accentColor =
    percentage >= 75
      ? "border-l-accent"
      : percentage >= 40
      ? "border-l-yellow-400"
      : "border-l-amanah-peach"

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (num <= 0) return
    setSubmitting(true)
    console.log("[ChildCard] addContribution childId=%s amount=%d", child.id, num)
    try {
      await addContribution(child.id, num)
      setAmount("")
      setShowForm(false)
    } catch (err) {
      console.error("[ChildCard] addContribution error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    console.log("[ChildCard] handleEdit childId=%s name=%s goalType=%s", child.id, editName, editGoalType)
    try {
      await updateChild(child.id, { name: editName, dateOfBirth: editDob })
      await setGoal(child.id, {
        goalType: editGoalType,
        targetAmount: parseFloat(editTargetAmount),
        targetDate: editTargetDate,
        isPaused: child.goal.isPaused,
      })
      setShowEditDialog(false)
    } catch (err) {
      console.error("[ChildCard] handleEdit error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit() {
    setEditName(child.name)
    setEditDob(child.dateOfBirth)
    setEditGoalType(child.goal.goalType)
    setEditTargetAmount(String(child.goal.targetAmount))
    setEditTargetDate(child.goal.targetDate)
    setShowEditDialog(true)
  }

  async function handleDelete() {
    console.log("[ChildCard] deleteChild id=%s", child.id)
    try {
      await deleteChild(child.id)
    } catch (err) {
      console.error("[ChildCard] deleteChild error:", err)
    }
  }

  async function handleTogglePause() {
    console.log("[ChildCard] togglePausedGoal id=%s", child.id)
    try {
      await togglePausedGoal(child.id)
    } catch (err) {
      console.error("[ChildCard] togglePausedGoal error:", err)
    }
  }

  return (
    <>
      <Card
        className={cn(
          "border-0 border-l-4 bg-card shadow-lg transition-shadow duration-200 hover:shadow-xl",
          accentColor
        )}
      >
        <CardContent className="flex flex-col gap-4 p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-primary truncate">{child.name}</h3>
                {isPaused && (
                  <Badge variant="outline" className="shrink-0 border-yellow-400 text-yellow-600 text-xs">
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-sm text-amanah-sage truncate">{GOAL_TYPE_LABELS[child.goal.goalType]}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amanah-sage hover:text-primary"
                onClick={openEdit}
                aria-label="Edit child"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amanah-sage hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                aria-label="Delete child"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Amounts */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-amanah-sage">Saved</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(child.goal.currentAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-amanah-sage">Target</p>
              <p className="text-base font-semibold text-amanah-plum">{formatCurrency(child.goal.targetAmount)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <Progress value={percentage} className="h-3 rounded-full bg-amanah-peach [&>div]:bg-accent [&>div]:rounded-full" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-accent-foreground">{percentage}% complete</span>
              <span className="text-sm font-medium text-amanah-sage">{monthsLeft} months left</span>
            </div>
          </div>

          {/* Quick contribute form */}
          {showForm && (
            <form onSubmit={handleContribute} className="flex flex-col gap-3 rounded-xl bg-amanah-cream p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`amount-${child.id}`} className="text-sm font-medium text-amanah-plum">
                  Contribution Amount (BHD)
                </Label>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-1 text-amanah-sage hover:text-primary transition-colors"
                  aria-label="Close form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  id={`amount-${child.id}`}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 flex-1 bg-card text-sm"
                  required
                />
                <Button type="submit" disabled={submitting} className="h-10 px-4 text-sm font-semibold">
                  {submitting ? "..." : "Add"}
                </Button>
              </div>
            </form>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Link href={`/dashboard/child/${child.id}`} className="flex-1">
              <Button
                variant="outline"
                className="h-10 w-full gap-1.5 border-border text-sm font-semibold text-primary hover:bg-amanah-cream"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 shrink-0",
                isPaused ? "text-yellow-600 hover:bg-yellow-50" : "text-amanah-sage hover:text-primary"
              )}
              onClick={handleTogglePause}
              aria-label={isPaused ? "Resume contributions" : "Pause contributions"}
            >
              {isPaused ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
            </Button>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="h-10 flex-1 gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80"
              >
                <Plus className="h-4 w-4" />
                Contribute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit {child.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-amanah-plum">Child Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-amanah-cream" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-amanah-plum">Date of Birth</Label>
              <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="bg-amanah-cream" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-amanah-plum">Goal Type</Label>
              <Select value={editGoalType} onValueChange={(v) => setEditGoalType(v as GoalType)}>
                <SelectTrigger className="bg-amanah-cream">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((key) => (
                    <SelectItem key={key} value={key}>{GOAL_TYPE_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">Target Amount (BHD)</Label>
                <Input type="number" min="100" value={editTargetAmount} onChange={(e) => setEditTargetAmount(e.target.value)} className="bg-amanah-cream" required />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">Target Date</Label>
                <Input type="date" value={editTargetDate} onChange={(e) => setEditTargetDate(e.target.value)} className="bg-amanah-cream" required />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">Delete {child.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {child.name}&apos;s profile and all savings history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
