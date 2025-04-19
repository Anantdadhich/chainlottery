"use client"

import type React from "react"
import { Sparkles, Heart, Shield, Coins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Navbar from "@/components/navbar"
import ThreeBackground from "@/components/three-background"

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <ThreeBackground />
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center gradient-text">About Chain Lottery</h1>
          <p className="text-xl text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            A decentralized lottery on the Solana blockchain that combines the excitement of winning with the joy of
            giving back.
          </p>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard
                icon={<Coins size={24} className="text-primary" />}
                title="Buy Tickets"
                description="Purchase lottery tickets using SOL. Each ticket gives you a chance to win the prize pool."
                step={1}
              />
              <StepCard
                icon={<Heart size={24} className="text-primary" />}
                title="Vote for Charity"
                description="Cast your vote to decide which charity will receive a portion of the prize pool."
                step={2}
              />
              <StepCard
                icon={<Shield size={24} className="text-primary" />}
                title="Transparent Drawing"
                description="A winner is randomly selected on-chain when the lottery period ends."
                step={3}
              />
              <StepCard
                icon={<Sparkles size={24} className="text-primary" />}
                title="Win & Give"
                description="The winner receives 90% of the prize pool, while 10% is donated to the selected charity."
                step={4}
              />
            </div>
          </div>

          {/* Our Mission */}
          <div className="mb-16">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-300 mb-6">
                  Chain Lottery aims to revolutionize charitable giving by making it fun, transparent, and accessible
                  to everyone. We believe in the power of blockchain technology to create a more equitable and
                  transparent world.
                </p>
                <p className="text-center text-gray-300">
                  By combining the excitement of a lottery with the satisfaction of supporting important causes, we're
                  creating a win-win situation for everyone involved. Players have the chance to win prizes, charities
                  receive much-needed funding, and the entire process is transparent and verifiable on the blockchain.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
              <AccordionItem value="item-1" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">How does the lottery work?</AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Players purchase tickets using SOL. Each ticket gives you an entry into the lottery. When the lottery
                  period ends, a winner is randomly selected on-chain. The winner receives 90% of the prize pool, while
                  10% is donated to the charity selected by community voting.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">How are winners selected?</AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Winners are selected through a transparent, on-chain random selection process. The selection is
                  performed by the Solana smart contract, ensuring that it's fair and tamper-proof. Each ticket has an
                  equal chance of winning.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">How do I claim my prize if I win?</AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  If you win, you'll be notified on the platform. You can claim your prize by connecting your wallet and
                  clicking the "Claim Prize" button. The prize will be automatically transferred to your wallet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">How are charities selected?</AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Charities are selected through community voting. Each user can vote for their preferred charity, and
                  the charity with the most votes will receive the donation from the current lottery round.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">
                  Is the lottery fair and transparent?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Yes, the lottery is completely fair and transparent. All transactions, including ticket purchases,
                  winner selection, and charity donations, are recorded on the Solana blockchain and can be verified by
                  anyone. The smart contract code is open-source and audited.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-b border-white/10">
                <AccordionTrigger className="text-lg font-medium">
                  What blockchain does Chain Lottery use?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Chain Lottery is built on the Solana blockchain, which offers fast, low-cost transactions and is
                  environmentally friendly. This allows us to maximize the amount that goes to charity and provide a
                  seamless user experience.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </main>
  )
}

interface StepCardProps {
  icon: React.ReactNode
  title: string
  description: string
  step: number
}

function StepCard({ icon, title, description, step }: StepCardProps) {
  return (
    <Card className="glass-card hover:glow transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">{icon}</div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/50">
            <span className="text-sm font-bold">{step}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  )
}
