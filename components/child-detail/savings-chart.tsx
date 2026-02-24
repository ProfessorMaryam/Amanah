"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Contribution } from "@/lib/types"
import { BarChart3 } from "lucide-react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface SavingsChartProps {
  contributions: Contribution[]
  currentAmount: number
}

export function SavingsChart({ contributions, currentAmount }: SavingsChartProps) {
  // Build cumulative data from oldest to newest
  const sorted = [...contributions].reverse()
  let cumulative = currentAmount
  // Walk backwards from current to rebuild history
  for (const c of [...contributions]) {
    cumulative -= c.amount
  }

  const data = sorted.map((c) => {
    cumulative += c.amount
    const date = new Date(c.date)
    return {
      month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      total: cumulative,
    }
  })

  if (data.length === 0) {
    return (
      <Card className="border-0 bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-primary">
            <BarChart3 className="h-6 w-6" />
            Savings Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-base text-amanah-sage">
            No contribution data yet. Add contributions to see your savings growth chart.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <BarChart3 className="h-6 w-6" />
          Savings Growth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd0" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#82918a", fontSize: 14 }}
                axisLine={{ stroke: "#e8ddd0" }}
              />
              <YAxis
                tick={{ fill: "#82918a", fontSize: 14 }}
                axisLine={{ stroke: "#e8ddd0" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Total Saved"]}
                contentStyle={{
                  backgroundColor: "#fdf5eb",
                  border: "1px solid #e8ddd0",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#2e4874",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8fbac9"
                strokeWidth={3}
                dot={{ fill: "#2e4874", r: 5, strokeWidth: 0 }}
                activeDot={{ fill: "#2e4874", r: 7, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
