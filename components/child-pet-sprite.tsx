"use client"

// SVG pet sprites for the Amanah child view
// 5 pet types × 5 growth stages (Egg → Baby → Young → Teen → Legendary)
// Growth is tied to total BHD saved across all personal goals.

export type ChildPetType = "bunny" | "cat" | "dragon" | "fox" | "dog"

export type PetStage = 1 | 2 | 3 | 4 | 5

export const PET_STAGE_THRESHOLDS = [0, 5, 20, 60, 150] // BHD amounts

export const PET_STAGE_NAMES = ["Egg", "Baby", "Young", "Teen", "Legendary"]

export function getPetStage(totalSaved: number): PetStage {
  let stage: PetStage = 1
  for (let i = 0; i < PET_STAGE_THRESHOLDS.length; i++) {
    if (totalSaved >= PET_STAGE_THRESHOLDS[i]) stage = (i + 1) as PetStage
    else break
  }
  return stage
}

const PET_COLORS: Record<ChildPetType, { body: string; accent: string; eye: string; cheek: string }> = {
  bunny: { body: "#F5F0FF", accent: "#D8B4FE", eye: "#7C3AED", cheek: "#F9A8D4" },
  cat:   { body: "#FEF3C7", accent: "#FCD34D", eye: "#92400E", cheek: "#FCA5A5" },
  dragon:{ body: "#D1FAE5", accent: "#34D399", eye: "#065F46", cheek: "#6EE7B7" },
  fox:   { body: "#FEE2E2", accent: "#F87171", eye: "#991B1B", cheek: "#FCA5A5" },
  dog:   { body: "#FEF9C3", accent: "#FBBF24", eye: "#78350F", cheek: "#FCA5A5" },
}

// ── Egg ─────────────────────────────────────────────────────────────────────

