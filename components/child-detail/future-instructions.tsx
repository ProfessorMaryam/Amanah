"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FutureInstructions as FutureInstructionsType } from "@/lib/types"
import { Shield, User, Phone, FileText, AlertTriangle } from "lucide-react"

export function FutureInstructions({ instructions }: { instructions?: FutureInstructionsType }) {
  if (!instructions) {
    return (
      <Card className="border-0 bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-primary">
            <Shield className="h-6 w-6" />
            Future Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-base text-amanah-sage">
            No future instructions have been set up for this child yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-primary">
          <Shield className="h-6 w-6" />
          Future Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Guardian info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <User className="h-5 w-5 text-amanah-sage" />
            <div>
              <p className="text-sm font-medium text-amanah-sage">Guardian Name</p>
              <p className="text-base font-semibold text-primary">{instructions.guardianName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amanah-cream p-4">
            <Phone className="h-5 w-5 text-amanah-sage" />
            <div>
              <p className="text-sm font-medium text-amanah-sage">Contact</p>
              <p className="text-base font-semibold text-primary">{instructions.guardianContact}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-2 rounded-xl bg-amanah-cream p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amanah-sage" />
            <p className="text-sm font-medium text-amanah-sage">Written Instructions</p>
          </div>
          <p className="text-base leading-relaxed text-amanah-plum">
            {instructions.instructions}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 rounded-xl border-2 border-amanah-rose/20 bg-amanah-rose/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amanah-rose" />
          <p className="text-sm leading-relaxed text-amanah-plum">
            <strong>Important:</strong> This is not a legal will. These instructions serve as a guide for the designated guardian. Please consult a legal professional for formal estate planning.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
