import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Metadata } from "next"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontLogo = Fraunces({
  subsets: ["latin"],
  variable: "--font-logo",
})

export const metadata: Metadata = {
  title: {
    default: "Sandbox — Build physics simulations with AI",
    template: "%s · Sandbox",
  },
  description:
    "Describe a physical scenario and watch it run. Sandbox is an agentic simulation builder that settles the inputs with you, writes the code, and shows the result with its assumptions, limitations and verification status alongside it.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontLogo.variable
      )}
    >
      <body>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
