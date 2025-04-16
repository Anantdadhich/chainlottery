"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useMobile } from "@/hooks/use-mobile"

interface LotteryBallProps {
  prizePool: number
  currency?: string
}

export default function LotteryBall({ prizePool, currency = "SOL" }: LotteryBallProps) {
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

    // Create lottery ball
    const ballGeometry = new THREE.SphereGeometry(1.5, 32, 32)

    // Create a canvas for the texture
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
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
      context.font = "bold 60px Arial"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(`${prizePool} ${currency}`, canvas.width / 2, canvas.height / 2)

      // Add some decorative elements
      context.strokeStyle = "#ffffff"
      context.lineWidth = 2
      context.beginPath()
      context.arc(canvas.width / 2, canvas.height / 2, 120, 0, Math.PI * 2)
      context.stroke()

      // Add some stars or dots
      for (let i = 0; i < 50; i++) {
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

    // Create material with the texture
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

    // Add point light
    const pointLight = new THREE.PointLight(0x00ff9d, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Add another point light
    const pointLight2 = new THREE.PointLight(0x00c2ff, 1, 100)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(1.6, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff9d,
      transparent: true,
      opacity: 0.1,
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glowMesh)

    // Mouse movement effect
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      // Rotate ball
      ballMesh.rotation.y = elapsedTime * 0.2
      ballMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2

      // Move ball based on mouse (if not mobile)
      if (!isMobile) {
        ballMesh.rotation.y += mouseX * 0.01
        ballMesh.rotation.x += mouseY * 0.01
      }

      // Animate glow
      glowMesh.scale.set(
        1 + Math.sin(elapsedTime) * 0.05,
        1 + Math.sin(elapsedTime) * 0.05,
        1 + Math.sin(elapsedTime) * 0.05,
      )

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      scene.clear()
    }
  }, [prizePool, currency, isMobile])

  return <div ref={containerRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative" />
}
