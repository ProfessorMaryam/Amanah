"use client"

import Link from "next/link"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { useChildPet } from "@/lib/child-pet-context"
import { getPetStage, PET_STAGE_NAMES, PET_STAGE_THRESHOLDS, type ChildPetType } from "@/components/child-pet-sprite"
import ChildPetSprite from "@/components/child-pet-sprite"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, Target, ShoppingBag, ChevronRight, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Pet setup (first time) ─────────────────────────────────────────────────

const PET_CHOICES: { type: ChildPetType; name: string; desc: string }[] = [
  { type: "bunny",  name: "Bunny",  desc: "Fluffy & adorable!" },
  { type: "cat",    name: "Cat",    desc: "Mysterious & cool!" },
  { type: "dragon", name: "Dragon", desc: "Mighty & magical!" },
  { type: "fox",    name: "Fox",    desc: "Clever & playful!" },
  { type: "dog",    name: "Dog",    desc: "Loyal & energetic!" },
]

function PetSetupScreen({ onChoose }: { onChoose: (type: ChildPetType, name: string) => void }) {
  const [step, setStep] = useState<"choose" | "name">("choose")
  const [chosen, setChosen] = useState<ChildPetType | null>(null)
  const [name, setName] = useState("")

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step === "choose" ? (
          <div className="text-center">
            <div className="text-6xl mb-4 child-bob inline-block">🥚</div>
            <h1 className="text-3xl font-extrabold text-primary mb-2">Choose Your Pet!</h1>
            <p className="text-muted-foreground mb-8 font-medium">Your pet grows as you save. Save more = cooler pet! 🌟</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PET_CHOICES.map((p) => (
                <button
                  key={p.type}
                  onClick={() => { setChosen(p.type); setStep("name") }}
                  className="flex flex-col items-center gap-3 rounded-3xl border-2 border-transparent bg-white/80 p-5 shadow-md hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <ChildPetSprite petType={p.type} stage={2} size={80} animate={false} />
                  <div>
                    <p className="font-extrabold text-primary">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              {chosen && <ChildPetSprite petType={chosen} stage={2} size={120} />}
            </div>
            <h1 className="text-2xl font-extrabold text-primary mb-2">Name Your Pet!</h1>
            <p className="text-muted-foreground mb-6 font-medium">Give your new friend a special name ✨</p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (chosen && name.trim()) onChoose(chosen, name.trim()) }}
              className="flex flex-col gap-4 items-center"
            >
              <Input
                placeholder="e.g. Fluffy, Spark, Blaze..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg text-center font-bold max-w-xs"
                maxLength={20}
                required
                autoFocus
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("choose")}>Back</Button>
                <Button type="submit" disabled={!name.trim()} className="gap-2 font-bold text-base px-6">
                  <Sparkles className="h-4 w-4" /> Let&apos;s Go!
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 50, 200, 500, 1000, 2500, 5000, 10000]
const LEVEL_NAMES = ["Starter 🌱","Saver 🐣","Explorer 🚀","Achiever ⭐","Champion 🏆","Legend 💎","Master 👑","Grand Master 🌟"]
const LEVEL_GRADIENTS = [
  "from-slate-400 to-slate-500","from-green-400 to-emerald-500",
  "from-sky-400 to-blue-500","from-amber-400 to-yellow-500",
  "from-orange-400 to-red-500","from-violet-400 to-purple-600",
  "from-pink-400 to-rose-600","from-yellow-400 via-pink-400 to-violet-600",
]
const LEVEL_ICONS = ["🌱","🐣","🚀","⭐","🏆","💎","👑","🌟"]

function getLevel(amount: number) {
  let level = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (amount >= LEVEL_THRESHOLDS[i]) level = i
    else break
  }
  return level
}

