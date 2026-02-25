import type { Child, User } from "./types"

export const mockUser: User = {
  id: "1",
  name: "Sarah",
  email: "sarah@example.com",
}

export const mockChildren: Child[] = [
  {
    id: "1",
    name: "Aisha",
    dateOfBirth: "2015-03-12",
    goal: {
      name: "University Fund",
      targetAmount: 50000,
      currentAmount: 18750,
      startDate: "2020-01-01",
      targetDate: "2033-09-01",
      paused: false,
    },
    contributions: [
      { id: "c1", date: "2026-02-01", amount: 500, note: "Monthly savings" },
      { id: "c2", date: "2026-01-01", amount: 500, note: "Monthly savings" },
      { id: "c3", date: "2025-12-01", amount: 750, note: "Bonus contribution" },
      { id: "c4", date: "2025-11-01", amount: 500, note: "Monthly savings" },
      { id: "c5", date: "2025-10-01", amount: 500, note: "Monthly savings" },
      { id: "c6", date: "2025-09-01", amount: 500, note: "Monthly savings" },
    ],
    investment: {
      active: true,
      allocation: [
        { label: "Bonds", percentage: 40 },
        { label: "Index Funds", percentage: 35 },
        { label: "Savings Account", percentage: 25 },
      ],
      currentValue: 21200,
      growthPercentage: 6.2,
    },
    futureInstructions: {
      guardianName: "Ahmed Rahman",
      guardianContact: "+60 12-345-6789",
      notes: "Please ensure the funds are used for Aisha's higher education. If she decides not to pursue university, the funds can be used for vocational training or starting a small business.",
    },
  },
  {
    id: "2",
    name: "Yusuf",
    dateOfBirth: "2018-07-22",
    goal: {
      name: "Education Savings",
      targetAmount: 30000,
      currentAmount: 8400,
      startDate: "2021-06-01",
      targetDate: "2036-06-01",
      paused: false,
    },
    contributions: [
      { id: "c7", date: "2026-02-01", amount: 300, note: "Monthly savings" },
      { id: "c8", date: "2026-01-01", amount: 300, note: "Monthly savings" },
      { id: "c9", date: "2025-12-01", amount: 300, note: "Monthly savings" },
      { id: "c10", date: "2025-11-01", amount: 500, note: "Birthday bonus" },
      { id: "c11", date: "2025-10-01", amount: 300, note: "Monthly savings" },
    ],
    investment: {
      active: true,
      allocation: [
        { label: "Bonds", percentage: 50 },
        { label: "Index Funds", percentage: 30 },
        { label: "Savings Account", percentage: 20 },
      ],
      currentValue: 9100,
      growthPercentage: 4.8,
    },
    futureInstructions: {
      guardianName: "Ahmed Rahman",
      guardianContact: "+60 12-345-6789",
      notes: "Funds are for Yusuf's education and early career development.",
    },
  },
  {
    id: "3",
    name: "Hana",
    dateOfBirth: "2020-11-05",
    goal: {
      name: "Future Fund",
      targetAmount: 25000,
      currentAmount: 4200,
      startDate: "2022-01-01",
      targetDate: "2038-11-01",
      paused: false,
    },
    contributions: [
      { id: "c12", date: "2026-02-01", amount: 200, note: "Monthly savings" },
      { id: "c13", date: "2026-01-01", amount: 200, note: "Monthly savings" },
      { id: "c14", date: "2025-12-01", amount: 200, note: "Monthly savings" },
      { id: "c15", date: "2025-11-01", amount: 200, note: "Monthly savings" },
    ],
    investment: undefined,
    futureInstructions: undefined,
  },
  {
    id: "4",
    name: "Omar",
    dateOfBirth: "2012-01-15",
    goal: {
      name: "Car Fund",
      targetAmount: 15000,
      currentAmount: 12800,
      startDate: "2022-01-01",
      targetDate: "2030-01-01",
      paused: false,
    },
    contributions: [
      { id: "c16", date: "2026-02-01", amount: 400, note: "Monthly savings" },
      { id: "c17", date: "2026-01-01", amount: 400, note: "Monthly savings" },
      { id: "c18", date: "2025-12-01", amount: 400, note: "Monthly savings" },
    ],
    investment: {
      active: true,
      allocation: [
        { label: "Savings Account", percentage: 70 },
        { label: "Bonds", percentage: 30 },
      ],
      currentValue: 13500,
      growthPercentage: 3.1,
    },
    futureInstructions: {
      guardianName: "Fatimah Ali",
      guardianContact: "+60 13-987-6543",
      notes: "Omar's car fund for when he turns 18. He should have a say in the decision.",
    },
  },
]
