"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useMobile } from "@/hooks/use-mobile"

interface TicketAnimationProps {
  numTickets: number
  onComplete?: () => void
}

export default function TicketAnimation({ numTickets, onComplete }: TicketAnimationProps) {
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
        (navigator.deviceMemory && navigator.deviceMemory < 4) ||
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

    // Create target point (prize pool)
    const targetGeometry = new THREE.SphereGeometry(1, lowPerf ? 12 : 24, lowPerf ? 12 : 24)
    const targetMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff9d,
      emissive: 0x00ff9d,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    })
    const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial)
    targetMesh.position.set(0, 0, -5)
    scene.add(targetMesh)

    // Create tickets - limit number for performance
    const maxTickets = lowPerf ? Math.min(numTickets, 3) : numTickets
    const tickets: THREE.Mesh[] = []
    const ticketGeometry = new THREE.PlaneGeometry(1, 0.5)

    // Create a canvas for the ticket texture - smaller for performance
    const canvas = document.createElement("canvas")
    canvas.width = lowPerf ? 64 : 128
    canvas.height = lowPerf ? 32 : 64
    const context = canvas.getContext("2d")

    if (context) {
      // Fill the background
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Add a border
      context.strokeStyle = "#00ff9d"
      context.lineWidth = lowPerf ? 3 : 5
      context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6)

      // Add text
      context.fillStyle = "#000000"
      context.font = `bold ${lowPerf ? 8 : 16}px Arial`
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText("LOTTERY TICKET", canvas.width / 2, canvas.height / 2)
    }

    // Create texture from canvas
    const ticketTexture = new THREE.CanvasTexture(canvas)

    // Create tickets
    for (let i = 0; i < maxTickets; i++) {
      const ticketMaterial = new THREE.MeshStandardMaterial({
        map: ticketTexture,
        side: THREE.DoubleSide,
      })

      const ticket = new THREE.Mesh(ticketGeometry, ticketMaterial)

      // Position tickets in a circle around the camera
      const angle = (i / maxTickets) * Math.PI * 2
      const radius = 3
      ticket.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -2)

      // Rotate tickets to face the camera
      ticket.lookAt(camera.position)

      scene.add(ticket)
      tickets.push(ticket)
    }

    // Add lights - fewer in low performance mode
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00ff9d, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Add particles for trail effect - fewer in low performance mode
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = lowPerf ? 20 : isMobile ? 50 : 100
    const particlesPositions = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      particlesPositions[i] = 0 // Start with all particles at origin
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlesPositions, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: lowPerf ? 0.1 : 0.05,
      color: 0x00ff9d,
      transparent: true,
      opacity: 0.8,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Animation loop with frame limiting
    const clock = new THREE.Clock()
    let lastFrameTime = 0
    const targetFPS = lowPerf ? 20 : 30
    const frameInterval = 1 / targetFPS
    let animationComplete = false

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - lastFrameTime

      // Limit frame rate
      if (deltaTime > frameInterval) {
        lastFrameTime = elapsedTime - (deltaTime % frameInterval)

        // Animate target (prize pool) - simpler animation in low performance mode
        if (!lowPerf) {
          targetMesh.scale.set(
            1 + Math.sin(elapsedTime * 1.5) * 0.1,
            1 + Math.sin(elapsedTime * 1.5) * 0.1,
            1 + Math.sin(elapsedTime * 1.5) * 0.1,
          )
        }

        // Animate tickets moving to target
        let allTicketsReached = true

        tickets.forEach((ticket, index) => {
          const delay = index * (lowPerf ? 0.4 : 0.2) // Stagger the animation
          const animationTime = elapsedTime - delay

          if (animationTime > 0) {
            // Calculate progress (0 to 1)
            const progress = Math.min(animationTime / (lowPerf ? 1.2 : 2), 1)

            // Move ticket towards target
            const startPos = new THREE.Vector3(
              Math.cos((index / maxTickets) * Math.PI * 2) * 3,
              Math.sin((index / maxTickets) * Math.PI * 2) * 3,
              -2,
            )

            const endPos = new THREE.Vector3(0, 0, -5)

            ticket.position.lerpVectors(startPos, endPos, progress)

            // Rotate ticket - slower in low performance mode
            ticket.rotation.z = elapsedTime * (lowPerf ? 0.5 : 1) + index

            // Scale down ticket as it approaches target
            const scale = 1 - progress * 0.8
            ticket.scale.set(scale, scale, scale)

            // Update particle positions for trail effect - fewer updates in low performance mode
            if (!lowPerf) {
              const positions = particlesGeometry.attributes.position.array
              const particlesPerTicket = lowPerf ? 3 : 5

              for (let i = 0; i < particlesPerTicket; i++) {
                const particleIndex = (index * particlesPerTicket + i) % particlesCount
                const arrayIndex = particleIndex * 3

                if (arrayIndex < positions.length - 3) {
                  positions[arrayIndex] = ticket.position.x + (Math.random() - 0.5) * 0.2
                  positions[arrayIndex + 1] = ticket.position.y + (Math.random() - 0.5) * 0.2
                  positions[arrayIndex + 2] = ticket.position.z + (Math.random() - 0.5) * 0.2
                }
              }

              particlesGeometry.attributes.position.needsUpdate = true
            }

            // Check if ticket reached target
            if (progress < 1) {
              allTicketsReached = false
            } else {
              // Make ticket invisible when it reaches target
              ticket.visible = false
            }
          } else {
            allTicketsReached = false
          }
        })

        // Check if animation is complete
        if (allTicketsReached && !animationComplete) {
          animationComplete = true

          // Create explosion effect - simpler in low performance mode
          const explosionGeometry = new THREE.BufferGeometry()
          const explosionCount = lowPerf ? 50 : isMobile ? 100 : 200
          const explosionPositions = new Float32Array(explosionCount * 3)
          const explosionVelocities = new Float32Array(explosionCount * 3)

          for (let i = 0; i < explosionCount; i++) {
            const i3 = i * 3
            explosionPositions[i3] = 0
            explosionPositions[i3 + 1] = 0
            explosionPositions[i3 + 2] = -5

            // Random velocity in all directions - slower in low performance mode
            const velocityScale = lowPerf ? 0.05 : 0.1
            explosionVelocities[i3] = (Math.random() - 0.5) * velocityScale
            explosionVelocities[i3 + 1] = (Math.random() - 0.5) * velocityScale
            explosionVelocities[i3 + 2] = (Math.random() - 0.5) * velocityScale
          }

          explosionGeometry.setAttribute("position", new THREE.BufferAttribute(explosionPositions, 3))

          const explosionMaterial = new THREE.PointsMaterial({
            size: lowPerf ? 0.1 : 0.05,
            color: 0x00ff9d,
            transparent: true,
            opacity: 0.8,
          })

          const explosionMesh = new THREE.Points(explosionGeometry, explosionMaterial)
          scene.add(explosionMesh)

          // Animate explosion with frame limiting
          let lastExplosionTime = 0
          let explosionFrameId = 0

          const animateExplosion = () => {
            const now = performance.now()
            const deltaTime = now - lastExplosionTime

            // Limit update rate for explosion animation
            if (deltaTime > (lowPerf ? 50 : 16)) {
              lastExplosionTime = now

              const positions = explosionGeometry.attributes.position.array

              for (let i = 0; i < explosionCount; i++) {
                const i3 = i * 3

                // Update position based on velocity
                positions[i3] += explosionVelocities[i3]
                positions[i3 + 1] += explosionVelocities[i3 + 1]
                positions[i3 + 2] += explosionVelocities[i3 + 2]
              }

              explosionGeometry.attributes.position.needsUpdate = true

              // Fade out particles by reducing their size
              explosionMaterial.size *= 0.98
            }

            renderer.render(scene, camera)

            if (explosionMaterial.size > 0.01) {
              explosionFrameId = requestAnimationFrame(animateExplosion)
            } else {
              // Remove explosion mesh when animation is done
              scene.remove(explosionMesh)
              explosionGeometry.dispose()
              explosionMaterial.dispose()

              // Call onComplete callback
              onComplete?.()
            }
          }

          animateExplosion()
        }

        renderer.render(scene, camera)
      }

      if (!animationComplete) {
        frameIdRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }

      // Dispose of geometries and materials
      targetGeometry.dispose()
      targetMaterial.dispose()
      ticketGeometry.dispose()
      particlesGeometry.dispose()
      particlesMaterial.dispose()

      // Dispose of ticket materials
      tickets.forEach((ticket) => {
        if (ticket.material instanceof THREE.Material) {
          ticket.material.dispose()
        }
      })

      // Clear scene
      scene.clear()

      // Dispose renderer
      renderer.dispose()
      rendererRef.current = null
    }
  }, [numTickets, onComplete, isMobile])

  return <div ref={containerRef} className="w-full h-[300px] sm:h-[400px] relative" />
}
