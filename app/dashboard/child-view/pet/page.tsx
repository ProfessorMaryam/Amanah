"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { useChildPet } from "@/lib/child-pet-context"
import ChildPetSprite, {
  PetEnvironment,
  getPetStage,
  PET_STAGE_NAMES,
  PET_STAGE_THRESHOLDS,
} from "@/components/child-pet-sprite"
import { STORE_ITEMS } from "@/lib/child-pet-store"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

function formatBHD(n: number) {
  return new Intl.NumberFormat("en-BH", { style: "currency", currency: "BHD", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n)
}

function happinessMood(h: number) {
  if (h >= 80) return { face: "😄", label: "Overjoyed!", color: "text-green-600 bg-green-100" }
  if (h >= 60) return { face: "😊", label: "Happy",     color: "text-emerald-600 bg-emerald-100" }
  if (h >= 40) return { face: "😐", label: "OK",        color: "text-yellow-700 bg-yellow-100" }
  if (h >= 20) return { face: "😢", label: "Sad",       color: "text-orange-600 bg-orange-100" }
  return              { face: "😭", label: "Miserable", color: "text-red-600 bg-red-100" }
}

function happinessBarColor(h: number) {
  if (h >= 60) return "from-green-400 to-emerald-500"
  if (h >= 30) return "from-amber-400 to-yellow-500"
  return "from-red-400 to-rose-500"
}

function ActionButton({ icon, label, sublabel, disabled, color, onClick }: {
  icon: string; label: string; sublabel: string; disabled: boolean; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl p-4 shadow-md transition-all duration-150 active:scale-95",
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
          : `bg-gradient-to-br ${color} text-white hover:shadow-lg hover:-translate-y-0.5`
      )}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-extrabold">{label}</span>
      <span className="text-xs opacity-80">{sublabel}</span>
    </button>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState("")
  const [visible, setVisible] = useState(false)
  let timer: ReturnType<typeof setTimeout>
  function show(m: string) {
    setMsg(m); setVisible(true)
    clearTimeout(timer)
    timer = setTimeout(() => setVisible(false), 2500)
  }
  return { msg, visible, show }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PetPage() {
  const { personalGoals } = useApp()
  const pet = useChildPet()
  const toast = useToast()
  const [petAnim, setPetAnim] = useState(false)

  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)
  const petStage = pet.petType ? getPetStage(totalSaved) : 1
  const mood = happinessMood(pet.happiness)
  const stageName = PET_STAGE_NAMES[petStage - 1] ?? "Egg"
  const nextThreshold = PET_STAGE_THRESHOLDS[petStage]

  const equippedHat    = pet.equipped.hat    ? STORE_ITEMS.find(i => i.id === pet.equipped.hat)?.emoji    ?? "" : ""
  const equippedOutfit = pet.equipped.outfit ? STORE_ITEMS.find(i => i.id === pet.equipped.outfit)?.emoji ?? "" : ""
  const equippedToy    = pet.equipped.toy    ? STORE_ITEMS.find(i => i.id === pet.equipped.toy)?.emoji    ?? "" : ""

  function triggerAction(fn: () => boolean, successMsg: string, cooldownMsg: string) {
    if (fn()) {
      toast.show(successMsg)
      setPetAnim(true)
      setTimeout(() => setPetAnim(false), 800)
    } else {
      toast.show(cooldownMsg)
    }
  }

  if (!pet.mounted || !pet.petType) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 flex flex-col gap-5">

      {/* Back */}
      <Link href="/dashboard/child-view" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
        ⭐ My Pet
      </h1>

      {/* Environment */}
      <PetEnvironment stage={petStage as 1|2|3|4|5}>
        <div className="flex flex-col items-center gap-2">
          {equippedHat && <span className="text-2xl -mb-2 z-10">{equippedHat}</span>}
          <div
            className={cn("relative", petAnim && "child-bounce")}
            onClick={() => triggerAction(pet.petThePet, `${pet.petName} loved your touch! 💕`, "Wait a bit before petting again!")}
          >
            <ChildPetSprite petType={pet.petType} stage={petStage as 1|2|3|4|5} size={150} />
            {equippedOutfit && <span className="absolute bottom-4 right-0 text-2xl">{equippedOutfit}</span>}
            {equippedToy    && <span className="absolute bottom-0 left-0  text-2xl">{equippedToy}</span>}
          </div>
          <p className="font-extrabold text-primary text-xl">{pet.petName}</p>
          <span className={cn("text-xs font-bold px-3 py-1 rounded-full", mood.color)}>
            {mood.face} {mood.label}
          </span>
        </div>
      </PetEnvironment>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Happiness</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{mood.face}</span>
              <span className="text-2xl font-extrabold text-primary">{pet.happiness}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", happinessBarColor(pet.happiness))}
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Stage</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{petStage === 1 ? "🥚" : petStage === 2 ? "🐣" : petStage === 3 ? "🌿" : petStage === 4 ? "⚡" : "🌟"}</span>
              <span className="text-base font-extrabold text-primary">{stageName}</span>
            </div>
            {nextThreshold
              ? <p className="text-xs text-muted-foreground">Save {formatBHD(nextThreshold)} total to evolve!</p>
              : <p className="text-xs font-bold text-amber-600">✨ Max stage reached!</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          icon="🍖" label="Feed"
          sublabel={pet.cooldowns.feed > 0 ? "Cooling down" : "Ready!"}
          disabled={pet.cooldowns.feed > 0}
          color="from-amber-400 to-orange-400"
          onClick={() => triggerAction(pet.feedPet, `${pet.petName} is munching! 🍽️`, "Too full right now!")}
        />
        <ActionButton
          icon="🎾" label="Play"
          sublabel={pet.cooldowns.play > 0 ? "Cooling down" : "Ready!"}
          disabled={pet.cooldowns.play > 0}
          color="from-green-400 to-emerald-400"
          onClick={() => triggerAction(pet.playWithPet, `${pet.petName} is having a blast! 🎉`, "Needs a rest first!")}
        />
        <ActionButton
          icon="💕" label="Pet"
          sublabel={pet.cooldowns.pet > 0 ? "Cooling down" : "Ready!"}
          disabled={pet.cooldowns.pet > 0}
          color="from-pink-400 to-rose-400"
          onClick={() => triggerAction(pet.petThePet, `${pet.petName} purrs with joy! 💕`, "A little patience!")}
        />
      </div>

      {/* Evolution Journey */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400" />
        <CardContent className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Evolution Journey</p>
          <div className="flex items-start justify-between gap-1">
            {PET_STAGE_NAMES.map((name, i) => {
              const s = i + 1
              const threshold = PET_STAGE_THRESHOLDS[i]
              const isUnlocked = petStage >= s
              const isCurrent = petStage === s
              const stageIcon = s === 1 ? "🥚" : s === 2 ? "🐣" : s === 3 ? "🌿" : s === 4 ? "⚡" : "🌟"
              return (
                <div key={name} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-xl border-2 transition-all",
                    isCurrent  ? "border-violet-500 bg-violet-100 shadow-md scale-110"
                    : isUnlocked ? "border-violet-300 bg-violet-50"
                    : "border-muted bg-muted/50 opacity-40"
                  )}>
                    {isUnlocked ? stageIcon : "🔒"}
                  </div>
                  <p className={cn("text-xs font-bold text-center leading-tight", isUnlocked ? "text-violet-700" : "text-muted-foreground")}>
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">{formatBHD(threshold)}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Toast */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-primary text-primary-foreground px-5 py-3 shadow-xl text-sm font-bold transition-all duration-300",
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {toast.msg}
      </div>

    </div>
  )
}