function EggSprite({ c, size }: { c: typeof PET_COLORS.bunny; size: number }) {
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-label="Pet egg">
      <defs>
        <radialGradient id="eg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="100%" stopColor={c.accent} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="65" rx="36" ry="46" fill="url(#eg)" stroke={c.accent} strokeWidth="2.5" />
      {/* Crack */}
      <path d="M32 52 L40 44 L36 54 L46 46" fill="none" stroke={c.eye} strokeWidth="1.8" strokeLinecap="round" />
      {/* Spots */}
      <circle cx="62" cy="52" r="4" fill={c.body} opacity="0.6" />
      <circle cx="42" cy="76" r="3" fill={c.accent} opacity="0.5" />
      <circle cx="58" cy="82" r="5" fill={c.accent} opacity="0.4" />
      {/* Sleepy eyes */}
      <path d="M38 62 Q42 59 46 62" fill="none" stroke={c.eye} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 62 Q58 59 62 62" fill="none" stroke={c.eye} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Baby ─────────────────────────────────────────────────────────────────────

function BabySprite({ type, c, size }: { type: ChildPetType; c: typeof PET_COLORS.bunny; size: number }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-label="Baby pet">
      {/* Body */}
      <ellipse cx="50" cy="70" rx="24" ry="22" fill={c.body} />
      {/* Head */}
      <circle cx="50" cy="42" r="24" fill={c.body} />
      {/* Ears */}
      {type === "bunny" && <>
        <ellipse cx="34" cy="18" rx="6" ry="16" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <ellipse cx="66" cy="18" rx="6" ry="16" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <ellipse cx="34" cy="16" rx="3" ry="12" fill={c.cheek} opacity="0.5" />
        <ellipse cx="66" cy="16" rx="3" ry="12" fill={c.cheek} opacity="0.5" />
      </>}
      {type === "cat" && <>
        <polygon points="32,20 26,6 40,14" fill={c.body} stroke={c.accent} strokeWidth="1.2" />
        <polygon points="68,20 74,6 60,14" fill={c.body} stroke={c.accent} strokeWidth="1.2" />
      </>}
      {type === "dragon" && <>
        <polygon points="30,22 22,4 40,16" fill={c.accent} />
        <polygon points="70,22 78,4 60,16" fill={c.accent} />
        <circle cx="50" cy="20" r="4" fill="#FCD34D" />
      </>}
      {type === "fox" && <>
        <polygon points="32,18 24,2 42,14" fill={c.body} />
        <polygon points="68,18 76,2 58,14" fill={c.body} />
        <polygon points="32,18 27,6 38,14" fill="white" />
        <polygon points="68,18 73,6 62,14" fill="white" />
      </>}
      {type === "dog" && <>
        <ellipse cx="30" cy="22" rx="9" ry="13" fill={c.accent} transform="rotate(-15 30 22)" />
        <ellipse cx="70" cy="22" rx="9" ry="13" fill={c.accent} transform="rotate(15 70 22)" />
      </>}
      {/* Eyes */}
      <circle cx="40" cy="39" r="7" fill="white" />
      <circle cx="60" cy="39" r="7" fill="white" />
      <circle cx="41" cy="40" r="4" fill={c.eye} />
      <circle cx="61" cy="40" r="4" fill={c.eye} />
      <circle cx="42.5" cy="38" r="1.8" fill="white" />
      <circle cx="62.5" cy="38" r="1.8" fill="white" />
      {/* Cheeks */}
      <circle cx="32" cy="46" r="5" fill={c.cheek} opacity="0.55" />
      <circle cx="68" cy="46" r="5" fill={c.cheek} opacity="0.55" />
      {/* Nose & mouth */}
      <ellipse cx="50" cy="48" rx="2.5" ry="2" fill={c.accent} />
      <path d="M45 52 Q50 56 55 52" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="40" cy="89" rx="8" ry="5" fill={c.accent} />
      <ellipse cx="60" cy="89" rx="8" ry="5" fill={c.accent} />
    </svg>
  )
}

// ── Young ─────────────────────────────────────────────────────────────────────

function YoungSprite({ type, c, size }: { type: ChildPetType; c: typeof PET_COLORS.bunny; size: number }) {
  return (
    <svg viewBox="0 0 120 135" width={size} height={size * 1.125} aria-label="Young pet">
      {/* Body */}
      <ellipse cx="60" cy="92" rx="30" ry="28" fill={c.body} />
      {/* Head */}
      <circle cx="60" cy="50" r="28" fill={c.body} />
      {/* Ears */}
      {type === "bunny" && <>
        <ellipse cx="42" cy="20" rx="8" ry="24" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <ellipse cx="78" cy="20" rx="8" ry="24" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <ellipse cx="42" cy="18" rx="4" ry="19" fill={c.cheek} opacity="0.4" />
        <ellipse cx="78" cy="18" rx="4" ry="19" fill={c.cheek} opacity="0.4" />
        <circle cx="88" cy="105" r="7" fill="white" />
      </>}
      {type === "cat" && <>
        <polygon points="38,22 30,2 50,16" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <polygon points="82,22 90,2 70,16" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
        <line x1="34" y1="55" x2="12" y2="52" stroke={c.accent} strokeWidth="1.2" />
        <line x1="34" y1="58" x2="12" y2="61" stroke={c.accent} strokeWidth="1.2" />
        <line x1="86" y1="55" x2="108" y2="52" stroke={c.accent} strokeWidth="1.2" />
        <line x1="86" y1="58" x2="108" y2="61" stroke={c.accent} strokeWidth="1.2" />
      </>}
      {type === "dragon" && <>
        <polygon points="36,26 24,2 50,18" fill={c.accent} />
        <polygon points="84,26 96,2 70,18" fill={c.accent} />
        <ellipse cx="30" cy="88" rx="16" ry="11" fill={c.accent} opacity="0.7" transform="rotate(-20 30 88)" />
        <ellipse cx="90" cy="88" rx="16" ry="11" fill={c.accent} opacity="0.7" transform="rotate(20 90 88)" />
      </>}
      {type === "fox" && <>
        <polygon points="38,24 28,0 52,16" fill={c.body} />
        <polygon points="82,24 92,0 68,16" fill={c.body} />
        <polygon points="38,24 32,8 48,18" fill="white" />
        <polygon points="82,24 88,8 72,18" fill="white" />
        <path d="M90 100 Q112 80 108 62" fill="none" stroke={c.body} strokeWidth="9" strokeLinecap="round" />
        <circle cx="108" cy="62" r="5" fill="white" />
      </>}
      {type === "dog" && <>
        <ellipse cx="36" cy="28" rx="11" ry="17" fill={c.accent} transform="rotate(-22 36 28)" />
        <ellipse cx="84" cy="28" rx="11" ry="17" fill={c.accent} transform="rotate(22 84 28)" />
      </>}
      {/* Eyes */}
      <circle cx="48" cy="47" r="8" fill="white" />
      <circle cx="72" cy="47" r="8" fill="white" />
      <circle cx="50" cy="48" r="5" fill={c.eye} />
      <circle cx="74" cy="48" r="5" fill={c.eye} />
      <circle cx="51.5" cy="46" r="2" fill="white" />
      <circle cx="75.5" cy="46" r="2" fill="white" />
      {/* Cheeks */}
      <circle cx="36" cy="58" r="6" fill={c.cheek} opacity="0.45" />
      <circle cx="84" cy="58" r="6" fill={c.cheek} opacity="0.45" />
      {/* Nose & mouth */}
      <ellipse cx="60" cy="57" rx="3.5" ry="2.5" fill={c.accent} />
      <path d="M53 62 Q60 67 67 62" fill="none" stroke={c.accent} strokeWidth="1.8" strokeLinecap="round" />
      {/* Arms */}
      <ellipse cx="30" cy="90" rx="7" ry="9" fill={c.body} transform="rotate(-15 30 90)" />
      <ellipse cx="90" cy="90" rx="7" ry="9" fill={c.body} transform="rotate(15 90 90)" />
      {/* Feet */}
      <ellipse cx="44" cy="118" rx="11" ry="6" fill={c.accent} />
      <ellipse cx="76" cy="118" rx="11" ry="6" fill={c.accent} />
    </svg>
  )
}

// ── Teen ─────────────────────────────────────────────────────────────────────

function TeenSprite({ type, c, size }: { type: ChildPetType; c: typeof PET_COLORS.bunny; size: number }) {
  return (
    <svg viewBox="0 0 140 155" width={size} height={size * 1.107} aria-label="Teen pet">
      {/* Body */}
      <ellipse cx="70" cy="108" rx="34" ry="32" fill={c.body} />
      {/* Head */}
      <circle cx="70" cy="55" r="30" fill={c.body} />
      {/* Ears */}
      {type === "bunny" && <>
        <ellipse cx="50" cy="20" rx="10" ry="30" fill={c.body} stroke={c.accent} strokeWidth="2" />
        <ellipse cx="90" cy="20" rx="10" ry="30" fill={c.body} stroke={c.accent} strokeWidth="2" />
        <ellipse cx="50" cy="18" rx="5" ry="24" fill={c.cheek} opacity="0.4" />
        <ellipse cx="90" cy="18" rx="5" ry="24" fill={c.cheek} opacity="0.4" />
        <circle cx="102" cy="120" r="9" fill="white" />
        {/* Bow */}
        <path d="M60,62 Q70,55 80,62" fill={c.accent} opacity="0.7" />
      </>}
      {type === "cat" && <>
        <polygon points="46,28 36,2 62,20" fill={c.body} stroke={c.accent} strokeWidth="1.8" />
        <polygon points="94,28 104,2 78,20" fill={c.body} stroke={c.accent} strokeWidth="1.8" />
        <line x1="40" y1="60" x2="14" y2="57" stroke={c.accent} strokeWidth="1.4" />
        <line x1="40" y1="63" x2="14" y2="66" stroke={c.accent} strokeWidth="1.4" />
        <line x1="100" y1="60" x2="126" y2="57" stroke={c.accent} strokeWidth="1.4" />
        <line x1="100" y1="63" x2="126" y2="66" stroke={c.accent} strokeWidth="1.4" />
        <path d="M102 118 Q126 105 130 82 Q133 66 122 58" fill="none" stroke={c.body} strokeWidth="7" strokeLinecap="round" />
      </>}
      {type === "dragon" && <>
        <polygon points="44,30 28,0 62,22" fill={c.accent} />
        <polygon points="96,30 112,0 78,22" fill={c.accent} />
        <path d="M36 95 Q8 62 18 40 L36 72" fill={c.accent} opacity="0.8" />
        <path d="M104 95 Q132 62 122 40 L104 72" fill={c.accent} opacity="0.8" />
        <ellipse cx="70" cy="110" rx="20" ry="18" fill="#D1FAE5" />
        <path d="M104 122 Q120 112 116 98" fill="none" stroke={c.accent} strokeWidth="6" strokeLinecap="round" />
      </>}
      {type === "fox" && <>
        <polygon points="46,26 32,0 62,18" fill={c.body} />
        <polygon points="94,26 108,0 78,18" fill={c.body} />
        <polygon points="46,26 38,8 57,20" fill="white" />
        <polygon points="94,26 102,8 83,20" fill="white" />
        <ellipse cx="70" cy="96" rx="18" ry="16" fill="white" />
        <path d="M102 118 Q128 98 124 74 Q122 60 112 55" fill={c.body} />
        <circle cx="112" cy="55" r="7" fill="white" />
      </>}
      {type === "dog" && <>
        <ellipse cx="42" cy="32" rx="14" ry="20" fill={c.accent} transform="rotate(-25 42 32)" />
        <ellipse cx="98" cy="32" rx="14" ry="20" fill={c.accent} transform="rotate(25 98 32)" />
        {/* Collar */}
        <rect x="52" y="76" width="36" height="7" rx="3.5" fill="#EF4444" />
        <circle cx="70" cy="83" r="4.5" fill="#FCD34D" />
      </>}
      {/* Eyes */}
      <circle cx="56" cy="52" r="9" fill="white" />
      <circle cx="84" cy="52" r="9" fill="white" />
      <circle cx="58" cy="53" r="5.5" fill={c.eye} />
      <circle cx="86" cy="53" r="5.5" fill={c.eye} />
      <circle cx="59.5" cy="51" r="2.2" fill="white" />
      <circle cx="87.5" cy="51" r="2.2" fill="white" />
      {/* Cheeks */}
      <circle cx="40" cy="64" r="7" fill={c.cheek} opacity="0.45" />
      <circle cx="100" cy="64" r="7" fill={c.cheek} opacity="0.45" />
      {/* Nose & mouth */}
      <ellipse cx="70" cy="63" rx="4" ry="3" fill={c.accent} />
      <path d="M62 69 Q70 76 78 69" fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="52" cy="136" rx="13" ry="7" fill={c.accent} />
      <ellipse cx="88" cy="136" rx="13" ry="7" fill={c.accent} />
    </svg>
  )
}

// ── Legendary ─────────────────────────────────────────────────────────────────

function LegendarySprite({ type, c, size }: { type: ChildPetType; c: typeof PET_COLORS.bunny; size: number }) {
  return (
    <svg viewBox="0 0 160 175" width={size} height={size * 1.094} aria-label="Legendary pet">
      <defs>
        <radialGradient id="aura-g">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
        </radialGradient>
        <filter id="glow-f">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Aura */}
      <circle cx="80" cy="90" r="78" fill="url(#aura-g)" />
      {/* Body */}
      <ellipse cx="80" cy="118" rx="38" ry="35" fill={c.body} filter="url(#glow-f)" />
      {/* Head */}
      <circle cx="80" cy="60" r="33" fill={c.body} />
      {/* Crown / star */}
      <polygon points="80,28 83,38 93,38 86,44 89,54 80,48 71,54 74,44 67,38 77,38" fill="#FCD34D" filter="url(#glow-f)" />
      {/* Ears */}
      {type === "bunny" && <>
        <ellipse cx="58" cy="18" rx="12" ry="34" fill={c.body} stroke="#FCD34D" strokeWidth="1.5" />
        <ellipse cx="102" cy="18" rx="12" ry="34" fill={c.body} stroke="#FCD34D" strokeWidth="1.5" />
        <ellipse cx="58" cy="16" rx="6" ry="28" fill={c.cheek} opacity="0.4" />
        <ellipse cx="102" cy="16" rx="6" ry="28" fill={c.cheek} opacity="0.4" />
        <circle cx="114" cy="136" r="11" fill="white" filter="url(#glow-f)" />
        {/* Stars on ear tips */}
        <circle cx="58" cy="-8" r="4" fill="#FCD34D" />
        <circle cx="102" cy="-8" r="4" fill="#FCD34D" />
      </>}
      {type === "cat" && <>
        <polygon points="54,32 40,2 72,24" fill={c.body} stroke="#FCD34D" strokeWidth="1.8" />
        <polygon points="106,32 120,2 88,24" fill={c.body} stroke="#FCD34D" strokeWidth="1.8" />
        <path d="M114 128 Q138 112 142 84 Q145 66 132 58" fill="none" stroke={c.body} strokeWidth="8" strokeLinecap="round" />
        <line x1="40" y1="63" x2="14" y2="60" stroke="#FCD34D" strokeWidth="1.3" opacity="0.7" />
        <line x1="120" y1="63" x2="146" y2="60" stroke="#FCD34D" strokeWidth="1.3" opacity="0.7" />
      </>}
      {type === "dragon" && <>
        <polygon points="54,34 36,0 70,24" fill="#FCD34D" />
        <polygon points="106,34 124,0 90,24" fill="#FCD34D" />
        <path d="M42 104 Q4 56 14 28 Q20 18 30 24 L42 80" fill={c.accent} opacity="0.9" />
        <path d="M118 104 Q156 56 146 28 Q140 18 130 24 L118 80" fill={c.accent} opacity="0.9" />
        <ellipse cx="80" cy="122" rx="22" ry="20" fill="#D1FAE5" />
        <path d="M112 132 Q134 120 138 104 Q142 90 132 84 Q126 100 116 112" fill={c.accent} />
      </>}
      {type === "fox" && <>
        <polygon points="54,30 38,0 70,22" fill={c.body} />
        <polygon points="106,30 122,0 90,22" fill={c.body} />
        <polygon points="54,30 44,10 65,24" fill="white" />
        <polygon points="106,30 116,10 95,24" fill="white" />
        <ellipse cx="80" cy="108" rx="20" ry="18" fill="white" />
        <path d="M110 130 Q142 106 140 76 Q138 58 126 52" fill={c.body} />
        <circle cx="126" cy="52" r="8" fill="white" />
        <circle cx="142" cy="76" r="2.5" fill="#FCD34D" />
        <circle cx="130" cy="58" r="2" fill="#FCD34D" />
      </>}
      {type === "dog" && <>
        <ellipse cx="50" cy="34" rx="15" ry="22" fill={c.accent} transform="rotate(-25 50 34)" />
        <ellipse cx="110" cy="34" rx="15" ry="22" fill={c.accent} transform="rotate(25 110 34)" />
        <rect x="60" y="84" width="40" height="8" rx="4" fill="#EF4444" />
        <circle cx="80" cy="92" r="5" fill="#FCD34D" filter="url(#glow-f)" />
        {/* Cape */}
        <path d="M48 98 Q38 140 54 158 L80 148 L106 158 Q122 140 112 98" fill="#3B82F6" opacity="0.7" />
      </>}
      {/* Eyes */}
      <circle cx="66" cy="57" r="10" fill="white" />
      <circle cx="94" cy="57" r="10" fill="white" />
      <circle cx="68" cy="58" r="6" fill={c.eye} />
      <circle cx="96" cy="58" r="6" fill={c.eye} />
      <circle cx="70" cy="55.5" r="2.5" fill="white" />
      <circle cx="98" cy="55.5" r="2.5" fill="white" />
      <circle cx="65" cy="52" r="1.5" fill="#FCD34D" />
      <circle cx="97" cy="52" r="1.5" fill="#FCD34D" />
      {/* Cheeks */}
      <circle cx="44" cy="70" r="8" fill={c.cheek} opacity="0.5" />
      <circle cx="116" cy="70" r="8" fill={c.cheek} opacity="0.5" />
      {/* Nose & mouth */}
      <ellipse cx="80" cy="68" rx="4.5" ry="3.5" fill={c.accent} />
      <path d="M70 75 Q80 83 90 75" fill="none" stroke={c.accent} strokeWidth="2.2" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="60" cy="150" rx="14" ry="8" fill={c.accent} />
      <ellipse cx="100" cy="150" rx="14" ry="8" fill={c.accent} />
      {/* Sparkle particles */}
      <circle cx="38" cy="42" r="2.5" fill="#FCD34D" opacity="0.8" />
      <circle cx="122" cy="38" r="2" fill="#FCD34D" opacity="0.6" />
      <circle cx="28" cy="98" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="132" cy="102" r="2.5" fill="#FCD34D" opacity="0.6" />
    </svg>
  )
}

