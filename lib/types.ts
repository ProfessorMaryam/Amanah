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
  startDate: string
  targetDate: string
  paused?: boolean
}

export interface Contribution {
  id: string
  date: string
  amount: number
  note?: string
}

export interface Investment {
  active: boolean
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
  notes: string
}

export interface User {
  id: string
  name: string
  email: string
}
