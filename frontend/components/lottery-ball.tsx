"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useMobile } from "@/hooks/use-mobile"

interface LotteryBallProps {
  prizePool: number
  currency?: string
}

export default function LotteryBall({ prizePool, currency = "SOL" }: LotteryBallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const [isLowPerformance, setIsLowPerformance] = useState(false)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameIdRef = useRef<number>(0)

  useEffect(() => {
    // Check device performance
    const checkPerformance = () => {
      // Simple performance check - if mobile or low memory, use low performance mode
      if (
        isMobile ||
        //@ts-ignore
        (navigator.deviceMemory  && navigator.deviceMemory < 4) ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      ) {
        setIsLowPerformance(true)
        return true
      }
      return false
    }

    const lowPerf = checkPerformance()

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

    // Renderer setup with optimized settings
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPerf,
      alpha: true,
      powerPreference: "high-performance",
    })
    rendererRef.current = renderer

    // Set pixel ratio based on performance mode
    const pixelRatio = lowPerf ? 0.7 : Math.min(window.devicePixelRatio, 1.5)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Create lottery ball with reduced geometry for better performance
    const ballGeometry = new THREE.SphereGeometry(1.5, lowPerf ? 12 : 24, lowPerf ? 12 : 24)

    // Create a canvas for the texture
    const canvas = document.createElement("canvas")
    canvas.width = lowPerf ? 128 : 256
    canvas.height = lowPerf ? 128 : 256
    const context = canvas.getContext("2d")

    if (context) {
      // Fill the background
      context.fillStyle = "#000000"
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Add a gradient
      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
      )
      gradient.addColorStop(0, "#00ff9d")
      gradient.addColorStop(1, "#00c2ff")

      context.fillStyle = gradient
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Add the prize text
      context.fillStyle = "#ffffff"
      context.font = `bold ${lowPerf ? 20 : 40}px Arial`
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(`${prizePool} ${currency}`, canvas.width / 2, canvas.height / 2)

      // Add some decorative elements
      context.strokeStyle = "#ffffff"
      context.lineWidth = 2
      context.beginPath()
      context.arc(canvas.width / 2, canvas.height / 2, lowPerf ? 40 : 80, 0, Math.PI * 2)
      context.stroke()

      // Add fewer stars/dots in low performance mode
      const dotsCount = lowPerf ? 10 : 25
      for (let i = 0; i < dotsCount; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const radius = Math.random() * 3 + 1

        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fillStyle = "#ffffff"
        context.fill()
      }
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)

    // Create material with the texture - simpler material for low performance
    const ballMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: new THREE.Color(0x00ff9d),
      emissiveIntensity: 0.2,
    })

    // Create mesh
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial)
    scene.add(ballMesh)

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add point lights - fewer in low performance mode
    const pointLight = new THREE.PointLight(0x00ff9d, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Add glow effect only if not in low performance mode
    let glowMesh: THREE.Mesh | null = null
    if (!lowPerf) {
      const glowGeometry = new THREE.SphereGeometry(1.6, 24, 24)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.1,
      })
      glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
      scene.add(glowMesh)
    }

    // Mouse movement effect with throttling
    let mouseX = 0
    let mouseY = 0
    let lastMouseMoveTime = 0

    const handleMouseMove = (event: MouseEvent) => {
      // Skip mouse handling in low performance mode
      if (lowPerf) return

      // Throttle mouse move events
      const now = performance.now()
      if (now - lastMouseMoveTime < 100) return // Only process every 100ms
      lastMouseMoveTime = now

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Handle window resize with throttling
    let resizeTimeout: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        if (!containerRef.current) return

        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }, 200)
    }

    window.addEventListener("resize", handleResize, { passive: true })

    // Animation loop with frame limiting
    const clock = new THREE.Clock()
    let lastFrameTime = 0
    const targetFPS = lowPerf ? 20 : 30
    const frameInterval = 1 / targetFPS

    const animate = () => {
      const currentTime = clock.getElapsedTime()
      const deltaTime = currentTime - lastFrameTime

      // Limit frame rate
      if (deltaTime > frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval)

        // Rotate ball (slower rotation for better performance)
        ballMesh.rotation.y += lowPerf ? 0.005 : 0.01

        if (!lowPerf) {
          ballMesh.rotation.x = Math.sin(currentTime * 0.3) * 0.1

          // Move ball based on mouse
          ballMesh.rotation.y += mouseX * 0.005
          ballMesh.rotation.x += mouseY * 0.005
        }

        // Animate glow if it exists
        if (glowMesh) {
          glowMesh.scale.set(
            1 + Math.sin(currentTime) * 0.03,
            1 + Math.sin(currentTime) * 0.03,
            1 + Math.sin(currentTime) * 0.03,
          )
        }

        renderer.render(scene, camera)
      }

      frameIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)

      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }

      // Dispose of geometries and materials
      ballGeometry.dispose()
      ballMaterial.dispose()
      if (glowMesh) {
        if (glowMesh.geometry) glowMesh.geometry.dispose()
        if (glowMesh.material instanceof THREE.Material) {
          glowMesh.material.dispose()
        } else if (Array.isArray(glowMesh.material)) {
          glowMesh.material.forEach((material) => material.dispose())
        }
      }

      // Clear scene
      scene.clear()

      // Dispose renderer
      renderer.dispose()
      rendererRef.current = null

      // Cancel any pending timeouts
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [prizePool, currency, isMobile])

  return <div ref={containerRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative" />
}
