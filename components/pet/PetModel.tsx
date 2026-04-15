'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { EmotionType } from './PetScene'

interface PetModelProps {
  emotion: EmotionType
  onFlash?: () => void
  interactionTime?: number
}

// Heart particle component
function HeartParticle({ startPos, onComplete }: { startPos: [number, number, number]; onComplete: () => void }) {
  const ref = useRef<THREE.Group>(null!)
  const velocityRef = useRef({
    x: (Math.random() - 0.5) * 3,
    y: 2 + Math.random() * 2,
    z: (Math.random() - 0.5) * 3,
  })
  const lifeRef = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    lifeRef.current += delta
    
    // Apply gravity
    velocityRef.current.y -= delta * 5
    
    ref.current.position.x += velocityRef.current.x * delta
    ref.current.position.y += velocityRef.current.y * delta
    ref.current.position.z += velocityRef.current.z * delta
    
    // Fade out
    const opacity = Math.max(0, 1 - lifeRef.current / 1.5)
    ref.current.scale.setScalar(opacity)
    
    if (lifeRef.current > 1.5) {
      onComplete()
    }
  })

  return (
    <group ref={ref} position={startPos}>
      <Html center style={{ pointerEvents: 'none' }}>
        <span className="text-2xl select-none" style={{ opacity: 1 }}>❤️</span>
      </Html>
    </group>
  )
}

// Tear particle component
function TearParticle({ startPos, onComplete }: { startPos: [number, number, number]; onComplete: () => void }) {
  const ref = useRef<THREE.Mesh>(null!)
  const lifeRef = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    lifeRef.current += delta
    
    // Fall down
    ref.current.position.y -= delta * 1.5
    
    // Fade out
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0, 1 - lifeRef.current / 2)
    
    if (lifeRef.current > 2) {
      onComplete()
    }
  })

  return (
    <mesh ref={ref} position={startPos}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#4fc3f7" transparent opacity={0.8} />
    </mesh>
  )
}