function formatBHD(n: number) {
  return new Intl.NumberFormat("en-BH", { style: "currency", currency: "BHD", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n)
}

const GOAL_EMOJIS: Record<string, string> = {
  BICYCLE:"🚲",GAME:"🎮",TRIP:"✈️",GADGET:"📱",SPORTS:"⚽",
  BOOK:"📚",PET:"🐾",CLOTHES:"👟",CAMP:"🏕️",OTHER:"⭐",
  UNIVERSITY:"🎓",CAR:"🚗",WEDDING:"💍",BUSINESS:"💼",GENERAL:"🌟",
}

const TIPS = [
  "Saving a little every day adds up to a lot! 💰",
  "Every dinar saved today is a dream closer tomorrow! 🌈",
  "You're building your future one save at a time! 🏗️",
  "Small savings today = big adventures tomorrow! 🗺️",
  "You're a savings superhero in the making! 🦸",
]

// ── Main page ──────────────────────────────────────────────────────────────

export default function ChildViewPage() {
  const { user, personalGoals } = useApp()
  const pet = useChildPet()

  const firstName = user.name.split(" ")[0]
  const totalSaved = personalGoals.reduce((s, g) => s + g.currentAmount, 0)
  const petStage = pet.petType ? getPetStage(totalSaved) : 1

  const level = getLevel(totalSaved)
  const nextLevelThreshold = LEVEL_THRESHOLDS[level + 1]
  const levelPct = nextLevelThreshold
    ? Math.min(100, Math.round(((totalSaved - LEVEL_THRESHOLDS[level]) / (nextLevelThreshold - LEVEL_THRESHOLDS[level])) * 100))
    : 100

  const petNextThreshold = PET_STAGE_THRESHOLDS[petStage]
  const petCurrThreshold = PET_STAGE_THRESHOLDS[petStage - 1] ?? 0
  const petStagePct = petNextThreshold
    ? Math.min(100, Math.round(((totalSaved - petCurrThreshold) / (petNextThreshold - petCurrThreshold)) * 100))
    : 100

  const goalsCompleted = personalGoals.filter(g => g.currentAmount >= g.targetAmount).length
  const tip = TIPS[new Date().getDate() % TIPS.length]

  const petEmoji = pet.petType === "bunny" ? "🐰" : pet.petType === "cat" ? "🐱" : pet.petType === "dragon" ? "🐲" : pet.petType === "fox" ? "🦊" : "🐶"
  const mood = pet.happiness >= 80 ? { face: "😄", label: "Overjoyed!" }
    : pet.happiness >= 60 ? { face: "😊", label: "Happy" }
    : pet.happiness >= 40 ? { face: "😐", label: "OK" }
    : pet.happiness >= 20 ? { face: "😢", label: "Sad" }
    : { face: "😭", label: "Miserable" }

  if (!pet.mounted) return null
  if (!pet.setupDone) return <PetSetupScreen onChoose={pet.choosePet} />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 flex flex-col gap-5">

      {/* Greeting */}
      <div className="text-center">
        <div className="text-5xl mb-2 child-bob inline-block">{petEmoji}</div>
        <h1 className="text-3xl font-extrabold text-primary">Hey {firstName}!</h1>
        <p className="mt-1 text-muted-foreground font-medium">{pet.petName} is waiting for you ✨</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold opacity-80 mb-1">Total Saved</p>
            <p className="text-base font-extrabold">{formatBHD(totalSaved)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold opacity-80 mb-1">Coins</p>
            <p className="text-base font-extrabold">🪙 {pet.coins}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-pink-400 to-rose-500 text-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-bold opacity-80 mb-1">Goals</p>
            <p className="text-base font-extrabold">🎯 {personalGoals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Level card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${LEVEL_GRADIENTS[level]}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Level</p>
              <p className="text-xl font-extrabold text-primary mt-0.5">{LEVEL_NAMES[level]}</p>
            </div>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-md", LEVEL_GRADIENTS[level])}>
              {LEVEL_ICONS[level]}
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${LEVEL_GRADIENTS[level]} transition-all duration-700`} style={{ width: `${levelPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {nextLevelThreshold ? `${formatBHD(nextLevelThreshold - totalSaved)} to next level` : "✨ MAX LEVEL!"}
          </p>
        </CardContent>
      </Card>

      {/* ── Section cards ── */}

      {/* My Pet */}
      <Link href="/dashboard/child-view/pet">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden border-2 border-transparent hover:border-violet-300">
          <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <ChildPetSprite petType={pet.petType!} stage={petStage as 1|2|3|4|5} size={72} animate />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  <p className="font-extrabold text-primary">My Pet</p>
                  <span className="ml-auto text-xs font-bold text-violet-600 bg-violet-100 rounded-full px-2 py-0.5">
                    {PET_STAGE_NAMES[petStage - 1]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-amanah-plum truncate">{pet.petName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base">{mood.face}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pet.happiness}%`,
                        background: pet.happiness >= 60 ? "linear-gradient(90deg,#34d399,#10b981)"
                          : pet.happiness >= 30 ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                          : "linear-gradient(90deg,#f87171,#ef4444)",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{mood.label}</span>
                </div>
                {petNextThreshold && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">Stage</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all" style={{ width: `${petStagePct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-violet-600">{petStagePct}%</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* My Goals */}
      <Link href="/dashboard/child-view/goals">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden border-2 border-transparent hover:border-emerald-300">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <p className="font-extrabold text-primary">My Goals</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                  {goalsCompleted}/{personalGoals.length} done
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            {personalGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet — tap to create your first! 🎯</p>
            ) : (
              <div className="flex flex-col gap-2">
                {personalGoals.slice(0, 3).map((g) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
                  return (
                    <div key={g.id} className="flex items-center gap-2">
                      <span className="text-base">{GOAL_EMOJIS[g.name] ?? "🎯"}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-emerald-700 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
                {personalGoals.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{personalGoals.length - 3} more goals</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Pet Store */}
      <Link href="/dashboard/child-view/store">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden border-2 border-transparent hover:border-amber-300">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow text-2xl shrink-0">
              🛍️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <ShoppingBag className="h-4 w-4 text-amber-500" />
                <p className="font-extrabold text-primary">Pet Store</p>
              </div>
              <p className="text-sm text-muted-foreground">
                🪙 <span className="font-bold text-amber-600">{pet.coins} coins</span> · {pet.ownedItems.length} items owned
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Daily tip */}
      <Card className="border-0 bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 opacity-80 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{tip}</p>
        </CardContent>
      </Card>

    </div>
  )
}
