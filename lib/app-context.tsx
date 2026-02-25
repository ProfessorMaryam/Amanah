"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Child } from "./types"
import { mockChildren, mockUser } from "./mock-data"

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
  getChild: (id: string) => Child | undefined
  totalSavings: number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children: childrenNode }: { children: ReactNode }) {
  const [childrenData, setChildrenData] = useState<Child[]>(mockChildren)

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
        user: mockUser,
        children: childrenData,
        addChild,
        updateChild,
        deleteChild,
        addContribution,
        togglePausedGoal,
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
