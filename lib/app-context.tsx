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
      const fetchData = async () => {
        try {
          const token = session.access_token
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
          
          console.log("[AppContext] Fetching user profile and children...")
          
          // Fetch user profile
          const userResponse = await fetch(`${apiUrl}/api/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Email": session.user?.email || "",
            },
          })
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            console.log("[AppContext] User data received:", userData)
            setUser((prev) => ({
              ...prev,
              name: userData.fullName || prev.name,
            }))
          } else {
            console.error("[AppContext] Failed to fetch user:", userResponse.status)
          }
          
          // Fetch children
          const childrenResponse = await fetch(`${apiUrl}/api/children`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Email": session.user?.email || "",
            },
          })
          
          if (childrenResponse.ok) {
            const childrenList = await childrenResponse.json()
            console.log("[AppContext] Children data received:", childrenList)
            
            // Transform backend data to frontend format
            const transformedChildren: Child[] = childrenList.map((backendChild: any) => ({
              id: backendChild.id,
              name: backendChild.name,
              dateOfBirth: backendChild.dateOfBirth,
              photoUrl: backendChild.photoUrl,
              goal: {
                name: backendChild.goal?.goalType || "Savings Goal",
                targetAmount: backendChild.goal?.targetAmount || 0,
                currentAmount: backendChild.savingsBalance || 0,
                startDate: backendChild.goal?.createdAt || new Date().toISOString().split("T")[0],
                targetDate: backendChild.goal?.targetDate || new Date().toISOString().split("T")[0],
                paused: backendChild.goal?.isPaused || false,
              },
              contributions: (backendChild.transactions || []).map((tx: any) => ({
                id: tx.id,
                date: new Date(tx.date).toISOString().split("T")[0],
                amount: parseFloat(tx.amount),
                note: tx.type,
              })),
              investment: backendChild.investment || undefined,
              futureInstructions: backendChild.futureInstructions || undefined,
            }))
            
            setChildrenData(transformedChildren)
          } else {
            console.error("[AppContext] Failed to fetch children:", childrenResponse.status)
          }
        } catch (error) {
          console.error("[AppContext] Failed to fetch data:", error)
        }
      }
      fetchData()
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
