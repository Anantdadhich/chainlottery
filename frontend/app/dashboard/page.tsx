"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { BarChart3, TrendingUp, Award, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import ThreeBackground from "@/components/three-background"
import * as THREE from "three"
import { useCharityLotteryProgram } from "@/lib/anchor-client"

interface DonationData {
  charity: string
  amount: number
  percentage: number
  color: string
}

interface LotteryHistory {
  id: number
  date: string
  prizePool: number
  winner: string
  donation: number
  charity: string
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()
  const program = useCharityLotteryProgram()

  const [donationData, setDonationData] = useState<DonationData[]>([
    { charity: "Global Education Fund", amount: 25, percentage: 40, color: "#00ff9d" },
    { charity: "Ocean Conservation", amount: 15, percentage: 24, color: "#00c2ff" },
    { charity: "Hunger Relief", amount: 12, percentage: 19, color: "#9d00ff" },
    { charity: "Medical Research", amount: 10, percentage: 17, color: "#ff00c2" },
  ])

  const [lotteryHistory, setLotteryHistory] = useState<LotteryHistory[]>([
    {
      id: 1,
      date: "2025-04-01",
      prizePool: 120,
      winner: "7xKX...9pQr",
      donation: 12,
      charity: "Global Education Fund",
    },
    {
      id: 2,
      date: "2025-03-25",
      prizePool: 95,
      winner: "3jRm...7tYu",
      donation: 9.5,
      charity: "Ocean Conservation",
    },
    {
      id: 3,
      date: "2025-03-18",
      prizePool: 110,
      winner: "5qWe...2zXc",
      donation: 11,
      charity: "Hunger Relief",
    },
  ])

  const [userStats, setUserStats] = useState({
    ticketsBought: 0,
    totalSpent: 0,
    winnings: 0,
    donations: 0,
  })

  useEffect(() => {
    if (program && publicKey) {
      // In a real application, you would fetch user stats from the blockchain
      // This is just a placeholder
      setUserStats({
        ticketsBought: 12,
        totalSpent: 12,
        winnings: 0,
        donations: 1.2,
      })
    }
  }, [program, publicKey])

  return (
    <main className="min-h-screen">
      <ThreeBackground />
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center gradient-text">Dashboard</h1>

          <Tabs defaultValue="impact" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="impact">Donation Impact</TabsTrigger>
              <TabsTrigger value="history">Lottery History</TabsTrigger>
              <TabsTrigger value="stats">Your Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="impact">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="glass-card h-full">
                    <CardHeader>
                      <CardTitle>Donation Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <DonationGlobe donationData={donationData} />
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="glass-card h-full">
                    <CardHeader>
                      <CardTitle>Impact Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-400 mb-2">Total Donated</h3>
                          <p className="text-4xl font-bold gradient-text">62 SOL</p>
                          <p className="text-sm text-gray-400">≈ $6,200 USD</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-400 mb-2">Charities Supported</h3>
                          <p className="text-4xl font-bold gradient-text">4</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-400 mb-2">Impact Breakdown</h3>
                          <ul className="space-y-2">
                            <ImpactItem
                              label="Education"
                              value="250 students supported"
                              icon={<BarChart3 size={16} className="text-primary" />}
                            />
                            <ImpactItem
                              label="Ocean Cleanup"
                              value="15 tons of plastic removed"
                              icon={<TrendingUp size={16} className="text-primary" />}
                            />
                            <ImpactItem
                              label="Meals Provided"
                              value="1,200 meals distributed"
                              icon={<Award size={16} className="text-primary" />}
                            />
                            <ImpactItem
                              label="Medical Research"
                              value="2 research grants funded"
                              icon={<DollarSign size={16} className="text-primary" />}
                            />
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Past Lottery Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Prize Pool</th>
                          <th className="text-left py-3 px-4">Winner</th>
                          <th className="text-left py-3 px-4">Donation</th>
                          <th className="text-left py-3 px-4">Charity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotteryHistory.map((lottery) => (
                          <tr key={lottery.id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4">{lottery.date}</td>
                            <td className="py-3 px-4">{lottery.prizePool} SOL</td>
                            <td className="py-3 px-4">{lottery.winner}</td>
                            <td className="py-3 px-4">{lottery.donation} SOL</td>
                            <td className="py-3 px-4">{lottery.charity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Your Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Tickets Bought</h3>
                        <p className="text-4xl font-bold gradient-text">{userStats.ticketsBought}</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Spent</h3>
                        <p className="text-4xl font-bold gradient-text">{userStats.totalSpent} SOL</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Your Contribution to Charity</h3>
                        <p className="text-4xl font-bold gradient-text">{userStats.donations} SOL</p>
                        <p className="text-sm text-gray-400">10% of your ticket purchases</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Your Winnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Winnings</h3>
                        <p className="text-4xl font-bold gradient-text">{userStats.winnings} SOL</p>
                      </div>

                      {userStats.winnings === 0 ? (
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <p className="text-center">
                            You haven't won any lotteries yet. Keep participating for a chance to win!
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium text-gray-400 mb-2">Winning Rounds</h3>
                          <ul className="space-y-2">
                            {/* This would be populated with actual winning data */}
                            <li className="flex justify-between">
                              <span>Round #42 (2025-03-15)</span>
                              <span className="font-bold">{userStats.winnings} SOL</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">ROI</h3>
                        <p className="text-4xl font-bold gradient-text">
                          {userStats.totalSpent > 0
                            ? `${((userStats.winnings / userStats.totalSpent) * 100).toFixed(2)}%`
                            : "0%"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}

interface ImpactItemProps {
  label: string
  value: string
  icon: React.ReactNode
}

function ImpactItem({ label, value, icon }: ImpactItemProps) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-2">{icon}</div>
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </li>
  )
}

function DonationGlobe({ donationData }: { donationData: DonationData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Create globe
    const globeGeometry = new THREE.SphereGeometry(2, 32, 32)
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    })
    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    scene.add(globe)

    // Add donation points
    donationData.forEach((donation, index) => {
      // Create a point for each donation
      const pointGeometry = new THREE.SphereGeometry(
        (donation.percentage / 100) * 0.5, // Size based on percentage
        16,
        16,
      )
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(donation.color),
        transparent: true,
        opacity: 0.8,
      })
      const point = new THREE.Mesh(pointGeometry, pointMaterial)

      // Position around the globe
      const phi = Math.acos(-1 + (2 * index) / donationData.length)
      const theta = Math.sqrt(donationData.length * Math.PI) * phi

      point.position.x = 2 * Math.cos(theta) * Math.sin(phi)
      point.position.y = 2 * Math.sin(theta) * Math.sin(phi)
      point.position.z = 2 * Math.cos(phi)

      scene.add(point)

      // Add a text label
      const canvas = document.createElement("canvas")
      canvas.width = 256
      canvas.height = 128
      const context = canvas.getContext("2d")

      if (context) {
        context.fillStyle = "rgba(0, 0, 0, 0)"
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.font = "bold 24px Arial"
        context.fillStyle = donation.color
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(donation.charity, canvas.width / 2, canvas.height / 2 - 15)
        context.fillText(`${donation.amount} SOL`, canvas.width / 2, canvas.height / 2 + 15)
      }

      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.position.copy(point.position)
      label.position.multiplyScalar(1.2)
      label.scale.set(2, 1, 1)

      scene.add(label)
    })

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00ff9d, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0x00c2ff, 1, 100)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    // Animation loop
    const animate = () => {
      globe.rotation.y += 0.005

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      scene.clear()
    }
  }, [donationData])

  return <div ref={containerRef} className="w-full h-full" />
}
