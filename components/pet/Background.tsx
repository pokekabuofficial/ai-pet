'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, useTexture } from '@react-three/drei'
import * as THREE from 'three'

type BackgroundType = 'outside' | 'room'

interface BackgroundProps {
  type: BackgroundType
}

export default function Background({ type }: BackgroundProps) {
  const cloudsRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (type === 'outside' && cloudsRef.current) {
      cloudsRef.current.position.x += 0.002
      if (cloudsRef.current.position.x > 8) {
        cloudsRef.current.position.x = -8
      }
    }
  })

  if (type === 'outside') {
    return (
      <group>
        {/* Sky gradient background */}
        <mesh position={[0, 0, -5]} scale={[20, 20, 1]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial>
            <canvasTexture attach="map" args={[createSkyGradient()]} />
          </meshBasicMaterial>
        </mesh>

        {/* Ground */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[20, 20, 1]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#4a7c59" />
        </mesh>

        {/* Clouds */}
        <group ref={cloudsRef}>
          <Cloud position={[-4, 2, -2]} scale={1.2} />
          <Cloud position={[0, 2.5, -1.5]} scale={1.5} />
          <Cloud position={[4, 2, -2.2]} scale={1} />
          <Cloud position={[-2, 1.5, -1]} scale={0.8} />
          <Cloud position={[6, 1.8, -1.8]} scale={1.3} />
        </group>
      </group>
    )
  }

  // Room background
  return (
    <group>
      {/* Room background (back wall) */}
      <mesh position={[0, 0, -3]} scale={[20, 15, 1]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial
          color="#e8d4c4"
          emissive="#fae5d3"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Floor with wood texture */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[20, 20, 1]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#8b6f47"
          roughness={0.7}
          metalness={0}
        />
      </mesh>

      {/* Window */}
      <group position={[6, 1.2, -2.95]}>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[2, 2, 0.1]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>

        {/* Window pane (glass) */}
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[1.8, 1.8]} />
          <meshStandardMaterial
            color="#87ceeb"
            emissive="#add8e6"
            emissiveIntensity={0.2}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Left curtain */}
        <mesh position={[-1.1, 0, 0.15]} scale={[1, 1.05, 1]}>
          <planeGeometry args={[0.9, 2]} />
          <meshStandardMaterial color="#d4a5a5" />
        </mesh>

        {/* Right curtain */}
        <mesh position={[1.1, 0, 0.15]} scale={[1, 1.05, 1]}>
          <planeGeometry args={[0.9, 2]} />
          <meshStandardMaterial color="#d4a5a5" />
        </mesh>
      </group>

      {/* Ceiling */}
      <mesh position={[0, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f5e6d3" />
      </mesh>
    </group>
  )
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.5, 0, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#f0f0f0" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#f0f0f0" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#f0f0f0" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

function createSkyGradient(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#87ceeb')
  gradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return canvas
}
