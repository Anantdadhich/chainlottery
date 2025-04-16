"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import ThreeBackground from "@/components/three-background"
import LotteryBall from "@/components/lottery-ball"
import CountdownTimer from "@/components/countdown-timer"
import Link from "next/link"
import { useCharityLotteryProgram, getLotteryData } from "@/lib/anchor-client"

export default function Home() {
  const { connected } = useWallet()
  const program = useCharityLotteryProgram()
  const [prizePool, setPrizePool] = useState(100)
  const [endTime, setEndTime] = useState(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now

  useEffect(() => {
    if (program) {
      const fetchLotteryData = async () => {
        const data = await getLotteryData(program)
        if (data) {
          const { lotteryData } = data
          // Calculate prize pool based on ticket price and number of participants
          const calculatedPrizePool =
            (lotteryData.ticketPrice.toNumber() * lotteryData.participants.length) / 1_000_000_000 // Convert lamports to SOL
          setPrizePool(calculatedPrizePool)

          // Set end time
          setEndTime(lotteryData.endTime.toNumber() * 1000) // Convert seconds to milliseconds
        }
      }

      fetchLotteryData()

      // Poll for updates
      const interval = setInterval(fetchLotteryData, 10000)
      return () => clearInterval(interval)
    }
  }, [program])

  return (
    <main className="min-h-screen">
      <ThreeBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 gradient-text glow-text">
                Join the Charity Lottery
              </h1>
              <p className="text-xl mb-8 text-gray-300 max-w-lg">
                Win Prizes, Support Causes. A decentralized lottery on Solana blockchain where everyone wins by giving
                back.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity"
                >
                  <Link href="/lottery">
                    Buy Tickets <ArrowRight className="ml-2" size={18} />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary/50 hover:border-primary transition-colors"
                >
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>

              <div className="mt-10">
                <p className="text-gray-400 mb-2">Current round ends in:</p>
                <CountdownTimer endTime={endTime} />
              </div>
            </div>

            <div className="lg:w-1/2">
              <LotteryBall prizePool={prizePool} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles size={24} className="text-primary" />}
              title="Transparent Lottery"
              description="All transactions are recorded on the Solana blockchain, ensuring complete transparency and fairness."
            />
            <FeatureCard
              icon={<Sparkles size={24} className="text-primary" />}
              title="Charity Impact"
              description="10% of each prize pool is donated to a charity selected by the community through voting."
            />
            <FeatureCard
              icon={<Sparkles size={24} className="text-primary" />}
              title="Community Voting"
              description="Vote on which charity receives donations in the next round. Your voice matters!"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Ready to Win Big and Give Back?</h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of players who are winning prizes while making a difference. Every ticket counts!
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity"
          >
            <Link href="/lottery">
              Get Started <ArrowRight className="ml-2" size={18} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400">© 2025 Charity Lottery. Powered by Solana.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                Docs
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="glass-card hover:glow transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  )
}