// ── Environment ───────────────────────────────────────────────────────────────

const ENV_CONFIGS: Record<PetStage, { bg: string; floor: string; label: string }> = {
  1: { bg: "from-slate-100 to-slate-200", floor: "bg-slate-200", label: "Tiny Nest" },
  2: { bg: "from-violet-100 to-pink-100", floor: "bg-pink-100", label: "Cozy Room" },
  3: { bg: "from-sky-100 to-emerald-100", floor: "bg-emerald-100", label: "Garden" },
  4: { bg: "from-amber-100 to-orange-100", floor: "bg-orange-100", label: "Adventure Land" },
  5: { bg: "from-purple-200 via-pink-100 to-yellow-100", floor: "bg-gradient-to-r from-purple-100 to-yellow-100", label: "Magical Kingdom" },
}

const ENV_ELEMENTS: Record<PetStage, React.ReactNode> = {
  1: <>
    <div className="absolute bottom-2 left-4 text-xl opacity-50">🪹</div>
    <div className="absolute top-3 right-4 text-base opacity-40">⭐</div>
  </>,
  2: <>
    <div className="absolute bottom-2 left-3 text-xl">🪴</div>
    <div className="absolute bottom-2 right-4 text-xl">🧸</div>
    <div className="absolute top-3 right-5 text-base">🖼️</div>
    <div className="absolute top-4 left-8 text-sm">🌟</div>
  </>,
  3: <>
    <div className="absolute bottom-2 left-2 text-2xl">🌳</div>
    <div className="absolute bottom-2 right-3 text-xl">🌻</div>
    <div className="absolute top-3 left-6 text-lg">☁️</div>
    <div className="absolute top-3 right-10 text-base opacity-70">☁️</div>
    <div className="absolute bottom-6 right-10 text-sm child-float">🦋</div>
    <div className="absolute top-8 left-16 text-xs child-float" style={{ animationDelay: "1s" }}>🌸</div>
  </>,
  4: <>
    <div className="absolute bottom-2 left-2 text-2xl">🌳</div>
    <div className="absolute bottom-2 left-12 text-xl">🌻</div>
    <div className="absolute bottom-2 right-2 text-2xl">🌲</div>
    <div className="absolute bottom-3 right-12 text-lg">⛲</div>
    <div className="absolute top-2 left-5 text-lg">☁️</div>
    <div className="absolute top-3 right-7 text-base opacity-60">🌤️</div>
    <div className="absolute bottom-10 left-20 text-sm child-float">🦋</div>
    <div className="absolute top-8 right-20 text-sm child-float" style={{ animationDelay: "1.5s" }}>🐦</div>
    <div className="absolute top-5 left-1/3 text-xs child-sparkle">✨</div>
  </>,
  5: <>
    <div className="absolute bottom-2 left-1 text-2xl">🌳</div>
    <div className="absolute bottom-2 right-1 text-2xl">🏰</div>
    <div className="absolute bottom-2 left-12 text-xl">🌈</div>
    <div className="absolute top-2 left-4 text-base">⭐</div>
    <div className="absolute top-2 right-5 text-base">🌙</div>
    <div className="absolute top-6 left-1/3 text-sm child-sparkle">✨</div>
    <div className="absolute bottom-12 right-14 text-sm child-float">🦄</div>
    <div className="absolute top-10 right-1/3 text-xs child-sparkle" style={{ animationDelay: "1s" }}>✨</div>
    <div className="absolute bottom-8 left-8 text-xs child-float" style={{ animationDelay: "0.5s" }}>🌟</div>
  </>,
}

