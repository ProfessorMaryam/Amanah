"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Child, Investment, FutureInstructions } from "./types"
import { mockChildren, mockUser } from "./mock-data"
import { useAuth } from "./auth-context"

// ----- Backend response shapes -----

interface BackendChild {
  id: string
  name: string
  dateOfBirth: string | null
  photoUrl: string | null
}

interface BackendGoal {
  goalType: string
  targetAmount: string
  monthlyContribution: string | null
  targetDate: string
  isPaused: boolean
  createdAt: string | null
  stripeSubscriptionId: string | null
}

interface BackendTransaction {
  id: string
  amount: string
  date: string
  type: string
}

interface BackendInvestmentPortfolio {
  portfolioType: string
  allocationPercentage: number
  currentValue: string | number
}

interface BackendFundDirective {
  guardianName: string
  guardianContact: string
  instructions: string
}

interface BackendChildDetail {
  child: BackendChild
  goal?: BackendGoal
  transactions?: BackendTransaction[]
  savingsBalance?: string | number
  investment?: BackendInvestmentPortfolio
  fundDirective?: BackendFundDirective
}

interface BackendUser {
  fullName: string | null
  email: string | null
  role: "parent" | "child" | null
}

// Maps a backend portfolio type string to the display allocation buckets
// used by the investment UI. Keeps UI consistent with PROFILES in investment/page.tsx.
const PORTFOLIO_ALLOCATIONS: Record<string, { label: string; percentage: number }[]> = {
  CONSERVATIVE: [
    { label: "Bonds", percentage: 50 },
    { label: "Index Funds", percentage: 30 },
    { label: "Savings Account", percentage: 20 },
  ],
  BALANCED: [
    { label: "Index Funds", percentage: 50 },
    { label: "Bonds", percentage: 30 },
    { label: "Savings Account", percentage: 20 },
  ],
  GROWTH: [
    { label: "Index Funds", percentage: 70 },
    { label: "Bonds", percentage: 20 },
    { label: "Savings Account", percentage: 10 },
  ],
}

const PORTFOLIO_GROWTH_RATES: Record<string, number> = {
  CONSERVATIVE: 4,
  BALANCED: 7,
  GROWTH: 10,
}


function mapBackendInvestment(portfolio: BackendInvestmentPortfolio): Investment {
  const type = portfolio.portfolioType.toUpperCase()
  return {
    active: true,
    portfolioType: portfolio.portfolioType,
    allocation: PORTFOLIO_ALLOCATIONS[type] ?? [
      { label: "Savings Account", percentage: portfolio.allocationPercentage },
    ],
    currentValue: parseFloat(String(portfolio.currentValue)),
    growthPercentage: PORTFOLIO_GROWTH_RATES[type] ?? 0,
  }
}

// ----- Child user personal goal types -----

export interface PersonalGoal {
  id: string
  name: string
  targetAmount: number
  targetDate: string
  currentAmount: number
  monthsRemaining: number
  isPaused: boolean
  transactions: { id: string; amount: number; date: string }[]
}

// ----- Context types -----

interface ChildUpdates {
  name?: string
  dateOfBirth?: string
  photoUrl?: string
  goal?: Partial<Child["goal"]>
}

