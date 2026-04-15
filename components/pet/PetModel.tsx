'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { EmotionType } from './PetScene'

interface PetModelProps {
  emotion: EmotionType
}

export default function PetModel({ emotion }: PetModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/soft_toy_3d_model.glb')

  // Refs for animation state
  const timeRef = useRef(0)
  const blinkTimerRef = useRef(0)
  const nextBlinkRef = useRef(3 + Math.random() * 2)
  const blinkPhaseRef = useRef(0) // 0=open, 1=closing, 2=opening
  const blinkTRef = useRef(0)
  const emotionTimerRef = useRef(0)
  const shakeRef = useRef(0)
  const shakeActiveRef = useRef(false)

  // Collect mesh refs by name
  const tailMeshes = useRef<THREE.Object3D[]>([])
  const eyelidMeshes = useRef<THREE.Object3D[]>([])

  useEffect(() => {
    tailMeshes.current = []
    eyelidMeshes.current = []
    scene.traverse((obj) => {
      const name = obj.name.toLowerCase()
      if (name.includes('tail')) tailMeshes.current.push(obj)
      if (name.includes('eyelid') || name.includes('eye_lid') || name.includes('blink')) eyelidMeshes.current.push(obj)
    })
  }, [scene])

  // Trigger shake on touch
  useEffect(() => {
    if (emotion === 'touch') {
      shakeActiveRef.current = true
      shakeRef.current = 0
    }
  }, [emotion])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta
    emotionTimerRef.current += delta
    const t = timeRef.current
    const group = groupRef.current

    // ── Defaults (reset each frame before applying emotion overrides) ──
    let scaleBase = 1.0
    let posY = 0
    let rotY = group.rotation.y
    let rotX = 0
    let rotZ = 0

    // ── Breathing (scale sin wave) ──
    let breathSpeed = 1.2
    let breathAmp = 0.03
    if (emotion === 'sleep') {
      breathSpeed = 0.4
      breathAmp = 0.015
    }
    const breathScale = scaleBase + Math.sin(t * breathSpeed * Math.PI * 2) * breathAmp

    // ── Hop (position.y sin wave) ──
    let hopAmp = 0.0
    let hopSpeed = 1.0
    if (emotion === 'idle') {
      hopAmp = 0.04
      hopSpeed = 0.8
    }

    // ── Tail wag ──
    tailMeshes.current.forEach((m) => {
      m.rotation.y = Math.sin(t * Math.PI * 2 * 1.5) * 0.4
    })

    // ── Blink ──
    blinkTimerRef.current += delta
    if (blinkPhaseRef.current === 0 && blinkTimerRef.current >= nextBlinkRef.current) {
      blinkPhaseRef.current = 1
      blinkTRef.current = 0
    }
    if (blinkPhaseRef.current === 1) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyelidMeshes.current.forEach(m => {
        if (m instanceof THREE.Mesh || (m as any).scale) {
          ;(m as any).scale.y = 1 - v
        }
      })
      if (v >= 1) { blinkPhaseRef.current = 2; blinkTRef.current = 0 }
    }
    if (blinkPhaseRef.current === 2) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyelidMeshes.current.forEach(m => {
        if ((m as any).scale) (m as any).scale.y = v
      })
      if (v >= 1) {
        blinkPhaseRef.current = 0
        blinkTimerRef.current = 0
        nextBlinkRef.current = 3 + Math.random() * 2
      }
    }

    // ── Emotion overrides ──
    if (emotion === 'angry') {
      // Violent left-right shake
      rotZ = Math.sin(t * Math.PI * 2 * 14) * 0.15
      hopAmp = 0
    }

    if (emotion === 'sad') {
      // Tilt forward + slow sway
      rotX = 0.35
      rotZ = Math.sin(t * Math.PI * 2 * 0.5) * 0.06
      hopAmp = 0
    }

    if (emotion === 'happy') {
      // Spin + bounce
      rotY += delta * 6
      hopAmp = 0.12
      hopSpeed = 2.0
    }

    if (emotion === 'sleep') {
      // Tilt to side slowly
      rotZ = Math.min(emotionTimerRef.current * 0.4, 0.45)
      hopAmp = 0
    }

    if (emotion === 'surprise') {
      // Sudden scale spike then back
      const et = Math.min(emotionTimerRef.current / 0.15, 1)
      scaleBase = 1 + Math.sin(et * Math.PI) * 0.35
      hopAmp = 0
    }

    if (emotion === 'jump') {
      // Quick high jump
      const et = emotionTimerRef.current
      posY = Math.max(0, Math.sin(et * Math.PI / 0.8) * 0.8)
      hopAmp = 0
    }

    if (emotion === 'touch') {
      // Z-axis shake 0.5s
      if (shakeActiveRef.current) {
        shakeRef.current += delta
        const progress = shakeRef.current / 0.5
        if (progress >= 1) {
          shakeActiveRef.current = false
        } else {
          const decay = 1 - progress
          rotZ = Math.sin(progress * Math.PI * 2 * 10) * 0.12 * decay
        }
      }
    }

    // Apply computed transforms
    group.position.y = posY + Math.sin(t * Math.PI * 2 * hopSpeed) * hopAmp
    group.rotation.x = rotX
    group.rotation.y = rotY
    group.rotation.z = rotZ
    group.scale.setScalar(breathScale * scaleBase)
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/soft_toy_3d_model.glb')
