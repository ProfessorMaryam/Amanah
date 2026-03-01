"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Child, GoalType, FutureInstructions, PortfolioType } from "./types"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// ---------- helpers ----------

async function getFreshToken(): Promise<{ token: string; email: string } | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return { token: session.access_token, email: session.user?.email ?? "" }
}

function authHeaders(token: string, email?: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(email ? { "X-User-Email": email } : {}),
  }
}

/** Transform the backend detail response into a frontend Child object. */
function transformChild(details: any): Child {
  const backendChild = details.child
  const goal = details.goal
  const transactions: any[] = details.transactions || []
  const savingsBalance = details.savingsBalance || 0
  const investment = details.investment
  const fundDirective = details.fundDirective

  console.log("[AppContext] transformChild id=%s hasGoal=%s hasInvestment=%s hasDirective=%s",
    backendChild?.id, !!goal, !!investment, !!fundDirective)

  return {
    id: backendChild.id,
    name: backendChild.name,
    dateOfBirth: backendChild.dateOfBirth,
    photoUrl: backendChild.photoUrl,
    goal: {
      goalType: (goal?.goalType ?? "GENERAL") as GoalType,
      targetAmount: goal?.targetAmount ? parseFloat(goal.targetAmount) : 0,
      currentAmount: savingsBalance ? parseFloat(savingsBalance) : 0,
      startDate: goal?.createdAt ? goal.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      targetDate: goal?.targetDate ?? new Date().toISOString().split("T")[0],
      monthlyContribution: goal?.monthlyContribution ? parseFloat(goal.monthlyContribution) : 0,
      isPaused: goal?.isPaused ?? false,
    },
    contributions: transactions.map((tx: any) => ({
      id: tx.id,
      date: new Date(tx.date).toISOString().split("T")[0],
      amount: parseFloat(tx.amount),
      type: tx.type,
    })),
    investment: investment
      ? {
          portfolioType: investment.portfolioType as PortfolioType,
          allocationPercentage: investment.allocationPercentage,
          currentValue: investment.currentValue ? parseFloat(investment.currentValue) : 0,
        }
      : undefined,
    futureInstructions: fundDirective
      ? {
          guardianName: fundDirective.guardianName ?? "",
          guardianContact: fundDirective.guardianContact ?? "",
          instructions: fundDirective.instructions ?? "",
        }
      : undefined,
  }
}

// ---------- context types ----------

interface ChildUpdates {
  name?: string
  dateOfBirth?: string
  photoUrl?: string
}

interface GoalUpdates {
  goalType: GoalType
  targetAmount: number
  targetDate: string
  monthlyContribution?: number
  isPaused?: boolean
}

