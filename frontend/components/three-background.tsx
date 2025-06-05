"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
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
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 30

    // Renderer setup with lower resolution for better performance
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPerf,
      alpha: true,
      powerPreference: "high-performance",
    })
    rendererRef.current = renderer

    // Set pixel ratio based on performance mode
    const pixelRatio = lowPerf ? 0.7 : Math.min(window.devicePixelRatio, 1.5)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Create particles - reduce count for better performance
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = lowPerf ? 100 : isMobile ? 300 : 600

    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
      size: lowPerf ? 0.15 : 0.08,
      color: theme === "dark" ? 0x00ff9d : 0x00c2ff,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    })

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Add light nodes only if not in low performance mode
    if (!lowPerf) {
      // Add some light nodes
      const createLightNode = (x: number, y: number, z: number, color: number) => {
        const geometry = new THREE.SphereGeometry(0.25, 8, 8) // Reduced geometry complexity
        const material = new THREE.MeshBasicMaterial({ color })
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(x, y, z)

        // Add a point light
        const light = new THREE.PointLight(color, 1, 10)
        light.position.set(x, y, z)
        scene.add(light)

        return sphere
      }

      // Add fewer light nodes
      const lightNode1 = createLightNode(8, 5, 0, 0x00ff9d)
      scene.add(lightNode1)
    }

    // Add grid lines only if not in low performance mode
    if (!lowPerf) {
      const gridHelper = new THREE.GridHelper(50, 15, 0x004d40, 0x004d40) // Reduced grid complexity
      gridHelper.position.y = -10
      scene.add(gridHelper)
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

      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Handle window resize with throttling
    let resizeTimeout: NodeJS.Timeout | null = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
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

        // Rotate particles (slower rotation for better performance)
        particlesMesh.rotation.y += 0.001

        // Move particles based on mouse with reduced sensitivity
        if (!lowPerf) {
          particlesMesh.rotation.x += mouseY * 0.0001
          particlesMesh.rotation.y += mouseX * 0.0001
        }

        // Animate light nodes only if not in low performance mode
        if (!lowPerf && scene.children.length > 3) {
          const lightNode1 = scene.children[2]
          if (lightNode1 && lightNode1.position) {
            lightNode1.position.y = Math.sin(currentTime * 0.2) * 5
          }
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
      particlesGeometry.dispose()
      particlesMaterial.dispose()

      // Clear scene
      scene.clear()

      // Dispose renderer
      renderer.dispose()
      rendererRef.current = null

      // Cancel any pending timeouts
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [theme, isMobile])

  return <div ref={containerRef} className="fixed top-0 left-0 w-full h-full -z-10" />
}
