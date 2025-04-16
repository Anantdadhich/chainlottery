"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isMobile = useMobile()

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 30

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = isMobile ? 500 : 2000

    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: theme === "dark" ? 0x00ff9d : 0x00c2ff,
      transparent: true,
      opacity: 0.8,
    })

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Add some light nodes
    const createLightNode = (x: number, y: number, z: number, color: number) => {
      const geometry = new THREE.SphereGeometry(0.25, 16, 16)
      const material = new THREE.MeshBasicMaterial({ color })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)

      // Add a point light
      const light = new THREE.PointLight(color, 1, 10)
      light.position.set(x, y, z)
      scene.add(light)

      return sphere
    }

    // Add a few light nodes
    const lightNode1 = createLightNode(8, 5, 0, 0x00ff9d)
    const lightNode2 = createLightNode(-10, -4, 2, 0x00c2ff)
    const lightNode3 = createLightNode(0, 8, -5, 0xffffff)

    scene.add(lightNode1, lightNode2, lightNode3)

    // Add grid lines
    const gridHelper = new THREE.GridHelper(50, 50, 0x004d40, 0x004d40)
    gridHelper.position.y = -10
    scene.add(gridHelper)

    // Mouse movement effect
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      // Rotate particles
      particlesMesh.rotation.y = elapsedTime * 0.05

      // Move particles based on mouse
      particlesMesh.rotation.x += mouseY * 0.0005
      particlesMesh.rotation.y += mouseX * 0.0005

      // Animate light nodes
      lightNode1.position.y = Math.sin(elapsedTime * 0.5) * 5
      lightNode2.position.x = Math.cos(elapsedTime * 0.3) * 5
      lightNode3.position.z = Math.sin(elapsedTime * 0.2) * 3

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      scene.clear()
    }
  }, [theme, isMobile])

  return <div ref={containerRef} className="fixed top-0 left-0 w-full h-full -z-10" />
}
