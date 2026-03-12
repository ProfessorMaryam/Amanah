"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useApp } from "@/lib/app-context"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8742"
  return `${base}${path}`
}

interface SetupFormProps {
  childId: string
  customerId: string
  onSuccess: () => void
  token: string
}

function SetupForm({ childId, customerId, onSuccess, token }: SetupFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { setStripeSubscriptionId } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    })

    if (result.error) {
      setError(result.error.message ?? "Payment setup failed")
      setLoading(false)
      return
    }

    const pm = result.setupIntent?.payment_method
    const paymentMethodId = typeof pm === "string" ? pm : (pm as any)?.id as string | undefined
    if (!paymentMethodId) {
      setError("No payment method returned")
      setLoading(false)
      return
    }

    const res = await fetch(apiUrl(`/api/stripe/subscribe/${childId}`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentMethodId, customerId }),
    })

    if (!res.ok) {
      setError("Failed to activate subscription")
      setLoading(false)
      return
    }

    const { subscriptionId } = await res.json()
    setStripeSubscriptionId(childId, subscriptionId)
    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Setting up…" : "Activate monthly payments"}
      </Button>
    </form>
  )
}

interface PaymentSetupDialogProps {
  childId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentSetupDialog({ childId, open, onOpenChange }: PaymentSetupDialogProps) {
  const { token } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !token) return
    setClientSecret(null)
    setSuccess(false)
    setLoadError(null)

    fetch(apiUrl("/api/stripe/setup-intent"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to create setup intent")
        return r.json()
      })
      .then((data) => {
        setClientSecret(data.clientSecret)
        setCustomerId(data.customerId)
      })
      .catch((err) => setLoadError(err.message))
  }, [open, token])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Set up monthly payments</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-lg font-semibold text-accent-foreground">Payments activated!</p>
            <p className="text-sm text-amanah-sage">
              Monthly contributions will be charged automatically.
            </p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : loadError ? (
          <p className="py-4 text-sm text-destructive">{loadError}</p>
        ) : !clientSecret ? (
          <p className="py-4 text-sm text-amanah-sage">Loading payment form…</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SetupForm
              childId={childId}
              customerId={customerId}
              onSuccess={() => setSuccess(true)}
              token={token!}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
