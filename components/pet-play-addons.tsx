"use client"

// Play area add-on components for the pet's isometric room.
// Each addon is a piece of furniture / decoration that can be placed in the
// play area. Addons unlock based on pet stage or equipped accessories.

import type { PetStage } from "@/components/child-pet-sprite"
import type { ChildPetState } from "@/lib/child-pet-store"
import { cn } from "@/lib/utils"

// ── Addon data type ────────────────────────────────────────────────────────

export interface PlayAddon {
  id: string
  label: string
  emoji: string
  gridX: number       // isometric grid position (0-9)
  gridY: number       // isometric grid position (0-7)
  color?: string      // base platform color
  size?: number       // emoji font size
  blocksWalk: boolean // whether the pet can't walk on this tile
  animates?: boolean  // whether the addon bobs up/down
  unlocksAt?: PetStage // minimum stage to show
  fromItem?: string   // item id that must be equipped/owned to show
  type?: string       // optional override, e.g. "rug" for flat decorations
}

// ── Static addons always present in the room ───────────────────────────────

const BASE_ADDONS: PlayAddon[] = [
  // Back-left corner — food bowl
  {
    id: "food-bowl",
    label: "Bowl",
    emoji: "🍖",
    gridX: 2, gridY: 2,
    color: "#fbbf24",
    size: 14,
    blocksWalk: true,
    animates: false,
  },
  // Back-right — toy chest
  {
    id: "toy-chest",
    label: "Toys",
    emoji: "🧸",
    gridX: 7, gridY: 2,
    color: "#f87171",
    size: 14,
    blocksWalk: true,
    animates: false,
  },
]

// ── Stage-unlocked addons ──────────────────────────────────────────────────

const STAGE_ADDONS: PlayAddon[] = [
  // Stage 2+: cosy plant
  {
    id: "plant",
    label: "Plant",
    emoji: "🪴",
    gridX: 8, gridY: 5,
    color: "#34d399",
    size: 16,
    blocksWalk: true,
    animates: true,
    unlocksAt: 2,
  },
  // Stage 2+: colour rug (non-blocking)
  {
    id: "rug",
    label: "",
    emoji: "🟣",
    type: "rug",
    gridX: 5, gridY: 4,
    size: 10,
    blocksWalk: false,
    animates: false,
    unlocksAt: 2,
  },
  // Stage 3+: fountain
  {
    id: "fountain",
    label: "Fountain",
    emoji: "⛲",
    gridX: 2, gridY: 5,
    color: "#7dd3fc",
    size: 18,
    blocksWalk: true,
    animates: true,
    unlocksAt: 3,
  },
  // Stage 3+: star lamp
  {
    id: "star-lamp",
    label: "Star Lamp",
    emoji: "⭐",
    gridX: 8, gridY: 3,
    color: "#fde68a",
    size: 16,
    blocksWalk: true,
    animates: true,
    unlocksAt: 3,
  },
  // Stage 4+: castle tower
  {
    id: "castle",
    label: "Castle",
    emoji: "🏰",
    gridX: 1, gridY: 3,
    color: "#c4b5fd",
    size: 20,
    blocksWalk: true,
    animates: false,
    unlocksAt: 4,
  },
  // Stage 4+: magic crystal
  {
    id: "crystal",
    label: "Crystal",
    emoji: "🔮",
    gridX: 7, gridY: 6,
    color: "#a855f7",
    size: 16,
    blocksWalk: true,
    animates: true,
    unlocksAt: 4,
  },
  // Stage 5: rainbow
  {
    id: "rainbow",
    label: "Rainbow",
    emoji: "🌈",
    gridX: 4, gridY: 2,
    color: "#f0abfc",
    size: 22,
    blocksWalk: true,
    animates: false,
    unlocksAt: 5,
  },
  // Stage 5: unicorn friend
  {
    id: "unicorn",
    label: "Unicorn",
    emoji: "🦄",
    gridX: 7, gridY: 4,
    color: "#fce7f3",
    size: 18,
    blocksWalk: true,
    animates: true,
    unlocksAt: 5,
  },
]