export function PetEnvironment({ stage, children }: { stage: PetStage; children: React.ReactNode }) {
  const cfg = ENV_CONFIGS[stage]
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-b ${cfg.bg} border-2 border-border shadow-inner`}>
      <div className="relative min-h-[260px] flex items-center justify-center p-6">
        {ENV_ELEMENTS[stage]}
        <div className="relative z-10">{children}</div>
      </div>
      <div className={`h-10 ${cfg.floor} border-t border-border/30 flex items-center justify-center`}>
        <span className="text-xs font-semibold text-muted-foreground">{cfg.label}</span>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface ChildPetSpriteProps {
  petType: ChildPetType
  stage: PetStage
  size?: number
  animate?: boolean
  onClick?: () => void
}

export default function ChildPetSprite({ petType, stage, size = 140, animate = true, onClick }: ChildPetSpriteProps) {
  const c = PET_COLORS[petType]
  return (
    <div
      className={`relative cursor-pointer select-none flex items-center justify-center ${animate ? "child-bob" : ""}`}
      style={{ width: size, height: size * 1.15 }}
      onClick={onClick}
    >
      {stage === 1 && <EggSprite c={c} size={size * 0.7} />}
      {stage === 2 && <BabySprite type={petType} c={c} size={size * 0.75} />}
      {stage === 3 && <YoungSprite type={petType} c={c} size={size * 0.85} />}
      {stage === 4 && <TeenSprite type={petType} c={c} size={size * 0.95} />}
      {stage === 5 && <LegendarySprite type={petType} c={c} size={size} />}
    </div>
  )
}
