"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useMobile } from "@/hooks/use-mobile"

interface TicketAnimationProps {
  numTickets: number
  onComplete?: () => void
}

export default function TicketAnimation({ numTickets, onComplete }: TicketAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

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

    // Create target point (prize pool)
    const targetGeometry = new THREE.SphereGeometry(1, 32, 32)
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

    // Create tickets
    const tickets: THREE.Mesh[] = []
    const ticketGeometry = new THREE.PlaneGeometry(1, 0.5)

    // Create a canvas for the ticket texture
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 128
    const context = canvas.getContext("2d")

    if (context) {
      // Fill the background
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Add a border
      context.strokeStyle = "#00ff9d"
      context.lineWidth = 10
      context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)

      // Add text
      context.fillStyle = "#000000"
      context.font = "bold 24px Arial"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText("LOTTERY TICKET", canvas.width / 2, canvas.height / 2)
    }

    // Create texture from canvas
    const ticketTexture = new THREE.CanvasTexture(canvas)

    // Create tickets
    for (let i = 0; i < numTickets; i++) {
      const ticketMaterial = new THREE.MeshStandardMaterial({
        map: ticketTexture,
        side: THREE.DoubleSide,
      })

      const ticket = new THREE.Mesh(ticketGeometry, ticketMaterial)

      // Position tickets in a circle around the camera
      const angle = (i / numTickets) * Math.PI * 2
      const radius = 3
      ticket.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -2)

      // Rotate tickets to face the camera
      ticket.lookAt(camera.position)

      scene.add(ticket)
      tickets.push(ticket)
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00ff9d, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Add particles for trail effect
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = isMobile ? 100 : 500
    const particlesPositions = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      particlesPositions[i] = 0 // Start with all particles at origin
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlesPositions, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00ff9d,
      transparent: true,
      opacity: 0.8,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Animation loop
    const clock = new THREE.Clock()
    let animationComplete = false

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      // Animate target (prize pool)
      targetMesh.scale.set(
        1 + Math.sin(elapsedTime * 2) * 0.1,
        1 + Math.sin(elapsedTime * 2) * 0.1,
        1 + Math.sin(elapsedTime * 2) * 0.1,
      )

      // Animate tickets moving to target
      let allTicketsReached = true

      tickets.forEach((ticket, index) => {
        const delay = index * 0.2 // Stagger the animation
        const animationTime = elapsedTime - delay

        if (animationTime > 0) {
          // Calculate progress (0 to 1)
          const progress = Math.min(animationTime / 2, 1)

          // Move ticket towards target
          const startPos = new THREE.Vector3(
            Math.cos((index / numTickets) * Math.PI * 2) * 3,
            Math.sin((index / numTickets) * Math.PI * 2) * 3,
            -2,
          )

          const endPos = new THREE.Vector3(0, 0, -5)

          ticket.position.lerpVectors(startPos, endPos, progress)

          // Rotate ticket
          ticket.rotation.z = elapsedTime * 2 + index

          // Scale down ticket as it approaches target
          const scale = 1 - progress * 0.8
          ticket.scale.set(scale, scale, scale)

          // Update particle positions for trail effect
          const positions = particlesGeometry.attributes.position.array

          for (let i = 0; i < 10; i++) {
            const particleIndex = (index * 10 + i) % particlesCount
            const arrayIndex = particleIndex * 3

            if (arrayIndex < positions.length - 3) {
              positions[arrayIndex] = ticket.position.x + (Math.random() - 0.5) * 0.2
              positions[arrayIndex + 1] = ticket.position.y + (Math.random() - 0.5) * 0.2
              positions[arrayIndex + 2] = ticket.position.z + (Math.random() - 0.5) * 0.2
            }
          }

          particlesGeometry.attributes.position.needsUpdate = true

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

        // Create explosion effect
        const explosionGeometry = new THREE.BufferGeometry()
        const explosionCount = isMobile ? 200 : 1000
        const explosionPositions = new Float32Array(explosionCount * 3)
        const explosionVelocities = new Float32Array(explosionCount * 3)

        for (let i = 0; i < explosionCount; i++) {
          const i3 = i * 3
          explosionPositions[i3] = 0
          explosionPositions[i3 + 1] = 0
          explosionPositions[i3 + 2] = -5

          // Random velocity in all directions
          explosionVelocities[i3] = (Math.random() - 0.5) * 0.2
          explosionVelocities[i3 + 1] = (Math.random() - 0.5) * 0.2
          explosionVelocities[i3 + 2] = (Math.random() - 0.5) * 0.2
        }

        explosionGeometry.setAttribute("position", new THREE.BufferAttribute(explosionPositions, 3))

        const explosionMaterial = new THREE.PointsMaterial({
          size: 0.05,
          color: 0x00ff9d,
          transparent: true,
          opacity: 0.8,
        })

        const explosionMesh = new THREE.Points(explosionGeometry, explosionMaterial)
        scene.add(explosionMesh)

        // Animate explosion
        const animateExplosion = () => {
          const positions = explosionGeometry.attributes.position.array

          for (let i = 0; i < explosionCount; i++) {
            const i3 = i * 3

            // Update position based on velocity
            positions[i3] += explosionVelocities[i3]
            positions[i3 + 1] += explosionVelocities[i3 + 1]
            positions[i3 + 2] += explosionVelocities[i3 + 2]

            // Fade out particles by reducing their size
            explosionMaterial.size *= 0.99
          }

          explosionGeometry.attributes.position.needsUpdate = true

          if (explosionMaterial.size > 0.01) {
            requestAnimationFrame(animateExplosion)
          } else {
            // Remove explosion mesh when animation is done
            scene.remove(explosionMesh)

            // Call onComplete callback
            onComplete?.()
          }
        }

        animateExplosion()
      }

      renderer.render(scene, camera)

      if (!animationComplete) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      scene.clear()
    }
  }, [numTickets, onComplete, isMobile])

  return <div ref={containerRef} className="w-full h-[300px] sm:h-[400px] relative" />
}
