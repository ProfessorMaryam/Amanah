"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Heart className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Amanah
          </h1>
          <p className="text-center text-lg text-amanah-plum">
            Your family savings planner
          </p>
        </div>

        <Card className="border-0 bg-card shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-primary">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-base text-amanah-sage">
              {isLogin
                ? "Sign in to manage your family savings"
                : "Start planning your family's financial future"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {!isLogin && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-base font-medium text-amanah-plum">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-base bg-amanah-cream border-input"
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-base font-medium text-amanah-plum">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-base font-medium text-amanah-plum">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base bg-amanah-cream border-input"
                  required
                />
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 text-lg font-semibold"
                size="lg"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-base font-medium text-secondary hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Register"
                  : "Already have an account? Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