interface AppContextType {
  user: { id: string; name: string; email: string; role?: string }
  children: Child[]
  /** Populated when the logged-in user has role "child" — their own savings goal. */
  myGoal: Child | null
  loading: boolean
  addChild: (name: string, dateOfBirth: string, goalType: GoalType, targetAmount: number, targetDate: string) => Promise<void>
  updateChild: (id: string, updates: ChildUpdates) => Promise<void>
  deleteChild: (id: string) => Promise<void>
  addContribution: (childId: string, amount: number) => Promise<void>
  setGoal: (childId: string, goal: GoalUpdates) => Promise<void>
  togglePausedGoal: (childId: string) => Promise<void>
  setInvestment: (childId: string, portfolioType: PortfolioType, allocationPercent: number) => Promise<void>
  setFutureInstructions: (childId: string, instructions: FutureInstructions) => Promise<void>
  getChild: (id: string) => Child | undefined
  totalSavings: number
  refreshChild: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenNode }: { children: ReactNode }) {
  const [user, setUser] = useState({ id: "", name: "", email: "", role: "parent" })
  const [childrenData, setChildrenData] = useState<Child[]>([])
  const [myGoal, setMyGoal] = useState<Child | null>(null)
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  // ---------- fetch helpers ----------

  const fetchChildDetail = useCallback(async (childId: string, token: string, email: string): Promise<Child | null> => {
    try {
      console.log("[AppContext] fetchChildDetail childId=%s", childId)
      const res = await fetch(`${API_URL}/api/children/${childId}`, {
        headers: authHeaders(token, email),
      })
      if (!res.ok) {
        console.error("[AppContext] fetchChildDetail failed status=%d childId=%s", res.status, childId)
        return null
      }
      const data = await res.json()
      return transformChild(data)
    } catch (e) {
      console.error("[AppContext] fetchChildDetail error childId=%s", childId, e)
      return null
    }
  }, [])

  // ---------- initial load ----------

  useEffect(() => {
    if (!session) return

    const load = async () => {
      setLoading(true)
      const creds = await getFreshToken()
      if (!creds) {
        console.error("[AppContext] No valid session, aborting load")
        setLoading(false)
        return
      }
      const { token, email } = creds
      console.log("[AppContext] Session detected, loading user and children...")

      try {
        // User profile
        const userRes = await fetch(`${API_URL}/api/me`, {
          headers: authHeaders(token, email),
        })
        if (!userRes.ok) {
          console.error("[AppContext] Failed to load user status=%d", userRes.status)
          return
        }
        const userData = await userRes.json()
        const role = userData.role ?? "parent"
        console.log("[AppContext] User loaded id=%s name=%s role=%s", userData.id, userData.fullName, role)
        const loadedUser = {
          id: userData.id ?? "",
          name: userData.fullName ?? "",
          email: userData.email ?? email,
          role,
        }
        setUser(loadedUser)

        if (role === "child") {
          // Child users: fetch their own goal via /api/me/goal
          console.log("[AppContext] Child role detected, fetching own goal...")
          const goalRes = await fetch(`${API_URL}/api/me/goal`, {
            headers: authHeaders(token, email),
          })
          if (goalRes.ok) {
            const data = await goalRes.json()
            if (data && data.child) {
              setMyGoal(transformChild(data))
              console.log("[AppContext] myGoal loaded for child user")
            }
          } else {
            console.error("[AppContext] Failed to load myGoal status=%d", goalRes.status)
          }
        } else {
          // Parent/admin users: fetch children list
          const listRes = await fetch(`${API_URL}/api/children`, {
            headers: authHeaders(token, email),
          })
          if (!listRes.ok) {
            console.error("[AppContext] Failed to load children status=%d", listRes.status)
            return
          }
          const list: any[] = await listRes.json()
          console.log("[AppContext] Loaded %d children from list", list.length)

          const detailed = await Promise.all(
            list.map((c) => fetchChildDetail(c.id, token, email))
          )
          const valid = detailed.filter((c): c is Child => c !== null)
          console.log("[AppContext] %d children with full details loaded", valid.length)
          setChildrenData(valid)
        }
      } catch (e) {
        console.error("[AppContext] Load error:", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session, fetchChildDetail])

  // ---------- refreshChild ----------

  const refreshChild = useCallback(async (id: string) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] refreshChild id=%s", id)
    const updated = await fetchChildDetail(id, token, email)
    if (updated) {
      setChildrenData((prev) => prev.map((c) => (c.id === id ? updated : c)))
    }
  }, [fetchChildDetail])

  // ---------- mutations ----------

  const addChild = useCallback(async (
    name: string,
    dateOfBirth: string,
    goalType: GoalType,
    targetAmount: number,
    targetDate: string,
  ) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] addChild name=%s goalType=%s target=%d", name, goalType, targetAmount)

    // 1. Create child
    const childRes = await fetch(`${API_URL}/api/children`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({ name, dateOfBirth }),
    })
    if (!childRes.ok) {
      console.error("[AppContext] addChild failed status=%d body=%s", childRes.status, await childRes.text())
      throw new Error(`Failed to create child: ${childRes.status}`)
    }
    const newChild = await childRes.json()
    console.log("[AppContext] Child created id=%s, setting goal...", newChild.id)

    // 2. Set initial goal
    const goalRes = await fetch(`${API_URL}/api/children/${newChild.id}/goal`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({ goalType, targetAmount, targetDate, paused: false }),
    })
    if (!goalRes.ok) {
      console.error("[AppContext] setGoal after addChild failed status=%d", goalRes.status)
    } else {
      console.log("[AppContext] Goal set for new child id=%s", newChild.id)
    }

    // 3. Load full details and add to state
    const detail = await fetchChildDetail(newChild.id, token, email)
    if (detail) {
      setChildrenData((prev) => [...prev, detail])
    }
  }, [fetchChildDetail])

  const updateChild = useCallback(async (id: string, updates: ChildUpdates) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    const current = childrenData.find((c) => c.id === id)
    if (!current) return
    console.log("[AppContext] updateChild id=%s", id)

    const res = await fetch(`${API_URL}/api/children/${id}`, {
      method: "PUT",
      headers: authHeaders(token, email),
      body: JSON.stringify({
        name: updates.name ?? current.name,
        dateOfBirth: updates.dateOfBirth ?? current.dateOfBirth,
        photoUrl: updates.photoUrl ?? current.photoUrl,
      }),
    })
    if (!res.ok) {
      console.error("[AppContext] updateChild failed status=%d", res.status)
      throw new Error(`Failed to update child: ${res.status}`)
    }
    console.log("[AppContext] Child updated id=%s, refreshing...", id)
    await refreshChild(id)
  }, [childrenData, refreshChild])

  const deleteChild = useCallback(async (id: string) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] deleteChild id=%s", id)

    const res = await fetch(`${API_URL}/api/children/${id}`, {
      method: "DELETE",
      headers: authHeaders(token, email),
    })
    if (!res.ok) {
      console.error("[AppContext] deleteChild failed status=%d", res.status)
      throw new Error(`Failed to delete child: ${res.status}`)
    }
    console.log("[AppContext] Child deleted id=%s", id)
    setChildrenData((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addContribution = useCallback(async (childId: string, amount: number) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] addContribution childId=%s amount=%d", childId, amount)

    const res = await fetch(`${API_URL}/api/children/${childId}/contribute`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({ amount }),
    })
    if (!res.ok) {
      console.error("[AppContext] addContribution failed status=%d", res.status)
      throw new Error(`Failed to add contribution: ${res.status}`)
    }
    console.log("[AppContext] Contribution added for childId=%s, refreshing...", childId)
    await refreshChild(childId)
  }, [refreshChild])

  const setGoal = useCallback(async (childId: string, goal: GoalUpdates) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] setGoal childId=%s type=%s", childId, goal.goalType)

    const res = await fetch(`${API_URL}/api/children/${childId}/goal`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({
        goalType: goal.goalType,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        monthlyContribution: goal.monthlyContribution ?? null,
        paused: goal.isPaused ?? false,
      }),
    })
    if (!res.ok) {
      console.error("[AppContext] setGoal failed status=%d", res.status)
      throw new Error(`Failed to set goal: ${res.status}`)
    }
    console.log("[AppContext] Goal saved for childId=%s, refreshing...", childId)
    await refreshChild(childId)
  }, [refreshChild])

  const togglePausedGoal = useCallback(async (childId: string) => {
    const child = childrenData.find((c) => c.id === childId)
    if (!child) return
    console.log("[AppContext] togglePausedGoal childId=%s currentlyPaused=%s", childId, child.goal.isPaused)
    await setGoal(childId, {
      goalType: child.goal.goalType,
      targetAmount: child.goal.targetAmount,
      targetDate: child.goal.targetDate,
      monthlyContribution: child.goal.monthlyContribution,
      isPaused: !child.goal.isPaused,
    })
  }, [childrenData, setGoal])

  const setInvestment = useCallback(async (childId: string, portfolioType: PortfolioType, allocationPercent: number) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] setInvestment childId=%s type=%s alloc=%d", childId, portfolioType, allocationPercent)

    const res = await fetch(`${API_URL}/api/children/${childId}/investment`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({ portfolioType, allocationPercent }),
    })
    if (!res.ok) {
      console.error("[AppContext] setInvestment failed status=%d", res.status)
      throw new Error(`Failed to set investment: ${res.status}`)
    }
    console.log("[AppContext] Investment saved for childId=%s, refreshing...", childId)
    await refreshChild(childId)
  }, [refreshChild])

  const setFutureInstructions = useCallback(async (childId: string, instructions: FutureInstructions) => {
    const creds = await getFreshToken()
    if (!creds) return
    const { token, email } = creds
    console.log("[AppContext] setFutureInstructions childId=%s guardian=%s", childId, instructions.guardianName)

    const res = await fetch(`${API_URL}/api/children/${childId}/directive`, {
      method: "POST",
      headers: authHeaders(token, email),
      body: JSON.stringify({
        guardianName: instructions.guardianName,
        guardianContact: instructions.guardianContact,
        instructions: instructions.instructions,
      }),
    })
    if (!res.ok) {
      console.error("[AppContext] setFutureInstructions failed status=%d", res.status)
      throw new Error(`Failed to save directive: ${res.status}`)
    }
    console.log("[AppContext] Directive saved for childId=%s, refreshing...", childId)
    await refreshChild(childId)
  }, [refreshChild])

  const getChild = useCallback(
    (id: string) => childrenData.find((c) => c.id === id),
    [childrenData]
  )

  const totalSavings = childrenData.reduce((sum, c) => sum + c.goal.currentAmount, 0)

  return (
    <AppContext.Provider
      value={{
        user,
        children: childrenData,
        myGoal,
        loading,
        addChild,
        updateChild,
        deleteChild,
        addContribution,
        setGoal,
        togglePausedGoal,
        setInvestment,
        setFutureInstructions,
        getChild,
        totalSavings,
        refreshChild,
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
