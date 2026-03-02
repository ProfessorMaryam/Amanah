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
  addChild: (child: Omit<Child, "id" | "contributions" | "investment" | "futureInstructions">) => void
  updateChild: (id: string, updates: ChildUpdates) => void
  deleteChild: (id: string) => void
  addContribution: (childId: string, amount: number, note?: string) => void
  togglePausedGoal: (childId: string) => void
  setInvestment: (childId: string, investment: Investment) => void
  setFutureInstructions: (childId: string, instructions: FutureInstructions) => void
  getChild: (id: string) => Child | undefined
  totalSavings: number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenNode }: { children: ReactNode }) {
  const [user, setUser] = useState(mockUser)
  const [childrenData, setChildrenData] = useState<Child[]>([])
  const { session } = useAuth()

  useEffect(() => {
    if (!session) {
      console.log("[AppContext] No session — loading mock data")
      setChildrenData(mockChildren)
      return
    }

    console.log("[AppContext] Session detected, user:", session.user?.email)

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        const token = session.access_token
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        console.log("[AppContext] API URL:", apiUrl)
        console.log("[AppContext] Token (first 20 chars):", token?.slice(0, 20))

        const headers = {
          Authorization: `Bearer ${token}`,
          "X-User-Email": session.user?.email ?? "",
        }

        // Fetch user profile
        console.log("[AppContext] Fetching /api/me ...")
        const userResponse = await fetch(`${apiUrl}/api/me`, { headers, signal: controller.signal })
        console.log("[AppContext] /api/me status:", userResponse.status)
        if (userResponse.ok) {
          const userData: BackendUser = await userResponse.json()
          console.log("[AppContext] /api/me response:", userData)
          setUser((prev) => ({ ...prev, name: userData.fullName ?? prev.name }))
        } else {
          const errText = await userResponse.text()
          console.error("[AppContext] /api/me error body:", errText)
        }

        // Fetch children list
        console.log("[AppContext] Fetching /api/children ...")
        const childrenResponse = await fetch(`${apiUrl}/api/children`, { headers, signal: controller.signal })
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
              const detailResponse = await fetch(`${apiUrl}/api/children/${backendChild.id}`, {
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
              targetDate: goal?.targetDate ?? new Date().toISOString().split("T")[0],
              paused: goal?.isPaused ?? false,
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
  }, [session])

  const addChild = useCallback(
    (child: Omit<Child, "id" | "contributions" | "investment" | "futureInstructions">) => {
      const newChild: Child = {
        ...child,
        id: String(Date.now()),
        contributions: [],
        investment: undefined,
        futureInstructions: undefined,
      }
      setChildrenData((prev) => [...prev, newChild])
    },
    []
  )

  const updateChild = useCallback((id: string, updates: ChildUpdates) => {
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
  }, [])

  const deleteChild = useCallback((id: string) => {
    setChildrenData((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const togglePausedGoal = useCallback((childId: string) => {
    setChildrenData((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, goal: { ...c.goal, paused: !c.goal.paused } }
          : c
      )
    )
  }, [])

  const addContribution = useCallback(
    (childId: string, amount: number, note?: string) => {
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
                    note,
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

  const setInvestment = useCallback((childId: string, investment: Investment) => {
    setChildrenData((prev) =>
      prev.map((c) => c.id === childId ? { ...c, investment } : c)
    )
  }, [])

  const setFutureInstructions = useCallback((childId: string, instructions: FutureInstructions) => {
    setChildrenData((prev) =>
      prev.map((c) => c.id === childId ? { ...c, futureInstructions: instructions } : c)
    )
  }, [])

  const getChild = useCallback(
    (id: string) => childrenData.find((c) => c.id === id),
    [childrenData]
  )

  const totalSavings = childrenData.reduce(
    (sum, c) => sum + c.goal.currentAmount,
    0
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
        totalSavings,
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