export default function PetModel({ emotion, onFlash, interactionTime = 0 }: PetModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/soft_toy_3d_model.glb')
  const { camera } = useThree()

  // Refs for animation state
  const timeRef = useRef(0)
  const blinkTimerRef = useRef(0)
  const nextBlinkRef = useRef(3 + Math.random() * 2)
  const blinkPhaseRef = useRef(0)
  const blinkTRef = useRef(0)
  const emotionTimerRef = useRef(0)
  const shakeRef = useRef(0)
  const shakeActiveRef = useRef(false)
  const prevEmotionRef = useRef<EmotionType>('idle')
  const landingSquashRef = useRef(0)
  const wasJumpingRef = useRef(false)
  const lastInteractionRef = useRef(0)
  const targetRotYRef = useRef(0)

  // Particle states
  const [hearts, setHearts] = useState<{ id: number; pos: [number, number, number] }[]>([])
  const [tears, setTears] = useState<{ id: number; pos: [number, number, number] }[]>([])
  const heartIdRef = useRef(0)
  const tearIdRef = useRef(0)
  const tearTimerRef = useRef(0)

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

  // Trigger shake + flash + hearts on touch
  useEffect(() => {
    if (emotion === 'touch' && prevEmotionRef.current !== 'touch') {
      shakeActiveRef.current = true
      shakeRef.current = 0
      
      // Trigger flash
      onFlash?.()
      
      // Spawn 3-5 hearts
      const count = 3 + Math.floor(Math.random() * 3)
      const newHearts: { id: number; pos: [number, number, number] }[] = []
      for (let i = 0; i < count; i++) {
        newHearts.push({
          id: ++heartIdRef.current,
          pos: [
            (Math.random() - 0.5) * 0.5,
            0.3 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.5,
          ],
        })
      }
      setHearts(prev => [...prev, ...newHearts])
    }
    
    // Reset emotion timer when emotion changes
    if (emotion !== prevEmotionRef.current) {
      emotionTimerRef.current = 0
    }
    prevEmotionRef.current = emotion
  }, [emotion, onFlash])

  const removeHeart = (id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id))
  }

  const removeTear = (id: number) => {
    setTears(prev => prev.filter(t => t.id !== id))
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta
    emotionTimerRef.current += delta
    const t = timeRef.current
    const group = groupRef.current

    // Defaults
    let scaleBase = 1.0
    let scaleY = 1.0
    let posY = 0
    let rotY = group.rotation.y
    let rotX = 0
    let rotZ = 0

    // Always face camera direction
    const targetCameraRotY = Math.atan2(
      camera.position.x - group.position.x,
      camera.position.z - group.position.z
    )
    targetRotYRef.current = targetCameraRotY

    // Check if should return to front (3 seconds after last interaction)
    const timeSinceInteraction = Date.now() - interactionTime
    const shouldReturnToFront = timeSinceInteraction > 3000

    // Smooth rotation based on state
    if (emotion === 'happy') {
      // Always look at camera during happy state
      rotY = THREE.MathUtils.lerp(group.rotation.y, targetCameraRotY, delta * 3)
    } else if (shouldReturnToFront) {
      // Smoothly return to front (rotY = 0) after 3 seconds
      rotY = THREE.MathUtils.lerp(group.rotation.y, 0, delta * 0.8)
    } else {
      // Face camera normally
      rotY = THREE.MathUtils.lerp(group.rotation.y, targetCameraRotY, delta * 2)
    }


    // Breathing
    let breathSpeed = 1.2
    let breathAmp = 0.03
    if (emotion === 'sleep') {
      breathSpeed = 0.4
      breathAmp = 0.015
    }
    const breathScale = scaleBase + Math.sin(t * breathSpeed * Math.PI * 2) * breathAmp

    // Hop
    let hopAmp = 0.0
    let hopSpeed = 1.0
    if (emotion === 'idle') {
      hopAmp = 0.04
      hopSpeed = 0.8
    }

    // Tail wag
    tailMeshes.current.forEach((m) => {
      m.rotation.y = Math.sin(t * Math.PI * 2 * 1.5) * 0.4
    })

    // Blink
    blinkTimerRef.current += delta
    if (blinkPhaseRef.current === 0 && blinkTimerRef.current >= nextBlinkRef.current) {
      blinkPhaseRef.current = 1
      blinkTRef.current = 0
    }
    if (blinkPhaseRef.current === 1) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyelidMeshes.current.forEach(m => {
        if ((m as THREE.Mesh).scale) {
          (m as THREE.Mesh).scale.y = 1 - v
        }
      })
      if (v >= 1) { blinkPhaseRef.current = 2; blinkTRef.current = 0 }
    }
    if (blinkPhaseRef.current === 2) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyelidMeshes.current.forEach(m => {
        if ((m as THREE.Mesh).scale) (m as THREE.Mesh).scale.y = v
      })
      if (v >= 1) {
        blinkPhaseRef.current = 0
        blinkTimerRef.current = 0
        nextBlinkRef.current = 3 + Math.random() * 2
      }
    }

    // Landing squash decay
    if (landingSquashRef.current > 0) {
      landingSquashRef.current -= delta * 4
      if (landingSquashRef.current < 0) landingSquashRef.current = 0
      scaleY = 1 - landingSquashRef.current * 0.3
    }

    // Emotion overrides
    if (emotion === 'angry') {
      rotZ = Math.sin(t * Math.PI * 2 * 14) * 0.15
      hopAmp = 0
    }

    if (emotion === 'sad') {
      rotX = 0.35
      rotZ = Math.sin(t * Math.PI * 2 * 0.5) * 0.06
      hopAmp = 0
      
      // Spawn tears periodically
      tearTimerRef.current += delta
      if (tearTimerRef.current > 0.4) {
        tearTimerRef.current = 0
        const side = Math.random() > 0.5 ? 0.15 : -0.15
        setTears(prev => [...prev, {
          id: ++tearIdRef.current,
          pos: [side, 0.4, 0.3],
        }])
      }
    } else {
      tearTimerRef.current = 0
    }

    if (emotion === 'happy') {
      // Spin + face camera gradually
      hopAmp = 0.12
      hopSpeed = 2.0
    }

    if (emotion === 'sleep') {
      rotZ = Math.min(emotionTimerRef.current * 0.4, 0.45)
      hopAmp = 0
    }

    if (emotion === 'surprise') {
      const et = Math.min(emotionTimerRef.current / 0.15, 1)
      scaleBase = 1 + Math.sin(et * Math.PI) * 0.35
      hopAmp = 0
    }

    if (emotion === 'jump') {
      // Higher jump (2x) with squash on landing
      const et = emotionTimerRef.current
      const jumpDuration = 0.8
      const jumpHeight = 1.6 // doubled from 0.8
      posY = Math.max(0, Math.sin(et * Math.PI / jumpDuration) * jumpHeight)
      hopAmp = 0
      
      // Track if we were in air
      if (posY > 0.1) {
        wasJumpingRef.current = true
      }
      // Detect landing
      if (wasJumpingRef.current && posY < 0.05 && et > jumpDuration * 0.5) {
        landingSquashRef.current = 1
        wasJumpingRef.current = false
      }
    } else {
      wasJumpingRef.current = false
    }

    if (emotion === 'touch') {
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

    // Apply transforms
    group.position.y = posY + Math.sin(t * Math.PI * 2 * hopSpeed) * hopAmp
    group.rotation.x = rotX
    group.rotation.y = rotY
    group.rotation.z = rotZ
    group.scale.set(breathScale * scaleBase, breathScale * scaleBase * scaleY, breathScale * scaleBase)
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} rotation={[0, Math.PI, 0]} />
      
      {/* Red point light for angry aura */}
      {emotion === 'angry' && (
        <pointLight
          position={[0, 0.5, 0]}
          color="#ff3333"
          intensity={3}
          distance={3}
        />
      )}
      
      {/* Heart particles */}
      {hearts.map(h => (
        <HeartParticle
          key={h.id}
          startPos={h.pos}
          onComplete={() => removeHeart(h.id)}
        />
      ))}
      
      {/* Tear particles */}
      {tears.map(t => (
        <TearParticle
          key={t.id}
          startPos={t.pos}
          onComplete={() => removeTear(t.id)}
        />
      ))}
    </group>
  )
}

useGLTF.preload('/soft_toy_3d_model.glb')