// ── Store-item-linked addons ───────────────────────────────────────────────

const ITEM_ADDONS: PlayAddon[] = [
  // Owning the "guitar" toy → music stand appears
  {
    id: "music-stand",
    label: "Music",
    emoji: "🎸",
    gridX: 1, gridY: 5,
    color: "#fb923c",
    size: 14,
    blocksWalk: true,
    animates: false,
    fromItem: "guitar",
  },
  // Owning the "kite" → kite pole in yard
  {
    id: "kite-pole",
    label: "Kite!",
    emoji: "🪁",
    gridX: 8, gridY: 2,
    color: "#60a5fa",
    size: 16,
    blocksWalk: true,
    animates: true,
    fromItem: "kite",
  },
  // Owning the "book" → bookshelf
  {
    id: "bookshelf",
    label: "Books",
    emoji: "📚",
    gridX: 1, gridY: 2,
    color: "#2dd4bf",
    size: 14,
    blocksWalk: true,
    animates: false,
    fromItem: "book",
  },
  // Owning the "ball" → ball pit
  {
    id: "ball-pit",
    label: "Ball Pit",
    emoji: "🏐",
    gridX: 5, gridY: 6,
    color: "#fb7185",
    size: 16,
    blocksWalk: true,
    animates: true,
    fromItem: "ball",
  },
]

// ── Helper: compute active addons for a given pet state ────────────────────

export function getActiveAddons(stage: PetStage, petState: Pick<ChildPetState, "ownedItems">): PlayAddon[] {
  const active: PlayAddon[] = [...BASE_ADDONS]

  for (const a of STAGE_ADDONS) {
    if (!a.unlocksAt || stage >= a.unlocksAt) active.push(a)
  }

  for (const a of ITEM_ADDONS) {
    if (a.fromItem && petState.ownedItems.includes(a.fromItem)) active.push(a)
  }

  return active
}

// ── UI component: addon unlock card (shown in a grid on the room/pet page) ──

interface AddonCardProps {
  addon: PlayAddon
  unlocked: boolean
  requiresStage?: PetStage
  requiresItem?: string
}

export function AddonCard({ addon, unlocked, requiresStage, requiresItem }: AddonCardProps) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all duration-200",
      unlocked
        ? "border-violet-300 bg-violet-50 shadow-sm"
        : "border-dashed border-muted bg-muted/30 opacity-60"
    )}>
      <span className={cn("text-2xl", !unlocked && "grayscale")}>{addon.emoji}</span>
      <p className={cn("text-xs font-bold leading-tight", unlocked ? "text-violet-700" : "text-muted-foreground")}>
        {addon.label || "Decoration"}
      </p>
      {!unlocked && (
        <p className="text-xs text-muted-foreground leading-tight">
          {requiresStage ? `Stage ${requiresStage}+` : requiresItem ? `Own the ${requiresItem}` : "Locked"}
        </p>
      )}
      {unlocked && <span className="text-xs text-violet-500 font-semibold">✓ In room</span>}
    </div>
  )
}

// ── UI component: full addon gallery panel ─────────────────────────────────

interface AddonGalleryProps {
  stage: PetStage
  ownedItems: string[]
  className?: string
}

export function AddonGallery({ stage, ownedItems, className }: AddonGalleryProps) {
  const petState = { ownedItems }

  const allAddons = [
    ...BASE_ADDONS,
    ...STAGE_ADDONS,
    ...ITEM_ADDONS,
  ]

  // Deduplicate
  const seen = new Set<string>()
  const unique = allAddons.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className="text-base">🏠</span>
        <p className="text-sm font-extrabold text-primary">Room Add-ons</p>
        <span className="ml-auto text-xs text-muted-foreground">
          {getActiveAddons(stage, petState).length} / {unique.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {unique.map(addon => {
          const unlocked = getActiveAddons(stage, petState).some(a => a.id === addon.id)
          return (
            <AddonCard
              key={addon.id}
              addon={addon}
              unlocked={unlocked}
              requiresStage={addon.unlocksAt}
              requiresItem={addon.fromItem}
            />
          )
        })}
      </div>
    </div>
  )
}
