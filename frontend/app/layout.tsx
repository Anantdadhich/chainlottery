import type React from "react"
import type { Metadata } from "next"
import { Edu_AU_VIC_WA_NT_Pre } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletContextProvider } from "@/components/wallet-provider"

const inter = Edu_AU_VIC_WA_NT_Pre({ subsets: ["latin"],  weight: ["400"],         // adjust as needed
  style: ["normal"],   })

export const metadata: Metadata = {
  title: "Chain Lottery | Win Big, Give Back",
  description: "A decentralized lottery on Solana blockchain supporting charitable causes"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <WalletContextProvider>{children}</WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
