export interface Child {
  id: string
  name: string
  dateOfBirth: string
  photoUrl?: string
  goal: SavingsGoal
  contributions: Contribution[]
  investment?: Investment
  futureInstructions?: FutureInstructions
}

export interface SavingsGoal {
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  startDate: string
  targetDate: string
  paused?: boolean
  stripeSubscriptionId?: string
}

export interface Contribution {
  id: string
  date: string
  amount: number
  note?: string
}

export interface Investment {
  active: boolean
  portfolioType: string
  allocation: {
    label: string
    percentage: number
  }[]
  currentValue: number
  growthPercentage: number
}

export interface FutureInstructions {
  guardianName: string
  guardianContact: string
  instructions: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "parent" | "child"
}
