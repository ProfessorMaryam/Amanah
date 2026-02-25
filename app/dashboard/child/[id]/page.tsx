"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"
import { GoalOverview } from "@/components/child-detail/goal-overview"
import { SavingsChart } from "@/components/child-detail/savings-chart"
import { ContributionHistory } from "@/components/child-detail/contribution-history"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { ArrowLeft, Plus, X, Calendar, Pencil, Trash2, PauseCircle, PlayCircle } from "lucide-react"

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
  const router = useRouter()
  const { getChild, addContribution, updateChild, deleteChild, togglePausedGoal } = useApp()
  const [showContributeForm, setShowContributeForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDob, setEditDob] = useState("")
  const [editGoalName, setEditGoalName] = useState("")
  const [editTargetAmount, setEditTargetAmount] = useState("")
  const [editTargetDate, setEditTargetDate] = useState("")

  const child = getChild(id)

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
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

  const isPaused = child.goal.paused ?? false

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

  function openEdit() {
    setEditName(child!.name)
    setEditDob(child!.dateOfBirth)
    setEditGoalName(child!.goal.name)
    setEditTargetAmount(String(child!.goal.targetAmount))
    setEditTargetDate(child!.goal.targetDate)
    setShowEditDialog(true)
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    updateChild(child!.id, {
      name: editName,
      dateOfBirth: editDob,
      goal: {
        name: editGoalName,
        targetAmount: parseFloat(editTargetAmount),
        targetDate: editTargetDate,
      },
    })
    setShowEditDialog(false)
  }

  function handleDelete() {
    deleteChild(child!.id)
    router.push("/dashboard")
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amanah-sage hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Child header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-primary lg:text-4xl">
                  {child.name}
                </h1>
                {isPaused && (
                  <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                    Paused
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-amanah-sage">
                <Calendar className="h-4 w-4" />
                <span>Born {formatDate(child.dateOfBirth)}</span>
                <span className="text-amanah-plum font-medium">
                  ({getAge(child.dateOfBirth)} years old)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-amanah-sage hover:text-primary"
                onClick={openEdit}
                aria-label="Edit child"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-amanah-sage hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                aria-label="Delete child"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 font-medium"
                onClick={() => togglePausedGoal(child.id)}
              >
                {isPaused ? (
                  <><PlayCircle className="h-4 w-4" />Resume</>
                ) : (
                  <><PauseCircle className="h-4 w-4" />Pause</>
                )}
              </Button>
              <Button
                onClick={() => setShowContributeForm(!showContributeForm)}
                className="h-9 gap-1.5 font-semibold"
              >
                {showContributeForm ? (
                  <><X className="h-4 w-4" />Cancel</>
                ) : (
                  <><Plus className="h-4 w-4" />Add Contribution</>
                )}
              </Button>
            </div>
          </div>

          {/* Paused banner */}
          {isPaused && (
            <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
              <p className="text-sm font-medium text-yellow-800">
                Automatic contributions are currently paused. Click <strong>Resume</strong> to continue saving.
              </p>
            </div>
          )}

          {/* Quick contribute form */}
          {showContributeForm && (
            <Card className="mb-8 border-0 bg-amanah-peach/30 shadow-md">
              <CardContent className="p-6">
                <form onSubmit={handleContribute} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="contribute-amount" className="text-sm font-medium text-amanah-plum">
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
                      className="h-11 text-base bg-card"
                      required
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="contribute-note" className="text-sm font-medium text-amanah-plum">
                      Note (optional)
                    </Label>
                    <Input
                      id="contribute-note"
                      type="text"
                      placeholder="e.g., Monthly savings"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-11 text-base bg-card"
                    />
                  </div>
                  <Button type="submit" className="h-11 px-8 text-base font-semibold">
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
          </div>
        </main>
      </div>

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
              <Label className="text-sm font-medium text-amanah-plum">Goal Name</Label>
              <Input value={editGoalName} onChange={(e) => setEditGoalName(e.target.value)} className="bg-amanah-cream" required />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">Target (MYR)</Label>
                <Input type="number" min="100" value={editTargetAmount} onChange={(e) => setEditTargetAmount(e.target.value)} className="bg-amanah-cream" required />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-sm font-medium text-amanah-plum">Target Date</Label>
                <Input type="date" value={editTargetDate} onChange={(e) => setEditTargetDate(e.target.value)} className="bg-amanah-cream" required />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
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
