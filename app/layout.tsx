import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Amanah - Family Savings Planner',
  description: 'A calm, trustworthy family savings planner for parents. Plan and track savings goals for your children.',
  icons: {
    icon: '/amanah.png',
    apple: '/amanah.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#fdf5eb',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
