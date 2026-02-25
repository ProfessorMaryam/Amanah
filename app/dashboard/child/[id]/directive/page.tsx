"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Shield, User, Phone, FileText, AlertTriangle, Pencil } from "lucide-react"

export default function DirectivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getChild, setFutureInstructions } = useApp()
  const child = getChild(id)

  const existing = child?.futureInstructions
  const [editing, setEditing] = useState(!existing)
  const [guardianName, setGuardianName] = useState(existing?.guardianName ?? "")
  const [guardianContact, setGuardianContact] = useState(existing?.guardianContact ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
          <p className="text-amanah-sage">Child not found.</p>
        </main>
      </div>
    )
  }

  function openEdit() {
    setGuardianName(child!.futureInstructions?.guardianName ?? "")
    setGuardianContact(child!.futureInstructions?.guardianContact ?? "")
    setNotes(child!.futureInstructions?.notes ?? "")
    setEditing(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFutureInstructions(child!.id, {
      guardianName,
      guardianContact,
      notes,
    })
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        {/* Back */}
        <Link
          href={`/dashboard/child/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amanah-sage hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {child.name}
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Fund Directive</h1>
            <p className="mt-1 text-sm text-amanah-sage">{child.name} · Guardian & fund management instructions</p>
          </div>
          {existing && !editing && (
            <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amanah-rose/30 bg-amanah-rose/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amanah-rose" />
          <p className="text-sm leading-relaxed text-amanah-plum">
            <strong>Informational only.</strong> This directive is not a legal will or binding document. Please consult a qualified legal professional for formal estate planning.
          </p>
        </div>

        {/* View mode */}
        {existing && !editing && (
          <Card className="border-0 bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <Shield className="h-6 w-6" />
                Directive on File
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
                  <User className="h-5 w-5 shrink-0 text-amanah-sage" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amanah-sage">Guardian / Executor</p>
                    <p className="text-base font-semibold text-primary truncate">{existing.guardianName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
                  <Phone className="h-5 w-5 shrink-0 text-amanah-sage" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amanah-sage">Contact</p>
                    <p className="text-base font-semibold text-primary truncate">{existing.guardianContact}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-amanah-cream p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amanah-sage" />
                  <p className="text-xs font-medium text-amanah-sage">Written Instructions</p>
                </div>
                <p className="text-sm leading-relaxed text-amanah-plum">{existing.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit / Create form */}
        {editing && (
          <Card className="border-0 bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <Shield className="h-6 w-6" />
                {existing ? "Edit Directive" : "Set Up Directive"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-amanah-plum">
                      Guardian / Executor Name
                    </Label>
                    <Input
                      placeholder="Full name"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="bg-amanah-cream"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-amanah-plum">
                      Contact Number
                    </Label>
                    <Input
                      placeholder="+60 12-345-6789"
                      value={guardianContact}
                      onChange={(e) => setGuardianContact(e.target.value)}
                      className="bg-amanah-cream"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-amanah-plum">
                    Written Instructions
                  </Label>
                  <Textarea
                    placeholder="Describe how the fund should be managed, what it should be used for, and any wishes you have for your child's future..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-36 bg-amanah-cream text-sm leading-relaxed"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  {existing && (
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1">
                    {existing ? "Save Changes" : "Save Directive"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Empty state (no directive, not editing — shouldn't normally show) */}
        {!existing && !editing && (
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Shield className="h-12 w-12 text-amanah-sage" />
              <p className="text-center text-base text-amanah-sage">
                No directive set up yet for {child.name}.
              </p>
              <Button onClick={() => setEditing(true)}>Set Up Directive</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
