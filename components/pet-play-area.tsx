"use client"

// Isometric play area for the child's virtual pet.
// Full-size 20×16 grid, 54×27 tiles — same scale as Pixel Plaza game.
// All furniture drawn with canvas primitives (no emoji).

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChildPetType, PetStage } from "@/components/child-pet-sprite"
import type { PlayAddon } from "@/components/pet-play-addons"

// ── Isometric math ──────────────────────────────────────────────────────────

type IsoParams = { tileW: number; tileH: number; ox: number; oy: number }

function projectIso(tx: number, ty: number, p: IsoParams) {
  const hw = p.tileW / 2, hh = p.tileH / 2
  return { px: (tx - ty) * hw + p.ox, py: (tx + ty) * hh + p.oy }
}

function unprojectIso(px: number, py: number, p: IsoParams) {
  const hw = p.tileW / 2, hh = p.tileH / 2
  const dx = px - p.ox, dy = py - p.oy
  return {
    tx: Math.floor((dy / hh + dx / hw) / 2),
    ty: Math.floor((dy / hh - dx / hw) / 2),
  }
}

function centeredOrigin(w: number, h: number, cols: number, rows: number, tileW: number, tileH: number) {
  const hw = tileW / 2, hh = tileH / 2
  const corners = [
    { px: 0, py: 0 },
    { px: (cols - 1) * hw, py: (cols - 1) * hh },
    { px: -(rows - 1) * hw, py: (rows - 1) * hh },
    { px: ((cols - 1) - (rows - 1)) * hw, py: ((cols - 1) + (rows - 1)) * hh },
  ]
  const minX = Math.min(...corners.map(c => c.px - hw))
  const maxX = Math.max(...corners.map(c => c.px + hw))
  const minY = Math.min(...corners.map(c => c.py))
  const maxY = Math.max(...corners.map(c => c.py + tileH))
  return {
    ox: Math.round(w / 2 - (minX + maxX) / 2),
    oy: Math.round(h / 2 - (minY + maxY) / 2) - 6,
  }
}

// ── A* pathfinding ──────────────────────────────────────────────────────────

type Node = { x: number; y: number }

function aStar(start: Node, goal: Node, cols: number, rows: number, walkable: (x: number, y: number) => boolean): Node[] {
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows
  const key = (x: number, y: number) => `${x},${y}`
  if (!inBounds(start.x, start.y) || !inBounds(goal.x, goal.y) || !walkable(goal.x, goal.y)) return [start]

  const open = new Set<string>([key(start.x, start.y)])
  const from = new Map<string, string>()
  const gScore = new Map<string, number>([[key(start.x, start.y), 0]])
  const fScore = new Map<string, number>([[key(start.x, start.y), Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y)]])

  while (open.size) {
    let cur = ""; let best = Infinity
    for (const k of open) { const f = fScore.get(k) ?? Infinity; if (f < best) { best = f; cur = k } }
    const [cx, cy] = cur.split(",").map(Number)
    if (cx === goal.x && cy === goal.y) {
      const path: Node[] = []
      let k: string | undefined = cur
      while (k) { const [x, y] = k.split(",").map(Number); path.push({ x, y }); k = from.get(k) }
      return path.reverse()
    }
    open.delete(cur)
    for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]] as [number,number][]) {
      if (!inBounds(nx, ny) || !walkable(nx, ny)) continue
      const nk = key(nx, ny)
      const g = (gScore.get(cur) ?? Infinity) + 1
      if (g < (gScore.get(nk) ?? Infinity)) {
        from.set(nk, cur); gScore.set(nk, g)
        fScore.set(nk, g + Math.abs(nx - goal.x) + Math.abs(ny - goal.y))
        if (!open.has(nk)) open.add(nk)
      }
    }
  }
  return [start]
}

// ── Grid ────────────────────────────────────────────────────────────────────

const COLS = 20
const ROWS = 16

function buildGrid(addons: PlayAddon[]): boolean[] {
  const grid = new Array(COLS * ROWS).fill(true)
  const block = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < COLS && y < ROWS) grid[y * COLS + x] = false
  }
  for (let x = 0; x < COLS; x++) { block(x, 0); block(x, ROWS - 1) }
  for (let y = 0; y < ROWS; y++) { block(0, y); block(COLS - 1, y) }
  for (const a of addons) { if (a.blocksWalk) block(a.gridX, a.gridY) }
  return grid
}

// ── Canvas draw helpers (same primitives as the game) ──────────────────────

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h))
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = false) {
  ctx.fillStyle = fill
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill()
  if (stroke) { ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke() }
}

function shade(hex: string, pct: number) {
  const f = parseInt(hex.slice(1), 16)
  const t = pct < 0 ? 0 : 255; const p = Math.abs(pct) / 100
  const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff
  return "#" + (0x1000000 + (Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B)).toString(16).slice(1)
}

// ── Tile drawing ────────────────────────────────────────────────────────────

function drawTile(ctx: CanvasRenderingContext2D, px: number, py: number, tileW: number, tileH: number, fill: string, stroke: string) {
  const hw = tileW / 2, hh = tileH / 2
  ctx.beginPath()
  ctx.moveTo(Math.round(px) + 0.5,      Math.round(py) + 0.5)
  ctx.lineTo(Math.round(px + hw) + 0.5, Math.round(py + hh) + 0.5)
  ctx.lineTo(Math.round(px) + 0.5,      Math.round(py + tileH) + 0.5)
  ctx.lineTo(Math.round(px - hw) + 0.5, Math.round(py + hh) + 0.5)
  ctx.closePath()
  ctx.fillStyle = fill; ctx.fill()
  ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(Math.round(px) + 0.5,      Math.round(py) + 0.5)
  ctx.lineTo(Math.round(px - hw) + 0.5, Math.round(py + hh) + 0.5)
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke()
}

function drawRaisedBlock(ctx: CanvasRenderingContext2D, px: number, py: number, tileW: number, tileH: number, top: string, outline: string, side: string) {
  drawTile(ctx, px, py - 8, tileW, tileH, top, outline)
  const hw = tileW / 2, hh = tileH / 2
  ctx.fillStyle = side; ctx.strokeStyle = outline
  ctx.beginPath()
  ctx.moveTo(px, py + tileH - 8); ctx.lineTo(px + hw, py + hh - 8)
  ctx.lineTo(px + hw, py + hh);   ctx.lineTo(px, py + tileH); ctx.closePath()
  ctx.fill(); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(px, py + tileH - 8); ctx.lineTo(px - hw, py + hh - 8)
  ctx.lineTo(px - hw, py + hh);   ctx.lineTo(px, py + tileH); ctx.closePath()
  ctx.fillStyle = shade(side, -15); ctx.fill(); ctx.stroke()
}

// ── Wall drawing ────────────────────────────────────────────────────────────

const WALL_TOP  = "#e8dfd0"
const WALL_SIDE = "#c9b99a"

function drawWalls(ctx: CanvasRenderingContext2D, params: IsoParams, tileW: number, tileH: number) {
  for (let x = 1; x < COLS - 1; x++) {
    const { px, py } = projectIso(x, 1, params)
    drawRaisedBlock(ctx, px, py, tileW, tileH, WALL_TOP, "#000", WALL_SIDE)
  }
  for (let y = 2; y < ROWS - 1; y++) {
    const { px, py } = projectIso(1, y, params)
    drawRaisedBlock(ctx, px, py, tileW, tileH, WALL_TOP, "#000", WALL_SIDE)
  }
}