interface AppContextType {
  user: typeof mockUser
  children: Child[]
  addChild: (child: Omit<Child, "id" | "contributions" | "investment" | "futureInstructions">) => Promise<void>
  updateChild: (id: string, updates: ChildUpdates) => Promise<void>
  deleteChild: (id: string) => Promise<void>
  addContribution: (childId: string, amount: number, note?: string) => Promise<void>
  togglePausedGoal: (childId: string) => Promise<void>
  setInvestment: (childId: string, investment: Investment) => Promise<void>
  setFutureInstructions: (childId: string, instructions: FutureInstructions) => Promise<void>
  getChild: (id: string) => Child | undefined
  setStripeSubscriptionId: (childId: string, subscriptionId: string) => void
  recordAutoContribution: (childId: string, amount: number) => void
  totalSavings: number
  // Child user personal goals
  personalGoals: PersonalGoal[]
  createPersonalGoal: (goalType: string, targetAmount: number, targetDate: string) => Promise<void>
  contributeToPersonalGoal: (goalId: string, amount: number) => Promise<void>
  deletePersonalGoal: (goalId: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenNode }: { children: ReactNode }) {
  const { token } = useAuth()
  const [user, setUser] = useState({ ...mockUser })
  const [childrenData, setChildrenData] = useState<Child[]>([])
  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([])

  // ----- Helpers -----

  function apiHeaders() {
    return {
      Authorization: `Bearer ${token!}`,
      "Content-Type": "application/json",
    }
  }

  function apiUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8742"
    return `${base}${path}`
  }

  // ----- Fetch all data from backend -----

  useEffect(() => {
    if (!token) {
      console.log("[AppContext] No session — loading mock data")
      setChildrenData(mockChildren)
      return
    }

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8742"

        const headers = {
          Authorization: `Bearer ${token}`,
        }

        // Fetch user profile
        console.log("[AppContext] Fetching /api/me ...")
        const userResponse = await fetch(`${base}/api/me`, { headers, signal: controller.signal })
        console.log("[AppContext] /api/me status:", userResponse.status)
        if (userResponse.ok) {
          const userData: BackendUser = await userResponse.json()
          console.log("[AppContext] /api/me response:", userData)
          setUser((prev) => ({
            ...prev,
            name: userData.fullName ?? prev.name,
            email: userData.email ?? prev.email,
            role: userData.role ?? prev.role,
          }))
        } else {
          const errText = await userResponse.text()
          console.error("[AppContext] /api/me error body:", errText)
        }

        // Fetch personal goals (child-role users) — runs independently of children fetch
        const goalsRes = await fetch(`${base}/api/my-goals`, { headers, signal: controller.signal })
        if (goalsRes.ok) {
          const raw = await goalsRes.json()
          setPersonalGoals(
            raw.map((g: any) => ({
              id: String(g.id),
              name: String(g.name),
              targetAmount: parseFloat(String(g.targetAmount)),
              targetDate: String(g.targetDate),
              currentAmount: parseFloat(String(g.currentAmount ?? 0)),
              monthsRemaining: Number(g.monthsRemaining ?? 0),
              isPaused: Boolean(g.isPaused),
              transactions: (g.transactions ?? []).map((t: any) => ({
                id: String(t.id),
                amount: parseFloat(String(t.amount)),
                date: t.date ? new Date(t.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
              })),
            }))
          )
        }

        // Fetch children list
        console.log("[AppContext] Fetching /api/children ...")
        const childrenResponse = await fetch(`${base}/api/children`, { headers, signal: controller.signal })
        console.log("[AppContext] /api/children status:", childrenResponse.status)
        if (!childrenResponse.ok) {
          const errText = await childrenResponse.text()
          console.error("[AppContext] /api/children error body:", errText)
          return
        }

        const childrenList: BackendChild[] = await childrenResponse.json()
        console.log("[AppContext] Children list:", childrenList)

        if (childrenList.length === 0) {
          console.warn("[AppContext] No children returned from backend — setting empty list")
          setChildrenData([])
          return
        }

        // Fetch full details for each child
        const childrenWithDetails = await Promise.all(
          childrenList.map(async (backendChild) => {
            try {
              console.log(`[AppContext] Fetching details for child ${backendChild.id} (${backendChild.name}) ...`)
              const detailResponse = await fetch(`${base}/api/children/${backendChild.id}`, {
                headers,
                signal: controller.signal,
              })
              console.log(`[AppContext] /api/children/${backendChild.id} status:`, detailResponse.status)
              if (detailResponse.ok) {
                const detail = (await detailResponse.json()) as BackendChildDetail
                console.log(`[AppContext] Detail for ${backendChild.name}:`, detail)
                return detail
              } else {
                const errText = await detailResponse.text()
                console.error(`[AppContext] Detail error for ${backendChild.name}:`, errText)
              }
            } catch (err) {
              console.error(`[AppContext] Detail fetch threw for ${backendChild.name}:`, err)
            }
            return { child: backendChild } as BackendChildDetail
          })
        )

        const transformedChildren: Child[] = childrenWithDetails.map((details) => {
          const backendChild = details.child
          const goal = details.goal
          const transactions = details.transactions ?? []
          const savingsBalance = details.savingsBalance ?? 0

          const transformed = {
            id: backendChild.id,
            name: backendChild.name,
            dateOfBirth: backendChild.dateOfBirth ?? "",
            photoUrl: backendChild.photoUrl ?? undefined,
            goal: {
              name: goal?.goalType ?? "Savings Goal",
              targetAmount: goal?.targetAmount ? parseFloat(goal.targetAmount) : 0,
              currentAmount: savingsBalance ? parseFloat(String(savingsBalance)) : 0,
              monthlyContribution: goal?.monthlyContribution ? parseFloat(goal.monthlyContribution) : 0,
              startDate: goal?.createdAt ? goal.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
              targetDate: goal?.targetDate ? goal.targetDate.split("T")[0] : new Date().toISOString().split("T")[0],
              paused: goal?.isPaused ?? false,
              stripeSubscriptionId: goal?.stripeSubscriptionId ?? undefined,
            },
            contributions: transactions.map((tx) => ({
              id: tx.id,
              date: new Date(tx.date).toISOString().split("T")[0],
              amount: parseFloat(tx.amount),
              note: tx.type,
            })),
            investment: details.investment ? mapBackendInvestment(details.investment) : undefined,
            futureInstructions: details.fundDirective
              ? {
                  guardianName: details.fundDirective.guardianName,
                  guardianContact: details.fundDirective.guardianContact,
                  instructions: details.fundDirective.instructions,
                }
              : undefined,
          }

          console.log(`[AppContext] Transformed child "${backendChild.name}":`, transformed)
          return transformed
        })

        console.log("[AppContext] Setting children data:", transformedChildren.length, "children")
        setChildrenData(transformedChildren)

      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[AppContext] Failed to fetch data:", error)
        }
      }
    }

    fetchData()
    return () => controller.abort()
  }, [token])

  // ----- Write operations wired to backend -----

  const addChild = useCallback(
    async (child: Omit<Child, "id" | "contributions" | "investment" | "futureInstructions">) => {
      if (!token) return

      // 1. Create the child
      const childRes = await fetch(apiUrl("/api/children"), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          name: child.name,
          dateOfBirth: child.dateOfBirth || null,
          photoUrl: child.photoUrl || null,
        }),
      })
      if (!childRes.ok) {
        console.error("[AppContext] addChild failed:", await childRes.text())
        return
      }
      const newBackendChild: BackendChild = await childRes.json()

      // 2. Create the goal if provided
      if (child.goal?.targetAmount && child.goal?.targetDate) {
        const goalRes = await fetch(apiUrl(`/api/children/${newBackendChild.id}/goal`), {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({
            goalType: child.goal.name || "General",
            targetAmount: child.goal.targetAmount,
            targetDate: child.goal.targetDate,
            monthlyContribution: child.goal.monthlyContribution ?? 0,
            paused: false,
          }),
        })
        if (!goalRes.ok) {
          console.error("[AppContext] addChild goal failed:", await goalRes.text())
        }
      }

      // 3. Add to local state
      setChildrenData((prev) => [
        ...prev,
        {
          id: newBackendChild.id,
          name: newBackendChild.name,
          dateOfBirth: newBackendChild.dateOfBirth ?? "",
          photoUrl: newBackendChild.photoUrl ?? undefined,
          goal: {
            name: child.goal?.name ?? "Savings Goal",
            targetAmount: child.goal?.targetAmount ?? 0,
            currentAmount: 0,
            monthlyContribution: child.goal?.monthlyContribution ?? 0,
            startDate: new Date().toISOString().split("T")[0],
            targetDate: child.goal?.targetDate ?? new Date().toISOString().split("T")[0],
            paused: false,
          },
          contributions: [],
          investment: undefined,
          futureInstructions: undefined,
        },
      ])
    },
    [token]
  )

  const updateChild = useCallback(
    async (id: string, updates: ChildUpdates) => {
      if (!token) return

      const existing = childrenData.find((c) => c.id === id)
      if (!existing) return

      // 1. Update child profile if name/dob/photo changed
      if (updates.name !== undefined || updates.dateOfBirth !== undefined || updates.photoUrl !== undefined) {
        const childRes = await fetch(apiUrl(`/api/children/${id}`), {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify({
            name: updates.name ?? existing.name,
            dateOfBirth: updates.dateOfBirth ?? (existing.dateOfBirth || null),
            photoUrl: updates.photoUrl ?? existing.photoUrl ?? null,
          }),
        })
        if (!childRes.ok) {
          console.error("[AppContext] updateChild failed:", await childRes.text())
          return
        }
      }

      // 2. Update goal if goal fields changed
      if (updates.goal !== undefined) {
        const mergedGoal = { ...existing.goal, ...updates.goal }
        const goalRes = await fetch(apiUrl(`/api/children/${id}/goal`), {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({
            goalType: mergedGoal.name || "General",
            targetAmount: Number(mergedGoal.targetAmount),
            targetDate: mergedGoal.targetDate?.split("T")[0],
            monthlyContribution: mergedGoal.monthlyContribution ?? 0,
            paused: mergedGoal.paused ?? false,
          }),
        })
        if (!goalRes.ok) {
          console.error("[AppContext] updateChild goal failed:", await goalRes.text())
          return
        }
      }

      // 3. Update local state
      setChildrenData((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          return {
            ...c,
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.dateOfBirth !== undefined && { dateOfBirth: updates.dateOfBirth }),
            ...(updates.photoUrl !== undefined && { photoUrl: updates.photoUrl }),
            ...(updates.goal !== undefined && { goal: { ...c.goal, ...updates.goal } }),
          }
        })
      )
    },
    [token, childrenData]
  )

  const deleteChild = useCallback(
    async (id: string) => {
      if (!token) return

      const res = await fetch(apiUrl(`/api/children/${id}`), {
        method: "DELETE",
        headers: apiHeaders(),
      })
      if (!res.ok) {
        console.error("[AppContext] deleteChild failed:", await res.text())
        return
      }

      setChildrenData((prev) => prev.filter((c) => c.id !== id))
    },
    [token]
  )

  const togglePausedGoal = useCallback(
    async (childId: string) => {
      if (!token) return

      const child = childrenData.find((c) => c.id === childId)
      if (!child || !child.goal) return

      const newPaused = !child.goal.paused
      const res = await fetch(apiUrl(`/api/children/${childId}/goal`), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          goalType: child.goal.name || "General",
          targetAmount: Number(child.goal.targetAmount),
          targetDate: child.goal.targetDate?.split("T")[0],
          monthlyContribution: child.goal.monthlyContribution ?? 0,
          paused: newPaused,
        }),
      })
      if (!res.ok) {
        console.error("[AppContext] togglePausedGoal failed:", await res.text())
        return
      }

      setChildrenData((prev) =>
        prev.map((c) =>
          c.id === childId
            ? { ...c, goal: { ...c.goal, paused: newPaused } }
            : c
        )
      )
    },
    [token, childrenData]
  )

  const addContribution = useCallback(
    async (childId: string, amount: number, note?: string) => {
      if (!token) return

      const res = await fetch(apiUrl(`/api/children/${childId}/contribute`), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) {
        console.error("[AppContext] addContribution failed:", await res.text())
        return
      }
      const tx = await res.json()

      setChildrenData((prev) =>
        prev.map((c) =>
          c.id === childId
            ? {
                ...c,
                goal: { ...c.goal, currentAmount: c.goal.currentAmount + amount },
                contributions: [
                  {
                    id: tx.id ?? String(Date.now()),
                    date: new Date(tx.date ?? Date.now()).toISOString().split("T")[0],
                    amount,
                    note,
                  },
                  ...c.contributions,
                ],
              }
            : c
        )
      )
    },
    [token]
  )

  const setInvestment = useCallback(
    async (childId: string, investment: Investment) => {
      if (!token) return

      const res = await fetch(apiUrl(`/api/children/${childId}/investment`), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          portfolioType: investment.portfolioType.toUpperCase(),
          allocationPercent: investment.allocation.reduce((sum, a) => sum + a.percentage, 0),
        }),
      })
      if (!res.ok) {
        console.error("[AppContext] setInvestment failed:", await res.text())
        return
      }

      setChildrenData((prev) =>
        prev.map((c) => c.id === childId ? { ...c, investment } : c)
      )
    },
    [token]
  )

  const setFutureInstructions = useCallback(
    async (childId: string, instructions: FutureInstructions) => {
      if (!token) return

      const res = await fetch(apiUrl(`/api/children/${childId}/directive`), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          guardianName: instructions.guardianName,
          guardianContact: instructions.guardianContact,
          instructions: instructions.instructions,
        }),
      })
      if (!res.ok) {
        console.error("[AppContext] setFutureInstructions failed:", await res.text())
        return
      }

      setChildrenData((prev) =>
        prev.map((c) => c.id === childId ? { ...c, futureInstructions: instructions } : c)
      )
    },
    [token]
  )

  const getChild = useCallback(
    (id: string) => childrenData.find((c) => c.id === id),
    [childrenData]
  )

  const setStripeSubscriptionId = useCallback(
    (childId: string, subscriptionId: string) => {
      setChildrenData((prev) =>
        prev.map((c) =>
          c.id === childId
            ? { ...c, goal: { ...c.goal, stripeSubscriptionId: subscriptionId } }
            : c
        )
      )
    },
    []
  )

  const recordAutoContribution = useCallback(
    (childId: string, amount: number) => {
      setChildrenData((prev) =>
        prev.map((c) =>
          c.id === childId
            ? {
                ...c,
                goal: { ...c.goal, currentAmount: c.goal.currentAmount + amount },
                contributions: [
                  {
                    id: String(Date.now()),
                    date: new Date().toISOString().split("T")[0],
                    amount,
                  },
                  ...c.contributions,
                ],
              }
            : c
        )
      )
    },
    []
  )

  const totalSavings = childrenData.reduce(
    (sum, c) => sum + c.goal.currentAmount,
    0
  )

  const createPersonalGoal = useCallback(
    async (goalType: string, targetAmount: number, targetDate: string) => {
      if (!token) return
      const res = await fetch(apiUrl("/api/my-goals"), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ goalType, targetAmount, targetDate }),
      })
      if (!res.ok) {
        console.error("[AppContext] createPersonalGoal failed:", await res.text())
        return
      }
      const g = await res.json()
      setPersonalGoals((prev) => [
        ...prev,
        {
          id: String(g.id),
          name: String(g.name),
          targetAmount: parseFloat(String(g.targetAmount)),
          targetDate: String(g.targetDate),
          currentAmount: 0,
          monthsRemaining: Number(g.monthsRemaining ?? 0),
          isPaused: false,
          transactions: [],
        },
      ])
    },
    [token]
  )

  const contributeToPersonalGoal = useCallback(
    async (goalId: string, amount: number) => {
      if (!token) return
      const res = await fetch(apiUrl(`/api/my-goals/${goalId}/contribute`), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) {
        console.error("[AppContext] contributeToPersonalGoal failed:", await res.text())
        return
      }
      const tx = await res.json()
      setPersonalGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: g.currentAmount + amount,
                transactions: [
                  { id: String(tx.id), amount, date: new Date(tx.date ?? Date.now()).toISOString().split("T")[0] },
                  ...g.transactions,
                ],
              }
            : g
        )
      )
    },
    [token]
  )

  const deletePersonalGoal = useCallback(
    async (goalId: string) => {
      if (!token) return
      const res = await fetch(apiUrl(`/api/my-goals/${goalId}`), {
        method: "DELETE",
        headers: apiHeaders(),
      })
      if (!res.ok) {
        console.error("[AppContext] deletePersonalGoal failed:", await res.text())
        return
      }
      setPersonalGoals((prev) => prev.filter((g) => g.id !== goalId))
    },
    [token]
  )

  return (
    <AppContext.Provider
      value={{
        user,
        children: childrenData,
        addChild,
        updateChild,
        deleteChild,
        addContribution,
        togglePausedGoal,
        setInvestment,
        setFutureInstructions,
        getChild,
        setStripeSubscriptionId,
        recordAutoContribution,
        totalSavings,
        personalGoals,
        createPersonalGoal,
        contributeToPersonalGoal,
        deletePersonalGoal,
      }}
    >
      {childrenNode}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
