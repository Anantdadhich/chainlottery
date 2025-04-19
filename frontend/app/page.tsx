"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { ArrowRight, Sparkles, Gift, ChevronDown, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const [participants, setParticipants] = useState(0)
  const [endTime, setEndTime] = useState(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (program) {
      const fetchLotteryData = async () => {
        setIsLoading(true)
        try {
          const data = await getLotteryData(program)
          if (data) {
            const { lotteryData } = data
            // Calculate prize pool based on ticket price and number of participants
            const calculatedPrizePool =
              (lotteryData.ticketPrice.toNumber() * lotteryData.participants) / 1_000_000_000 // Convert lamports to SOL
            setPrizePool(calculatedPrizePool)
            setParticipants(lotteryData.participants)

            // Set end time
            setEndTime(lotteryData.endTime.toNumber() * 1000) // Convert seconds to milliseconds
          }
        } catch (error) {
          console.error("Error fetching lottery data:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchLotteryData()

      // Poll for updates
      const interval = setInterval(fetchLotteryData, 10000)
      return () => clearInterval(interval)
    }
  }, [program])

  return (
    <main className="min-h-screen relative overflow-hidden">
      <ThreeBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <Badge className="mb-4 bg-purple-600/30 text-purple-200 border-purple-500 py-1">
                Round #{Math.floor(Math.random() * 100)} Now Live
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 gradient-text glow-text">
                Join the Chain Lottery
              </h1>
              <p className="text-xl mb-8 text-gray-300 max-w-lg">
                Win Prizes, Support Causes. A decentralized lottery on Solana blockchain where everyone wins by giving
                back.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity relative overflow-hidden group"
                >
                  <Link href="/lottery">
                    Buy Tickets <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    <span className="absolute -top-full left-0 w-full h-full bg-white/20 group-hover:translate-y-full transition-transform duration-500" />
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

              <div className="mt-10 bg-black/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="flex justify-between mb-2">
                  <p className="text-gray-400">Current round ends in:</p>
                  <span className="text-primary">Prize: {prizePool.toFixed(2)} SOL</span>
                </div>
                <CountdownTimer endTime={endTime} />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-400">{participants} participants</span>
                  </div>
                  <div className="flex items-center">
                    <Gift size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-400">Charity: {(prizePool * 0.1).toFixed(2)} SOL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/30 rounded-full blur-3xl" />
              <LotteryBall prizePool={prizePool} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-6 bg-black/40 border-y border-white/10 backdrop-blur-md">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem value="50K+" label="Total Players" />
            <StatItem value="2,500+" label="SOL Distributed" />
            <StatItem value="250+" label="SOL Donated" />
            <StatItem value="15+" label="Charities Supported" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Trophy size={24} className="text-primary" />}
              title="Transparent Lottery"
              description="All transactions are recorded on the Solana blockchain, ensuring complete transparency and fairness."
            />
            <FeatureCard
              icon={<Gift size={24} className="text-primary" />}
              title="Charity Impact"
              description="10% of each prize pool is donated to a charity selected by the community through voting."
            />
            <FeatureCard
              icon={<Users size={24} className="text-primary" />}
              title="Community Voting"
              description="Vote on which charity receives donations in the next round. Your voice matters!"
            />
          </div>
        </div>
      </section>

    

      {/* Charities Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 gradient-text">Supported Charities</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Your participation helps fund these amazing causes. New charities are added based on community votes.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CharityLogo name="Ocean Cleanup" />
            <CharityLogo name="Children's Fund" />
            <CharityLogo name="Tech Education" />
            <CharityLogo name="Climate Action" />
          </div>
          
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/30 to-black/60">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Ready to Win Big and Give Back?</h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of players who are winning prizes while making a difference. Every ticket counts!
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity relative overflow-hidden group"
          >
            <Link href="/lottery">
              Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              <span className="absolute -top-full left-0 w-full h-full bg-white/20 group-hover:translate-y-full transition-transform duration-500" />
            </Link>
          </Button>
        </div>
      </section>

  
   
    </main>
  )
}

// New Components

function StatItem({ value, label }:any) {
  return (
    <div className="text-center p-3">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function WinnerCard({ round, amount, wallet, date }:any) {
  return (
    <Card className="glass-card hover:glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Badge className="bg-primary/20 text-primary border-primary/50">Round #{round}</Badge>
          <span className="text-sm text-gray-400">{date}</span>
        </div>
        <div className="text-2xl font-bold mb-2">{amount} SOL</div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Winner:</span>
          <span className="font-mono bg-white/5 px-2 py-1 rounded text-sm">{wallet}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CharityLogo({ name }:any) {
  return (
    <div className="aspect-square bg-black/30 rounded-lg border border-white/10 flex items-center justify-center p-4 hover:border-primary/50 transition-colors cursor-pointer group">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center">
          <Gift size={24} className="text-white group-hover:scale-110 transition-transform" />
        </div>
        <span className="text-center text-sm font-medium">{name}</span>
      </div>
    </div>
  );
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
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  )
}