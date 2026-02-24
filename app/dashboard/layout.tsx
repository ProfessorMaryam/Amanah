import { AppProvider } from "@/lib/app-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppProvider>{children}</AppProvider>
}
