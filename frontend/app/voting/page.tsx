"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Heart, Info, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"
import ThreeBackground from "@/components/three-background"
import { useCharityLotteryProgram, getCharityVotes, voteForCharity } from "@/lib/anchor-client"

interface Charity {
  id: number
  name: string
  description: string
  voteCount: number
  image: string
}

export default function VotingPage() {
  const { connected } = useWallet()
  const program = useCharityLotteryProgram()
  const { toast } = useToast()

  const [charities, setCharities] = useState<Charity[]>([
    {
      id: 1,
      name: "Global Education Fund",
      description: "Providing education to children in underserved communities worldwide.",
      voteCount: 120,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Ocean Conservation",
      description: "Working to protect marine ecosystems and reduce ocean pollution.",
      voteCount: 85,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      name: "Hunger Relief",
      description: "Providing meals and sustainable food solutions to those in need.",
      voteCount: 97,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      name: "Medical Research",
      description: "Funding research for treatments and cures for various diseases.",
      voteCount: 64,
      image: "/placeholder.svg?height=100&width=100",
    },
  ])

  const [votingEndTime, setVotingEndTime] = useState(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  const [isVoting, setIsVoting] = useState(false)
  const [userVote, setUserVote] = useState<number | null>(null)

  useEffect(() => {
    if (program) {
      const fetchCharityVotes = async () => {
        const charityVotesData = await getCharityVotes(program)

        if (charityVotesData.length > 0) {
          const updatedCharities = charities.map((charity) => {
            const matchingVote = charityVotesData.find((vote) => vote.account.charityId === charity.id)

            if (matchingVote) {
              return {
                ...charity,
                name: matchingVote.account.name || charity.name,
                description: matchingVote.account.description || charity.description,
                voteCount: matchingVote.account.voteCount.toNumber(),
              }
            }

            return charity
          })

          setCharities(updatedCharities)
        }
      }

      fetchCharityVotes()

      // Poll for updates
      const interval = setInterval(fetchCharityVotes, 10000)
      return () => clearInterval(interval)
    }
  }, [program, charities])

  const handleVote = async (charityId: number) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    if (!program) {
      toast({
        title: "Error",
        description: "Program not initialized",
        variant: "destructive",
      })
      return
    }

    try {
      setIsVoting(true)

      // Call the voteForCharity function from the anchor-client
      const tx = await voteForCharity(program, charityId)

      // Update UI
      setUserVote(charityId)

      // Update vote count locally
      setCharities(
        charities.map((charity) => {
          if (charity.id === charityId) {
            return {
              ...charity,
              voteCount: charity.voteCount + 1,
            }
          }
          return charity
        }),
      )

      toast({
        title: "Vote submitted!",
        description: `You voted for ${charities.find((c) => c.id === charityId)?.name}`,
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error submitting vote",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  // Calculate total votes
  const totalVotes = charities.reduce((sum, charity) => sum + charity.voteCount, 0)

  return (
    <main className="min-h-screen">
      <ThreeBackground />
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center gradient-text">Charity Voting</h1>
          <p className="text-xl text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Vote for the charity you want to support in the next lottery round. 10% of the prize pool will be donated to
            the winning charity.
          </p>

          {!connected && (
            <div className="mb-8 p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg max-w-2xl mx-auto">
              <p className="flex items-center text-amber-400">
                <Info className="mr-2" size={20} />
                Connect your wallet to vote for a charity
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {charities.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                totalVotes={totalVotes}
                userVote={userVote}
                onVote={handleVote}
                isVoting={isVoting}
                connected={connected}
              />
            ))}
          </div>

          {/* Voting Information */}
          <div className="mt-12">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Voting Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-1">How Voting Works</h3>
                    <p className="text-gray-400">
                      Each wallet can vote for one charity per voting period. The charity with the most votes will
                      receive 10% of the next lottery's prize pool.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1">Voting Period</h3>
                    <p className="text-gray-400">
                      Voting is open for 7 days before each lottery round. The winning charity is selected when the
                      voting period ends.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1">Transparency</h3>
                    <p className="text-gray-400">
                      All votes are recorded on the Solana blockchain, ensuring a transparent and verifiable process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}

interface CharityCardProps {
  charity: Charity
  totalVotes: number
  userVote: number | null
  onVote: (charityId: number) => void
  isVoting: boolean
  connected: boolean
}

function CharityCard({ charity, totalVotes, userVote, onVote, isVoting, connected }: CharityCardProps) {
  const percentage = totalVotes > 0 ? Math.round((charity.voteCount / totalVotes) * 100) : 0
  const isSelected = userVote === charity.id

  return (
    <Card
      className={`glass-card overflow-hidden transition-all duration-300 ${isSelected ? "glow border-primary" : "hover:glow hover:border-primary/50"}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{charity.name}</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart size={20} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-gray-400 mb-4">{charity.description}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Votes</span>
            <span className="font-medium">
              {charity.voteCount} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onVote(charity.id)}
          disabled={isVoting || isSelected || !connected}
          className={`w-full ${
            isSelected
              ? "bg-primary/20 text-primary border border-primary"
              : "bg-primary/10 hover:bg-primary/20 text-white"
          }`}
          variant="outline"
        >
          {isSelected ? (
            <>
              <Check className="mr-2" size={16} />
              Voted
            </>
          ) : (
            "Vote for this charity"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
