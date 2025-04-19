"use client"

import { useState } from "react"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { connected } = useWallet()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-black font-bold">CL</span>
              </div>
              <span className="ml-2 text-xl font-bold text-white">Chain Lottery</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <NavLink href="/" label="Home" />
              <NavLink href="/lottery" label="Lottery" />
              <NavLink href="/voting" label="Voting" />
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/about" label="About" />
            </div>
          </div>

          <div className="hidden md:block">
            <WalletMultiButton
              className={cn(
                "!bg-black/50 !hover:bg-black/70 !transition-all !duration-200",
                "!border !border-primary/50 !rounded-lg !text-white !font-medium",
                connected && "!border-primary !glow",
              )}
            />
          </div>

          <div className="md:hidden flex items-center">
            <WalletMultiButton
              className={cn(
                "!bg-black/50 !hover:bg-black/70 !transition-all !duration-200 !mr-2",
                "!border !border-primary/50 !rounded-lg !text-white !font-medium !py-1 !px-2",
                connected && "!border-primary !glow",
              )}
            />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-primary focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/" label="Home" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/lottery" label="Lottery" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/voting" label="Voting" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/dashboard" label="Dashboard" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/about" label="About" onClick={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  )
}

interface NavLinkProps {
  href: string
  label: string
}

function NavLink({ href, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    >
      {label}
    </Link>
  )
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void
}

function MobileNavLink({ href, label, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className="text-gray-300 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
      onClick={onClick}
    >
      {label}
    </Link>
  )
}
