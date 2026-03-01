// Goal types must match Goal.GoalType enum in the backend
export type GoalType = "UNIVERSITY" | "CAR" | "WEDDING" | "BUSINESS" | "GENERAL"

// Portfolio types must match InvestmentPortfolio.PortfolioType enum in the backend
export type PortfolioType = "CONSERVATIVE" | "BALANCED" | "GROWTH"

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
  /** Matches goal_type column / GoalType enum */
  goalType: GoalType
  targetAmount: number
  currentAmount: number
  /** ISO date string from goal.created_at */
  startDate: string
  targetDate: string
  monthlyContribution: number
  isPaused?: boolean
}

export interface Contribution {
  id: string
  date: string
  amount: number
  /** transaction type: MANUAL | AUTO */
  type?: string
}

export interface Investment {
  portfolioType: PortfolioType
  allocationPercentage: number
  currentValue: number
}

export interface FutureInstructions {
  guardianName: string
  guardianContact: string
  /** Matches 'instructions' column in fund_directives table */
  instructions: string
}

export interface User {
  id: string
  name: string
  email: string
  role?: string
}
