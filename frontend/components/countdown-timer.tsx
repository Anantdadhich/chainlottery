"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  endTime: number // Unix timestamp in milliseconds
  onComplete?: () => void
  className?: string
}

export default function CountdownTimer({ endTime, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime - Date.now()

      if (difference <= 0) {
        setIsComplete(true)
        onComplete?.()
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onComplete])

  return (
    <div className={cn("flex justify-center items-center space-x-4", className)}>
      <TimeUnit value={timeLeft.days} label="Days" isComplete={isComplete} />
      <TimeUnit value={timeLeft.hours} label="Hours" isComplete={isComplete} />
      <TimeUnit value={timeLeft.minutes} label="Minutes" isComplete={isComplete} />
      <TimeUnit value={timeLeft.seconds} label="Seconds" isComplete={isComplete} />
    </div>
  )
}

interface TimeUnitProps {
  value: number
  label: string
  isComplete: boolean
}

function TimeUnit({ value, label, isComplete }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 rounded-lg glass-card flex items-center justify-center",
          "border border-white/10 text-2xl sm:text-3xl font-bold",
          isComplete ? "bg-red-500/20" : "bg-primary/10",
        )}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-xs mt-2 text-gray-400">{label}</span>
    </div>
  )
}