// ── Background ──────────────────────────────────────────────────────────────

const SKY_COLORS: Record<PetStage, [string, string]> = {
  1: ["#e8ecf0", "#c8d4de"],
  2: ["#f0ebff", "#d8ccf5"],
  3: ["#e8f8f0", "#c4edd8"],
  4: ["#fff8e8", "#f5e0a0"],
  5: ["#fce8ff", "#e8b0f8"],
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, stage: PetStage, t: number) {
  const [top, bot] = SKY_COLORS[stage]
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, top); g.addColorStop(1, bot)
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)

  // Clouds for stage 3+
  if (stage >= 3) {
    for (let i = 0; i < 4; i++) {
      const cx = ((t * (3 + i * 1.2) * 8) % (w + 260)) - 260 + i * 90
      const cy = 28 + i * 16
      ctx.save(); ctx.globalAlpha = 0.8
      ctx.fillStyle = "white"
      ctx.beginPath(); ctx.ellipse(cx, cy, 55, 14, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + 28, cy - 8, 22, 12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }

  // Stars for stage 5
  if (stage === 5) {
    for (let i = 0; i < 8; i++) {
      const sx = w * 0.08 + i * (w / 8)
      const sy = 10 + Math.sin(t * 1.5 + i) * 5
      ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.35
      ctx.fillStyle = "#FCD34D"
      ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

// ── Stage-specific floor palettes ───────────────────────────────────────────

const STAGE_FLOORS: Record<PetStage, [string, string]> = {
  1: ["#dde3ea", "#c8d0da"],
  2: ["#ede9fe", "#ddd6fe"],
  3: ["#d1fae5", "#a7f3d0"],
  4: ["#fef3c7", "#fde68a"],
  5: ["#f5d0fe", "#e879f9"],
}

// ── Furniture drawing — pure canvas, no emoji ───────────────────────────────

function drawFoodBowl(ctx: CanvasRenderingContext2D, px: number, py: number) {
  // mat
  ctx.fillStyle = "#fde68a"; ctx.beginPath()
  ctx.ellipse(px, py, 16, 7, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1; ctx.stroke()
  // bowl rim
  ctx.fillStyle = "#e0e7ff"; ctx.beginPath()
  ctx.ellipse(px, py - 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = "#4338ca"; ctx.lineWidth = 1; ctx.stroke()
  // food inside
  ctx.fillStyle = "#f87171"; ctx.beginPath()
  ctx.ellipse(px, py - 5, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill()
  // tiny kibble dots
  ctx.fillStyle = "#dc2626"
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    ctx.beginPath(); ctx.arc(px + Math.cos(a) * 3.5, py - 5 + Math.sin(a) * 1.5, 1, 0, Math.PI * 2); ctx.fill()
  }
}

function drawToyChest(ctx: CanvasRenderingContext2D, px: number, py: number) {
  // back panel
  rect(ctx, px - 14, py - 28, 28, 20, "#92400e")
  // lid (open slightly)
  ctx.fillStyle = "#b45309"
  ctx.beginPath()
  ctx.moveTo(px - 14, py - 28)
  ctx.lineTo(px + 14, py - 28)
  ctx.lineTo(px + 12, py - 36)
  ctx.lineTo(px - 12, py - 36)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // latch
  rect(ctx, px - 3, py - 20, 6, 4, "#fcd34d")
  // items peeking out
  circle(ctx, px - 6, py - 28, 4, "#f87171")  // red ball
  rect(ctx, px + 2, py - 32, 5, 6, "#22c55e") // green block
}

function drawPlant(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  // pot
  ctx.fillStyle = "#c2410c"
  ctx.beginPath()
  ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py)
  ctx.lineTo(px + 5, py - 10); ctx.lineTo(px - 5, py - 10); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // soil
  ctx.fillStyle = "#78350f"; ctx.beginPath()
  ctx.ellipse(px, py - 10, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill()
  // stem
  rect(ctx, px - 2, py - 26, 4, 16, "#65a30d")
  // leaves — gently sway
  const sway = Math.sin(t * 1.5) * 1.5
  ctx.fillStyle = "#4ade80"
  ctx.beginPath(); ctx.ellipse(px - 10 + sway, py - 28, 9, 5, -0.4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(px + 10 + sway, py - 30, 9, 5, 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(px + sway, py - 34, 8, 6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 0.8
  for (const [ex, ey, rot] of [[-10+sway, -28, -0.4], [10+sway, -30, 0.4], [sway, -34, 0]] as [number,number,number][]) {
    ctx.beginPath(); ctx.ellipse(px + ex, py + ey, 9, 5, rot, 0, Math.PI * 2); ctx.stroke()
  }
}

function drawSofa(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string, tileW: number, tileH: number) {
  drawRaisedBlock(ctx, ax, ay, tileW, tileH, color, "#000", shade(color, -20))
  drawRaisedBlock(ctx, bx, by, tileW, tileH, color, "#000", shade(color, -20))
}

function drawRoundTable(ctx: CanvasRenderingContext2D, px: number, py: number) {
  circle(ctx, px, py - 10, 14, "#d29a4a")
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(px, py - 10, 14, 0, Math.PI * 2); ctx.stroke()
  rect(ctx, px - 2, py, 4, 8, "#a36d27")
}

function drawPalm(ctx: CanvasRenderingContext2D, px: number, py: number) {
  rect(ctx, px - 4, py - 6, 8, 14, "#8b5a2b")
  circle(ctx, px - 8, py - 12, 6, "#22c55e")
  circle(ctx, px + 8, py - 12, 6, "#22c55e")
  circle(ctx, px, py - 18, 7, "#16a34a")
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(px, py - 18, 7, 0, Math.PI * 2); ctx.stroke()
}

function drawFountain(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  circle(ctx, px, py - 6, 12, "#93c5fd")
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(px, py - 6, 12, 0, Math.PI * 2); ctx.stroke()
  rect(ctx, px - 3, py - 26, 6, 20, "#60a5fa")
  ctx.fillStyle = "#bfdbfe"
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    const amp = 10 + Math.sin(t * 4 + i) * 2
    circle(ctx, px + Math.cos(ang) * amp, py - 26 + Math.sin(ang) * amp * 0.5, 2, "#bfdbfe")
  }
}

function drawArcade(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  rect(ctx, px - 10, py - 22, 20, 22, "#1f2937")
  rect(ctx, px - 12, py - 30, 24, 10, "#111827")
  const screenCol = `hsl(${(t * 40) % 360},80%,60%)`
  rect(ctx, px - 9, py - 26, 18, 12, screenCol)
  // tiny joystick
  circle(ctx, px - 2, py - 5, 3, "#374151")
  rect(ctx, px + 5, py - 7, 3, 3, "#ef4444")
}

function drawBookshelf(ctx: CanvasRenderingContext2D, px: number, py: number) {
  rect(ctx, px - 16, py - 30, 32, 22, "#92400e")
  // shelves
  rect(ctx, px - 15, py - 20, 30, 2, "#b45309")
  // books
  const cols2 = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899"]
  for (let i = 0; i < 6; i++) {
    rect(ctx, px - 14 + i * 5, py - 29, 4, 9, cols2[i])
  }
  for (let i = 0; i < 5; i++) {
    rect(ctx, px - 13 + i * 6, py - 19, 4, 8, cols2[(i + 2) % 6])
  }
}

function drawBallPit(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  // outer wall
  ctx.fillStyle = "#fda4af"
  ctx.beginPath(); ctx.ellipse(px, py - 4, 18, 9, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // inner
  ctx.fillStyle = "#fee2e2"
  ctx.beginPath(); ctx.ellipse(px, py - 6, 14, 7, 0, 0, Math.PI * 2); ctx.fill()
  // balls
  const ballCols = ["#f87171","#60a5fa","#fbbf24","#34d399","#c084fc"]
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.3
    const r = 8
    circle(ctx, px + Math.cos(a) * r, py - 6 + Math.sin(a) * 3, 3, ballCols[i % ballCols.length])
  }
}

function drawMusicStand(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  // stand pole
  rect(ctx, px - 2, py - 28, 4, 22, "#374151")
  // music sheet holder
  rect(ctx, px - 10, py - 34, 20, 12, "#f3f4f6")
  // music notes on sheet
  ctx.fillStyle = "#111827"
  for (let i = 0; i < 4; i++) {
    circle(ctx, px - 7 + i * 5, py - 28 + Math.sin(t * 3 + i) * 1, 2, "#111827")
    rect(ctx, px - 7 + i * 5, py - 36 + Math.sin(t * 3 + i) * 1, 1, 6, "#111827")
  }
}

function drawKitePole(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  // pole
  rect(ctx, px - 2, py - 6, 4, 18, "#92400e")
  // string
  ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px, py - 6)
  ctx.quadraticCurveTo(px + 18 + Math.sin(t * 2) * 4, py - 30, px + 22 + Math.sin(t) * 6, py - 48)
  ctx.stroke()
  // kite diamond
  const kx = px + 22 + Math.sin(t) * 6
  const ky = py - 48
  const kw = 8, kh = 11
  ctx.fillStyle = "#f43f5e"
  ctx.beginPath()
  ctx.moveTo(kx, ky - kh); ctx.lineTo(kx + kw, ky)
  ctx.lineTo(kx, ky + kh); ctx.lineTo(kx - kw, ky)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // cross lines
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.7
  ctx.beginPath(); ctx.moveTo(kx, ky - kh); ctx.lineTo(kx, ky + kh); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(kx - kw, ky); ctx.lineTo(kx + kw, ky); ctx.stroke()
  // tail ribbons
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(kx, ky + kh)
  for (let i = 0; i < 4; i++) {
    ctx.quadraticCurveTo(kx + (i % 2 === 0 ? 6 : -6), ky + kh + 5 + i * 5, kx, ky + kh + 10 + i * 5)
  }
  ctx.stroke()
}

function drawCastle(ctx: CanvasRenderingContext2D, px: number, py: number) {
  // main tower
  rect(ctx, px - 14, py - 44, 28, 38, "#a5b4fc")
  // battlements
  for (let i = 0; i < 4; i++) {
    rect(ctx, px - 13 + i * 8, py - 50, 5, 8, "#818cf8")
  }
  // door arch
  ctx.fillStyle = "#1e1b4b"
  ctx.beginPath()
  ctx.arc(px, py - 14, 6, Math.PI, 0)
  ctx.rect(px - 6, py - 14, 12, 8)
  ctx.fill()
  // window
  rect(ctx, px - 5, py - 34, 10, 10, "#fef9c3")
  circle(ctx, px, py - 34, 4, "#bfdbfe")
  // side turrets
  rect(ctx, px - 20, py - 34, 8, 24, "#c7d2fe")
  rect(ctx, px + 12, py - 34, 8, 24, "#c7d2fe")
  for (let i = 0; i < 2; i++) {
    rect(ctx, px - 20 + i * 4, py - 38, 4, 6, "#a5b4fc")
    rect(ctx, px + 12 + i * 4, py - 38, 4, 6, "#a5b4fc")
  }
  // flag
  rect(ctx, px - 1, py - 56, 2, 14, "#ef4444")
  ctx.fillStyle = "#fbbf24"
  ctx.beginPath()
  ctx.moveTo(px, py - 56); ctx.lineTo(px + 10, py - 52); ctx.lineTo(px, py - 48); ctx.fill()
}

function drawCrystal(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  const pulse = 0.85 + Math.sin(t * 3) * 0.1
  ctx.save(); ctx.translate(px, py - 20); ctx.scale(pulse, pulse)
  // crystal body
  ctx.fillStyle = "#a78bfa"
  ctx.beginPath()
  ctx.moveTo(0, -22); ctx.lineTo(10, -6); ctx.lineTo(8, 8)
  ctx.lineTo(-8, 8); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // inner highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)"
  ctx.beginPath()
  ctx.moveTo(0, -20); ctx.lineTo(5, -8); ctx.lineTo(0, 0); ctx.lineTo(-4, -8); ctx.closePath(); ctx.fill()
  // glow
  ctx.globalAlpha = 0.2 + Math.sin(t * 3) * 0.1
  ctx.fillStyle = "#c084fc"
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawRainbow(ctx: CanvasRenderingContext2D, px: number, py: number) {
  const cols = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"]
  for (let i = 0; i < cols.length; i++) {
    const r = 40 - i * 5
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(px, py, r, Math.PI, 0); ctx.stroke()
  }
  // clouds at base
  ctx.fillStyle = "white"
  ctx.beginPath(); ctx.ellipse(px - 38, py + 2, 9, 6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(px + 38, py + 2, 9, 6, 0, 0, Math.PI * 2); ctx.fill()
}

function drawUnicorn(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  const bob = Math.sin(t * 2) * 2
  // body
  ctx.fillStyle = "#fce7f3"
  ctx.beginPath(); ctx.ellipse(px, py - 10 + bob, 16, 10, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke()
  // head
  circle(ctx, px + 12, py - 18 + bob, 8, "#fce7f3")
  ctx.strokeStyle = "#000"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(px + 12, py - 18 + bob, 8, 0, Math.PI * 2); ctx.stroke()
  // horn
  ctx.fillStyle = "#fbbf24"
  ctx.beginPath()
  ctx.moveTo(px + 12, py - 30 + bob)
  ctx.lineTo(px + 15, py - 22 + bob)
  ctx.lineTo(px + 9, py - 22 + bob); ctx.closePath(); ctx.fill()
  // mane
  const maneX = [px, px + 4, px + 8]
  for (let i = 0; i < 3; i++) {
    const maneColor = ["#f9a8d4","#c084fc","#60a5fa"][i]
    ctx.fillStyle = maneColor
    ctx.beginPath(); ctx.ellipse(maneX[i], py - 18 + bob - 2, 4, 7, -0.3, 0, Math.PI * 2); ctx.fill()
  }
  // legs
  for (let i = 0; i < 4; i++) {
    const lx = px - 10 + i * 7
    const legSwing = Math.sin(t * 4 + i) * 2
    rect(ctx, lx, py - 3 + legSwing + bob, 4, 10, "#f9a8d4")
  }
  // tail
  ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(px - 16, py - 8 + bob)
  ctx.quadraticCurveTo(px - 26, py - 4 + bob, px - 22, py + 4 + bob); ctx.stroke()
  // eye
  circle(ctx, px + 15, py - 19 + bob, 2, "#1e1b4b")
  circle(ctx, px + 16, py - 20 + bob, 0.8, "white")
  // sparkles
  ctx.fillStyle = "#fbbf24"
  for (let i = 0; i < 3; i++) {
    const a = t * 3 + i * 2.1
    ctx.globalAlpha = 0.7; ctx.beginPath()
    ctx.arc(px + Math.cos(a) * 20, py + bob + Math.sin(a) * 10 - 10, 2, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawStar(ctx: CanvasRenderingContext2D, px: number, py: number, t: number) {
  const pulse = 0.9 + Math.sin(t * 2.5) * 0.1
  ctx.save(); ctx.translate(px, py - 20); ctx.scale(pulse, pulse)
  // pole
  rect(ctx, -3, 0, 6, 20, "#374151")
  ctx.restore()
  // star
  ctx.save(); ctx.translate(px, py - 40 + Math.sin(t * 2) * 2)
  ctx.fillStyle = "#fbbf24"
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const r = i % 2 === 0 ? 12 : 5
    i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r)
  }
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1; ctx.stroke()
  // glow
  ctx.globalAlpha = 0.2 + Math.sin(t * 2) * 0.1
  ctx.fillStyle = "#fef08a"
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Draw all room furniture for a given stage ───────────────────────────────

function drawRoomFurniture(
  ctx: CanvasRenderingContext2D,
  stage: PetStage,
  params: IsoParams,
  tileW: number,
  tileH: number,
  t: number,
  ownedItems: string[],
) {
  const P = (x: number, y: number) => projectIso(x, y, params)

  // Always present: sofa pair + round table + food bowl + toy chest
  const sofaColor = stage <= 2 ? "#ef4444" : stage === 3 ? "#34d399" : stage === 4 ? "#f59e0b" : "#a78bfa"
  const sofaA = P(3, 4), sofaB = P(4, 4)
  drawSofa(ctx, sofaA.px, sofaA.py, sofaB.px, sofaB.py, sofaColor, tileW, tileH)

  const table = P(9, 5)
  drawRoundTable(ctx, table.px, table.py)

  const bowl = P(12, 3)
  drawFoodBowl(ctx, bowl.px, bowl.py)

  const chest = P(7, 2)
  drawToyChest(ctx, chest.px, chest.py)

  // Stage 2+ : plant
  if (stage >= 2) {
    const pl = P(16, 3)
    drawPlant(ctx, pl.px, pl.py, t)
  }

  // Stage 3+ : fountain + palm trees
  if (stage >= 3) {
    const ftn = P(4, 11)
    drawFountain(ctx, ftn.px, ftn.py, t)
    const palm1 = P(16, 10)
    const palm2 = P(15, 13)
    drawPalm(ctx, palm1.px, palm1.py)
    drawPalm(ctx, palm2.px, palm2.py)
  }

  // Stage 3+ : arcade cabinet
  if (stage >= 3) {
    const arc = P(5, 9)
    drawArcade(ctx, arc.px, arc.py, t)
  }

  // Stage 4+ : star lamp + castle
  if (stage >= 4) {
    const star = P(14, 2)
    drawStar(ctx, star.px, star.py, t)
    const castle = P(2, 7)
    drawCastle(ctx, castle.px, castle.py)
  }

  // Stage 5 : rainbow + unicorn
  if (stage >= 5) {
    const rb = P(10, 3)
    drawRainbow(ctx, rb.px, rb.py - 20)
    const uni = P(13, 10)
    drawUnicorn(ctx, uni.px, uni.py, t)
    // crystal
    const cr = P(6, 13)
    drawCrystal(ctx, cr.px, cr.py, t)
  }

  // Item-linked furniture
  if (ownedItems.includes("book")) {
    const bs = P(2, 3)
    drawBookshelf(ctx, bs.px, bs.py)
  }
  if (ownedItems.includes("ball")) {
    const bp = P(12, 11)
    drawBallPit(ctx, bp.px, bp.py, t)
  }
  if (ownedItems.includes("guitar")) {
    const ms = P(2, 12)
    drawMusicStand(ctx, ms.px, ms.py, t)
  }
  if (ownedItems.includes("kite")) {
    const kp = P(17, 7)
    drawKitePole(ctx, kp.px, kp.py, t)
  }
}

// ── Pet avatar (pure canvas, direction-aware) ───────────────────────────────

const PET_PALETTE: Record<ChildPetType, { body: string; accent: string; eye: string; cheek: string }> = {
  bunny:  { body: "#F5F0FF", accent: "#D8B4FE", eye: "#7C3AED", cheek: "#F9A8D4" },
  cat:    { body: "#FEF3C7", accent: "#FCD34D", eye: "#92400E", cheek: "#FCA5A5" },
  dragon: { body: "#D1FAE5", accent: "#34D399", eye: "#065F46", cheek: "#6EE7B7" },
  fox:    { body: "#FEE2E2", accent: "#F87171", eye: "#991B1B", cheek: "#FCA5A5" },
  dog:    { body: "#FEF9C3", accent: "#FBBF24", eye: "#78350F", cheek: "#FCA5A5" },
}

function drawHat(ctx: CanvasRenderingContext2D, hatId: string, ax: number, baseY: number, sc: number) {
  // Head centre is at baseY-14*sc, radius 12*sc → top of head at baseY-(14+12)*sc = baseY-26*sc
  const hx = ax, hy = baseY - 26 * sc

  if (hatId === "crown") {
    // Gold crown sits right on top of head — hy is the top of the head
    ctx.fillStyle = "#FBBF24"
    ctx.beginPath()
    ctx.moveTo(hx - 9 * sc, hy + 8 * sc)   // bottom-left
    ctx.lineTo(hx - 9 * sc, hy + 2 * sc)   // left wall up
    ctx.lineTo(hx - 5 * sc, hy + 5 * sc)   // left notch
    ctx.lineTo(hx,           hy)            // centre peak
    ctx.lineTo(hx + 5 * sc, hy + 5 * sc)   // right notch
    ctx.lineTo(hx + 9 * sc, hy + 2 * sc)   // right wall up
    ctx.lineTo(hx + 9 * sc, hy + 8 * sc)   // bottom-right
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = "#D97706"; ctx.lineWidth = 0.9; ctx.stroke()
    // Band across bottom
    ctx.fillStyle = "#D97706"
    ctx.fillRect(hx - 9 * sc, hy + 6 * sc, 18 * sc, 2.5 * sc)
    // Gems
    const gems = ["#EF4444", "#3B82F6", "#10B981"]
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = gems[i]
      ctx.beginPath()
      ctx.arc(hx + (i - 1) * 5 * sc, hy + 7 * sc, 1.5 * sc, 0, Math.PI * 2)
      ctx.fill()
    }

  } else if (hatId === "wizard-hat") {
    // Brim sits at hy (top of head), cone rises above
    ctx.fillStyle = "#7C3AED"
    ctx.beginPath()
    ctx.moveTo(hx, hy - 14 * sc)           // tip
    ctx.lineTo(hx - 11 * sc, hy + 3 * sc)  // brim left
    ctx.lineTo(hx + 11 * sc, hy + 3 * sc)  // brim right
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = "#5B21B6"; ctx.lineWidth = 0.8; ctx.stroke()
    // Brim ellipse
    ctx.fillStyle = "#6D28D9"
    ctx.beginPath()
    ctx.ellipse(hx, hy + 3 * sc, 13 * sc, 3.5 * sc, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#5B21B6"; ctx.lineWidth = 0.7; ctx.stroke()
    // Stars
    ctx.fillStyle = "#FCD34D"
    for (const [dx, dy] of [[-4, -4], [3, -9]]) {
      ctx.beginPath()
      ctx.arc(hx + dx * sc, hy + dy * sc, 1.4 * sc, 0, Math.PI * 2)
      ctx.fill()
    }

  } else if (hatId === "party-hat") {
    // Cone base rests at hy
    ctx.fillStyle = "#F472B6"
    ctx.beginPath()
    ctx.moveTo(hx, hy - 13 * sc)
    ctx.lineTo(hx - 9 * sc, hy + 3 * sc)
    ctx.lineTo(hx + 9 * sc, hy + 3 * sc)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = "#DB2777"; ctx.lineWidth = 0.8; ctx.stroke()
    // Diagonal stripes
    ctx.strokeStyle = "#FCD34D"; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(hx - 2 * sc, hy - 10 * sc); ctx.lineTo(hx - 7 * sc, hy + 2 * sc); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(hx + 2 * sc, hy - 10 * sc); ctx.lineTo(hx + 7 * sc, hy + 2 * sc); ctx.stroke()
    // Pom-pom
    ctx.fillStyle = "#FCD34D"
    ctx.beginPath(); ctx.arc(hx, hy - 14 * sc, 2.8 * sc, 0, Math.PI * 2); ctx.fill()
    // Base ellipse
    ctx.fillStyle = "#DB2777"; ctx.globalAlpha = 0.4
    ctx.beginPath(); ctx.ellipse(hx, hy + 3 * sc, 9 * sc, 2 * sc, 0, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1

  } else if (hatId === "cowboy") {
    // Crown of hat sits from hy to hy+8, brim at hy+4
    ctx.fillStyle = "#92400E"
    // Crown (upper part)
    ctx.beginPath()
    ctx.ellipse(hx, hy + 4 * sc, 8 * sc, 5 * sc, 0, 0, Math.PI * 2)
    ctx.fill()
    // Brim
    ctx.beginPath()
    ctx.ellipse(hx, hy + 6 * sc, 15 * sc, 3.5 * sc, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#78350F"; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.ellipse(hx, hy + 6 * sc, 15 * sc, 3.5 * sc, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(hx, hy + 4 * sc, 8 * sc, 5 * sc, 0, 0, Math.PI * 2); ctx.stroke()
    // Hat band
    ctx.strokeStyle = "#D97706"; ctx.lineWidth = 1.8
    ctx.beginPath(); ctx.ellipse(hx, hy + 6.5 * sc, 8 * sc, 2 * sc, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke()

  } else if (hatId === "flower") {
    // Flower crown ring sits at hy+4 (just above head top)
    const fy = hy + 4 * sc
    const petals = 7
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2
      const px = hx + Math.cos(a) * 7 * sc
      const py = fy + Math.sin(a) * 3.5 * sc
      ctx.fillStyle = i % 2 === 0 ? "#F9A8D4" : "#FCA5A5"
      ctx.beginPath(); ctx.ellipse(px, py, 3.5 * sc, 2.5 * sc, a, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = "#FDE68A"
    ctx.beginPath(); ctx.arc(hx, fy, 4 * sc, 0, Math.PI * 2); ctx.fill()
    // Green stem ring
    ctx.strokeStyle = "#86EFAC"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(hx, fy, 8 * sc, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke()
  }
}

function drawOutfit(ctx: CanvasRenderingContext2D, outfitId: string, ax: number, baseY: number, sc: number) {
  // Body spans baseY-7 (top) to baseY+9*sc (bottom), neck at ~baseY-7
  const ox = ax
  // neck Y (where collar/clasp sit)
  const neckY = baseY - 7
  // body bottom
  const bodyBot = baseY + 9 * sc

  if (outfitId === "cape") {
    // Cape hangs from shoulders behind the body — drawn BEFORE body so body covers top
    ctx.fillStyle = "#DC2626"
    ctx.beginPath()
    // Shoulder anchors
    ctx.moveTo(ox - 9 * sc, neckY)
    ctx.quadraticCurveTo(ox - 16 * sc, neckY + 6 * sc, ox - 13 * sc, bodyBot + 10 * sc)
    ctx.lineTo(ox + 13 * sc, bodyBot + 10 * sc)
    ctx.quadraticCurveTo(ox + 16 * sc, neckY + 6 * sc, ox + 9 * sc, neckY)
    ctx.closePath()
    ctx.fill()
    // Inner highlight / fold line
    ctx.strokeStyle = "#FCA5A5"; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox, neckY)
    ctx.quadraticCurveTo(ox + 3 * sc, neckY + 8 * sc, ox - 1 * sc, bodyBot + 10 * sc)
    ctx.stroke()
    // Gold clasp at collar
    ctx.fillStyle = "#FCD34D"
    ctx.beginPath(); ctx.arc(ox, neckY + 1 * sc, 2.5 * sc, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = "#D97706"; ctx.lineWidth = 0.8; ctx.stroke()

  } else if (outfitId === "scarf") {
    // Scarf wraps around neck — drawn ON TOP of body so it looks worn
    const sy = neckY + 4 * sc
    // Main wrap
    ctx.strokeStyle = "#60A5FA"; ctx.lineWidth = 5 * sc; ctx.lineCap = "round"
    ctx.beginPath()
    ctx.ellipse(ox, sy, 9 * sc, 3 * sc, 0, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()
    // Second loop below
    ctx.lineWidth = 4.5 * sc
    ctx.beginPath()
    ctx.ellipse(ox, sy + 2 * sc, 9 * sc, 3 * sc, 0, Math.PI * 0.1, Math.PI * 0.9)
    ctx.stroke()
    // Dangling tail
    ctx.lineWidth = 4 * sc
    ctx.beginPath()
    ctx.moveTo(ox + 8 * sc, sy + 3 * sc)
    ctx.quadraticCurveTo(ox + 11 * sc, sy + 8 * sc, ox + 8 * sc, bodyBot + 4 * sc)
    ctx.stroke()
    ctx.lineCap = "butt"
    // Stripe detail
    ctx.strokeStyle = "#BFDBFE"; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(ox, sy, 9 * sc, 3 * sc, 0, Math.PI * 1.2, Math.PI * 1.8)
    ctx.stroke()

  } else if (outfitId === "bow-tie") {
    // Bow tie at neck — ON TOP of body
    const by2 = neckY + 3 * sc
    ctx.fillStyle = "#EC4899"
    // Left wing
    ctx.beginPath()
    ctx.moveTo(ox - 1.5 * sc, by2 - 1 * sc)
    ctx.lineTo(ox - 10 * sc,  by2 - 5 * sc)
    ctx.lineTo(ox - 10 * sc,  by2 + 3 * sc)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = "#BE185D"; ctx.lineWidth = 0.7; ctx.stroke()
    // Right wing
    ctx.fillStyle = "#EC4899"
    ctx.beginPath()
    ctx.moveTo(ox + 1.5 * sc, by2 - 1 * sc)
    ctx.lineTo(ox + 10 * sc,  by2 - 5 * sc)
    ctx.lineTo(ox + 10 * sc,  by2 + 3 * sc)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = "#BE185D"; ctx.lineWidth = 0.7; ctx.stroke()
    // Knot
    ctx.fillStyle = "#BE185D"
    ctx.beginPath(); ctx.ellipse(ox, by2 - 1 * sc, 2.5 * sc, 3.5 * sc, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = "#9D174D"; ctx.lineWidth = 0.6; ctx.stroke()

  } else if (outfitId === "jacket") {
    // Jacket lapels over the body — drawn ON TOP
    ctx.fillStyle = "#1D4ED8"
    // Left lapel panel
    ctx.beginPath()
    ctx.moveTo(ox - 1 * sc,  neckY)
    ctx.lineTo(ox - 10 * sc, neckY + 5 * sc)
    ctx.lineTo(ox - 8 * sc,  bodyBot)
    ctx.lineTo(ox - 1 * sc,  bodyBot - 3 * sc)
    ctx.closePath(); ctx.fill()
    // Right lapel panel
    ctx.beginPath()
    ctx.moveTo(ox + 1 * sc,  neckY)
    ctx.lineTo(ox + 10 * sc, neckY + 5 * sc)
    ctx.lineTo(ox + 8 * sc,  bodyBot)
    ctx.lineTo(ox + 1 * sc,  bodyBot - 3 * sc)
    ctx.closePath(); ctx.fill()
    // Collar V edges
    ctx.strokeStyle = "#1E40AF"; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(ox - 1 * sc, neckY); ctx.lineTo(ox - 10 * sc, neckY + 5 * sc); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ox + 1 * sc, neckY); ctx.lineTo(ox + 10 * sc, neckY + 5 * sc); ctx.stroke()
    // Buttons down centre
    ctx.fillStyle = "#BFDBFE"
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(ox, neckY + 4 * sc + i * 4 * sc, 1.4 * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#93C5FD"; ctx.lineWidth = 0.5; ctx.stroke()
    }
  }
}

function drawPetAvatar(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  petType: ChildPetType, stage: PetStage,
  facing: "N" | "S" | "E" | "W",
  t: number, moving: boolean,
  equippedHat?: string, equippedOutfit?: string,
) {
  const c = PET_PALETTE[petType]
  // Scale by stage — bumped up so pet is more visible in the playpen
  const sc = 1.0 + (stage - 1) * 0.08

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)"
  ctx.beginPath(); ctx.ellipse(ax, ay + 7, 12 * sc, 5 * sc, 0, 0, Math.PI * 2); ctx.fill()

  const bob = Math.sin(t * (moving ? 12 : 4)) * (moving ? 2.5 : 1)
  const walkSwing = Math.sin(t * 6) * (moving ? 3 : 1)
  const baseY = ay - 2 + bob

  // Egg (stage 1) — special simple shape
  if (stage === 1) {
    ctx.fillStyle = c.accent
    ctx.beginPath(); ctx.ellipse(ax, baseY - 10, 11, 15, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = "#000"; ctx.lineWidth = 0.9; ctx.stroke()
    // crack
    ctx.strokeStyle = c.eye; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(ax - 4, baseY - 8); ctx.lineTo(ax - 1, baseY - 12); ctx.lineTo(ax + 2, baseY - 9); ctx.stroke()
    // sleepy eyes
    ctx.strokeStyle = c.eye; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(ax - 5, baseY - 6); ctx.quadraticCurveTo(ax - 3, baseY - 8, ax - 1, baseY - 6); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ax + 1, baseY - 6); ctx.quadraticCurveTo(ax + 3, baseY - 8, ax + 5, baseY - 6); ctx.stroke()
    return
  }

  // Cape drawn first so the body sits on top of it
  if (equippedOutfit === "cape") drawOutfit(ctx, "cape", ax, baseY, sc)

  // Legs
  ctx.fillStyle = c.accent
  ctx.beginPath(); ctx.roundRect(ax - 6 * sc, baseY + 9, 5 * sc, 7 * sc + walkSwing * 0.6, 2)
  ctx.roundRect(ax + 1 * sc, baseY + 9, 5 * sc, 7 * sc - walkSwing * 0.6, 2)
  ctx.fill()
  ctx.strokeStyle = "#000"; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.roundRect(ax - 6 * sc, baseY + 9, 5 * sc, 7 * sc + walkSwing * 0.6, 2); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(ax + 1 * sc, baseY + 9, 5 * sc, 7 * sc - walkSwing * 0.6, 2); ctx.stroke()

  // Body
  ctx.fillStyle = c.body; ctx.strokeStyle = "#000"; ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.roundRect(ax - 9 * sc, baseY - 7, 18 * sc, 16 * sc, 5 * sc); ctx.fill(); ctx.stroke()
  // belly stripe
  ctx.fillStyle = c.accent; ctx.globalAlpha = 0.35
  ctx.beginPath(); ctx.roundRect(ax - 5 * sc, baseY - 4, 10 * sc, 4 * sc, 2 * sc); ctx.fill()
  ctx.globalAlpha = 1

  // Arms
  ctx.fillStyle = c.body; ctx.strokeStyle = "#000"; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.roundRect(ax - 14 * sc, baseY - 4 + walkSwing * 0.2, 5 * sc, 11 * sc, 2 * sc); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(ax + 9 * sc, baseY - 4 - walkSwing * 0.2, 5 * sc, 11 * sc, 2 * sc); ctx.fill(); ctx.stroke()

  // Ears (type-specific)
  ctx.fillStyle = c.body; ctx.strokeStyle = "#000"; ctx.lineWidth = 0.8
  if (petType === "bunny") {
    ctx.beginPath(); ctx.ellipse(ax - 6 * sc, baseY - 22, 3 * sc, 9 * sc, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(ax + 6 * sc, baseY - 22, 3 * sc, 9 * sc, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = c.cheek; ctx.globalAlpha = 0.45
    ctx.beginPath(); ctx.ellipse(ax - 6 * sc, baseY - 22, 1.3 * sc, 7 * sc, -0.15, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(ax + 6 * sc, baseY - 22, 1.3 * sc, 7 * sc, 0.15, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  } else if (petType === "cat") {
    ctx.beginPath(); ctx.moveTo(ax - 9 * sc, baseY - 19); ctx.lineTo(ax - 14 * sc, baseY - 27); ctx.lineTo(ax - 3 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ax + 9 * sc, baseY - 19); ctx.lineTo(ax + 14 * sc, baseY - 27); ctx.lineTo(ax + 3 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    // whiskers
    ctx.strokeStyle = c.accent; ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(ax - 4 * sc, baseY - 9); ctx.lineTo(ax - 14 * sc, baseY - 10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ax + 4 * sc, baseY - 9); ctx.lineTo(ax + 14 * sc, baseY - 10); ctx.stroke()
  } else if (petType === "dragon") {
    ctx.fillStyle = c.accent
    ctx.beginPath(); ctx.moveTo(ax - 7 * sc, baseY - 19); ctx.lineTo(ax - 12 * sc, baseY - 28); ctx.lineTo(ax - 1 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ax + 7 * sc, baseY - 19); ctx.lineTo(ax + 12 * sc, baseY - 28); ctx.lineTo(ax + 1 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    // dragon wings (small)
    ctx.fillStyle = c.accent; ctx.globalAlpha = 0.7
    ctx.beginPath(); ctx.moveTo(ax - 9 * sc, baseY - 4); ctx.quadraticCurveTo(ax - 22 * sc, baseY - 14, ax - 18 * sc, baseY - 2); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(ax + 9 * sc, baseY - 4); ctx.quadraticCurveTo(ax + 22 * sc, baseY - 14, ax + 18 * sc, baseY - 2); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1
  } else if (petType === "fox") {
    ctx.fillStyle = c.body
    ctx.beginPath(); ctx.moveTo(ax - 7 * sc, baseY - 19); ctx.lineTo(ax - 13 * sc, baseY - 27); ctx.lineTo(ax - 2 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ax + 7 * sc, baseY - 19); ctx.lineTo(ax + 13 * sc, baseY - 27); ctx.lineTo(ax + 2 * sc, baseY - 21); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.fillStyle = "white"; ctx.globalAlpha = 0.75
    ctx.beginPath(); ctx.moveTo(ax - 7 * sc, baseY - 20); ctx.lineTo(ax - 11 * sc, baseY - 25); ctx.lineTo(ax - 3 * sc, baseY - 21); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(ax + 7 * sc, baseY - 20); ctx.lineTo(ax + 11 * sc, baseY - 25); ctx.lineTo(ax + 3 * sc, baseY - 21); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1
    // tail
    ctx.strokeStyle = c.body; ctx.lineWidth = 5 * sc
    ctx.beginPath(); ctx.moveTo(ax - 9 * sc, baseY + 6)
    ctx.quadraticCurveTo(ax - 22 * sc, baseY - 2, ax - 18 * sc, baseY - 12); ctx.stroke()
    // white tail tip
    circle(ctx, ax - 18 * sc, baseY - 12, 3 * sc, "white")
  } else if (petType === "dog") {
    ctx.fillStyle = c.accent
    ctx.beginPath(); ctx.ellipse(ax - 9 * sc, baseY - 19, 5 * sc, 8 * sc, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(ax + 9 * sc, baseY - 19, 5 * sc, 8 * sc, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // dog tag
    circle(ctx, ax, baseY - 4, 3 * sc, "#fcd34d")
    ctx.strokeStyle = "#000"; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.arc(ax, baseY - 4, 3 * sc, 0, Math.PI * 2); ctx.stroke()
  }

  // Head
  ctx.fillStyle = c.body; ctx.strokeStyle = "#000"; ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.arc(ax, baseY - 14, 12 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Cheeks
  ctx.fillStyle = c.cheek; ctx.globalAlpha = 0.48
  ctx.beginPath(); ctx.arc(ax - 8 * sc, baseY - 12, 3.5 * sc, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(ax + 8 * sc, baseY - 12, 3.5 * sc, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // Eyes (direction-aware)
  const eyeY = facing === "N" ? baseY - 18 : baseY - 15
  if (facing === "S") {
    circle(ctx, ax - 4 * sc, eyeY, 2.5 * sc, c.eye)
    circle(ctx, ax + 4 * sc, eyeY, 2.5 * sc, c.eye)
    circle(ctx, ax - 3 * sc, eyeY - 1, 1 * sc, "white")
    circle(ctx, ax + 5 * sc, eyeY - 1, 1 * sc, "white")
  } else if (facing === "E") {
    circle(ctx, ax + 3 * sc, eyeY - 1, 2 * sc, c.eye)
    circle(ctx, ax + 7 * sc, eyeY + 1, 2 * sc, c.eye)
    circle(ctx, ax + 4 * sc, eyeY - 2, 0.8 * sc, "white")
  } else if (facing === "W") {
    circle(ctx, ax - 3 * sc, eyeY - 1, 2 * sc, c.eye)
    circle(ctx, ax - 7 * sc, eyeY + 1, 2 * sc, c.eye)
    circle(ctx, ax - 4 * sc, eyeY - 2, 0.8 * sc, "white")
  } else {
    circle(ctx, ax - 3 * sc, eyeY, 1.8 * sc, c.eye)
    circle(ctx, ax + 3 * sc, eyeY, 1.8 * sc, c.eye)
  }

  // Nose
  ctx.fillStyle = c.accent
  ctx.beginPath(); ctx.ellipse(ax, baseY - 10, 1.8 * sc, 1.2 * sc, 0, 0, Math.PI * 2); ctx.fill()

  // Smile
  ctx.strokeStyle = c.eye; ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.moveTo(ax - 3 * sc, baseY - 8)
  ctx.quadraticCurveTo(ax, baseY - 6, ax + 3 * sc, baseY - 8); ctx.stroke()

  // Legendary crown
  if (stage === 5) {
    ctx.fillStyle = "#FCD34D"
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? 6 : 2.5
      i === 0 ? ctx.moveTo(ax + Math.cos(a)*r, baseY - 24 + Math.sin(a)*r)
              : ctx.lineTo(ax + Math.cos(a)*r, baseY - 24 + Math.sin(a)*r)
    }
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = "#d97706"; ctx.lineWidth = 0.8; ctx.stroke()
  }

  // Scarf / bow-tie / jacket drawn after head so they layer over the body
  if (equippedOutfit && equippedOutfit !== "cape") drawOutfit(ctx, equippedOutfit, ax, baseY, sc)

  // Hat (drawn last, on top of everything)
  if (equippedHat) drawHat(ctx, equippedHat, ax, baseY, sc)
}

// ── Name tag ─────────────────────────────────────────────────────────────────

function drawNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, name: string) {
  ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif"
  const m = ctx.measureText(name)
  const pw = m.width + 12, ph = 16
  const bx = Math.round(x - pw / 2), by = Math.round(y - ph - 4)
  ctx.fillStyle = "rgba(255,255,255,0.95)"
  ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.roundRect(bx, by, pw, ph, 5); ctx.fill(); ctx.stroke()
  ctx.fillStyle = "#5b21b6"; ctx.textAlign = "center"
  ctx.fillText(name, x, by + ph - 3)
  ctx.textAlign = "left"
}

// ── Main component ────────────────────────────────────────────────────────────

type Facing = "N" | "S" | "E" | "W"
type Avatar = { x: number; y: number; facing: Facing }

interface PetPlayAreaProps {
  petType: ChildPetType
  stage: PetStage
  petName: string
  happiness: number
  addons?: PlayAddon[]
  ownedItems?: string[]
  equippedHat?: string
  equippedOutfit?: string
  onPet?: () => void
  className?: string
}

export default function PetPlayArea({
  petType, stage, petName, happiness,
  addons = [], ownedItems = [],
  equippedHat, equippedOutfit,
  onPet, className = "",
}: PetPlayAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 700, h: 480 })
  const [avatar, setAvatar] = useState<Avatar>({ x: 8, y: 8, facing: "S" })
  const pathRef = useRef<{ nodes: Node[]; progress: number } | null>(null)
  const animRef = useRef(0)
  const bgTimeRef = useRef(0)
  const heldDirRef = useRef<{ dx: number; dy: number; facing: Facing } | null>(null)
  const tileW = 54, tileH = 27
  const [petting, setPetting] = useState(false)
  const gridRef = useRef<boolean[]>(buildGrid(addons))

  useEffect(() => { gridRef.current = buildGrid(addons) }, [addons])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect
      setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  const walkable = useCallback((x: number, y: number) => {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
    return gridRef.current[y * COLS + x]
  }, [])

  const tryMoveOne = useCallback((dx: number, dy: number) => {
    const sx = Math.round(avatar.x), sy = Math.round(avatar.y)
    const nx = clamp(sx + dx, 2, COLS - 2)
    const ny = clamp(sy + dy, 2, ROWS - 2)
    if (!walkable(nx, ny)) return false
    pathRef.current = { nodes: [{ x: sx, y: sy }, { x: nx, y: ny }], progress: 0 }
    const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : dy > 0 ? "S" : "N"
    setAvatar(a => ({ ...a, facing }))
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar.x, avatar.y, walkable])

  // Keyboard
  useEffect(() => {
    const dirs: Record<string, { dx: number; dy: number; facing: Facing }> = {
      ArrowUp: { dx: 0, dy: -1, facing: "N" }, w: { dx: 0, dy: -1, facing: "N" },
      ArrowDown: { dx: 0, dy: 1, facing: "S" }, s: { dx: 0, dy: 1, facing: "S" },
      ArrowLeft: { dx: -1, dy: 0, facing: "W" }, a: { dx: -1, dy: 0, facing: "W" },
      ArrowRight: { dx: 1, dy: 0, facing: "E" }, d: { dx: 1, dy: 0, facing: "E" },
    }
    const down = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const tag = el?.tagName?.toLowerCase()
      if (el?.isContentEditable || tag === "input" || tag === "textarea") return
      const m = dirs[e.key]; if (!m) return
      e.preventDefault(); heldDirRef.current = m
      if (!pathRef.current) tryMoveOne(m.dx, m.dy)
    }
    const up = (e: KeyboardEvent) => { if (Object.keys(dirs).includes(e.key)) heldDirRef.current = null }
    window.addEventListener("keydown", down); window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [tryMoveOne])

  // Click to move
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const origin = centeredOrigin(size.w, size.h, COLS, ROWS, tileW, tileH)
    const params: IsoParams = { tileW, tileH, ox: origin.ox, oy: origin.oy }
    const { tx, ty } = unprojectIso(mx, my, params)
    const cx = clamp(tx, 2, COLS - 2), cy = clamp(ty, 2, ROWS - 2)
    if (!walkable(cx, cy)) return
    const sx = Math.round(avatar.x), sy = Math.round(avatar.y)
    if (Math.abs(tx - sx) <= 1 && Math.abs(ty - sy) <= 1) {
      onPet?.(); setPetting(true); setTimeout(() => setPetting(false), 800); return
    }
    const path = aStar({ x: sx, y: sy }, { x: cx, y: cy }, COLS, ROWS, walkable)
    if (path.length > 1) {
      pathRef.current = { nodes: path, progress: 0 }
      const first = path[1]
      const dx = first.x - sx, dy = first.y - sy
      setAvatar(a => ({ ...a, facing: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : dy > 0 ? "S" : "N" }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar.x, avatar.y, size.w, walkable, onPet])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    const c = ctx, cv = canvas
    let raf = 0, lastTime = performance.now()
    const speed = 3.4

    function loop(now: number) {
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      const pr = pathRef.current
      const moving = !!(pr && pr.nodes.length > 1)
      animRef.current += dt * (moving ? 8 : 3)
      bgTimeRef.current += dt * 0.25

      if (moving && pr) {
        pr.progress += speed * dt
        const maxP = pr.nodes.length - 1
        if (pr.progress >= maxP) {
          const last = pr.nodes[pr.nodes.length - 1]
          if (last) setAvatar(a => ({ ...a, x: last.x, y: last.y }))
          pathRef.current = null
        } else {
          const seg = Math.min(Math.floor(pr.progress), pr.nodes.length - 2)
          const nA = pr.nodes[seg], nB = pr.nodes[seg + 1]
          if (!nA || !nB) { pathRef.current = null }
          else {
            const tt = pr.progress - seg
            const facing = Math.abs(nB.x - nA.x) > Math.abs(nB.y - nA.y)
              ? nB.x > nA.x ? "E" : "W" : nB.y > nA.y ? "S" : "N"
            setAvatar(av => ({ ...av, x: nA.x + (nB.x - nA.x) * tt, y: nA.y + (nB.y - nA.y) * tt, facing }))
          }
        }
      } else if (!moving && heldDirRef.current) {
        const { dx, dy } = heldDirRef.current; tryMoveOne(dx, dy)
      }

      const dpr = window.devicePixelRatio || 1
      if (cv.width !== Math.floor(size.w * dpr) || cv.height !== Math.floor(size.h * dpr)) {
        cv.width = Math.floor(size.w * dpr); cv.height = Math.floor(size.h * dpr)
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, size.w, size.h)
      c.imageSmoothingEnabled = false

      drawBackground(c, size.w, size.h, stage, bgTimeRef.current)

      const origin = centeredOrigin(size.w, size.h, COLS, ROWS, tileW, tileH)
      const params: IsoParams = { tileW, tileH, ox: origin.ox, oy: origin.oy }
      const [tileA, tileB] = STAGE_FLOORS[stage]

      // Tiles
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const { px, py } = projectIso(x, y, params)
          const walkTile = gridRef.current[y * COLS + x]
          const fill = walkTile ? ((x + y) % 2 === 0 ? tileA : tileB) : `${tileA}55`
          drawTile(c, px, py, tileW, tileH, fill, "#000")
        }
      }

      drawWalls(c, params, tileW, tileH)
      drawRoomFurniture(c, stage, params, tileW, tileH, animRef.current, ownedItems)

      // Pet
      const { px: ax, py: ay } = projectIso(avatar.x, avatar.y, params)
      const petBounce = petting ? Math.sin(animRef.current * 15) * 4 : 0
      drawPetAvatar(c, ax, ay + petBounce, petType, stage, avatar.facing, animRef.current, moving, equippedHat, equippedOutfit)
      drawNameTag(c, ax, ay + petBounce - 36 - (stage - 1) * 4, petName)

      // Happiness sparkles
      if (happiness >= 70) {
        for (let i = 0; i < 3; i++) {
          const sa = animRef.current * 2.5 + i * 2.1
          const sr = 22 + (stage - 1) * 2
          c.fillStyle = "#FCD34D"
          c.globalAlpha = 0.45 + Math.sin(sa * 2) * 0.3
          c.beginPath(); c.arc(ax + Math.cos(sa) * sr, ay + petBounce - 22 + Math.sin(sa * 1.3) * 8, 2.5, 0, Math.PI * 2); c.fill()
        }
        c.globalAlpha = 1
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [avatar, stage, petType, petName, happiness, addons, ownedItems, size, petting, equippedHat, equippedOutfit, tryMoveOne])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border-2 border-border/40 shadow-inner cursor-pointer rounded-2xl ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        onClick={handleClick}
        className="block w-full h-full touch-none"
        aria-label="Pet play area — click to move your pet, click the pet to interact"
      />
      <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/50 font-medium pointer-events-none select-none">
        click · WASD
      </div>
    </div>
  )
}
