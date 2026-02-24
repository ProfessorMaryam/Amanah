"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Contribution } from "@/lib/types"
import { History } from "lucide-react"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ContributionHistory({ contributions }: { contributions: Contribution[] }) {
  return (
    <Card className="border-0 bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <History className="h-6 w-6" />
          Contribution History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contributions.length === 0 ? (
          <p className="py-8 text-center text-base text-amanah-sage">
            No contributions recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-amanah-peach hover:bg-transparent">
                <TableHead className="text-base font-semibold text-primary">Date</TableHead>
                <TableHead className="text-base font-semibold text-primary">Amount</TableHead>
                <TableHead className="text-base font-semibold text-primary">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((c) => (
                <TableRow key={c.id} className="border-amanah-peach/50">
                  <TableCell className="py-4 text-base text-amanah-plum">
                    {formatDate(c.date)}
                  </TableCell>
                  <TableCell className="py-4 text-base font-semibold text-primary">
                    {formatCurrency(c.amount)}
                  </TableCell>
                  <TableCell className="py-4 text-base text-amanah-sage">
                    {c.note || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
