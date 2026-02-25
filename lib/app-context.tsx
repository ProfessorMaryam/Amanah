"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Child, Investment, FutureInstructions } from "./types"
import { mockChildren, mockUser } from "./mock-data"
import { useAuth } from "./auth-context"

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
  const [childrenData, setChildrenData] = useState<Child[]>(mockChildren)
  const { session } = useAuth()

  useEffect(() => {
    if (session) {
      const fetchUser = async () => {
        try {
          const token = session.access_token
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
          
          console.log("[AppContext] Fetching user profile...")
          console.log("[AppContext] API URL:", apiUrl)
          console.log("[AppContext] Token exists:", !!token)
          console.log("[AppContext] Token length:", token?.length)
          console.log("[AppContext] Token preview:", token?.substring(0, 50) + "...")
          console.log("[AppContext] User email:", session.user?.email)
          
          const response = await fetch(`${apiUrl}/api/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Email": session.user?.email || "",
            },
          })
          
          console.log("[AppContext] Response status:", response.status)
          console.log("[AppContext] Response ok:", response.ok)
          console.log("[AppContext] Response headers:", {
            "content-type": response.headers.get("content-type"),
          })
          
          const responseText = await response.text()
          console.log("[AppContext] Raw response body:", responseText)
          
          if (response.ok) {
            const userData = JSON.parse(responseText)
            console.log("[AppContext] User data received:", userData)
            setUser((prev) => ({
              ...prev,
              name: userData.fullName || prev.name,
            }))
          } else {
            console.error("[AppContext] Error response (status:", response.status + "):", responseText)
          }
        } catch (error) {
          console.error("[AppContext] Failed to fetch user:", error)
        }
      }
      fetchUser()
    }
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
