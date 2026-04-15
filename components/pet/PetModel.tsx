'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
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
        <span className="text-2xl select-none" style={{ opacity: 1 }}>&#10084;&#65039;</span>
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

  // Bone refs
  const rootBoneRef = useRef<THREE.Bone | null>(null)
  const spineBoneRef = useRef<THREE.Bone | null>(null)
  const earBonesRef = useRef<THREE.Bone[]>([])
  const tailBonesRef = useRef<THREE.Bone[]>([])
  const eyeBonesRef = useRef<THREE.Bone[]>([])

  // Initial bone transforms (to reset)
  const initialBoneStates = useRef<Map<THREE.Bone, { rotation: THREE.Euler; scale: THREE.Vector3; position: THREE.Vector3 }>>(new Map())

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

  // Particle states
  const [hearts, setHearts] = useState<{ id: number; pos: [number, number, number] }[]>([])
  const [tears, setTears] = useState<{ id: number; pos: [number, number, number] }[]>([])
  const heartIdRef = useRef(0)
  const tearIdRef = useRef(0)
  const tearTimerRef = useRef(0)

  // Traverse scene to find bones
  useEffect(() => {
    earBonesRef.current = []
    tailBonesRef.current = []
    eyeBonesRef.current = []
    initialBoneStates.current.clear()

    scene.traverse((obj) => {
      if (obj instanceof THREE.Bone) {
        const name = obj.name.toLowerCase()

        // Store initial state
        initialBoneStates.current.set(obj, {
          rotation: obj.rotation.clone(),
          scale: obj.scale.clone(),
          position: obj.position.clone(),
        })

        // Find root bone (usually first bone or named "root", "armature", "hips")
        if (!rootBoneRef.current && (name.includes('root') || name.includes('armature') || name.includes('hips') || obj.parent instanceof THREE.SkinnedMesh || obj.parent?.type === 'Bone' === false)) {
          // Check if this is a top-level bone
          if (!(obj.parent instanceof THREE.Bone)) {
            rootBoneRef.current = obj
          }
        }

        // Find spine bone
        if (name.includes('spine') || name.includes('torso') || name.includes('body')) {
          spineBoneRef.current = obj
        }

        // Find ear bones
        if (name.includes('ear')) {
          earBonesRef.current.push(obj)
        }

        // Find tail bones
        if (name.includes('tail')) {
          tailBonesRef.current.push(obj)
        }

        // Find eye/eyelid bones
        if (name.includes('eye') || name.includes('lid')) {
          eyeBonesRef.current.push(obj)
        }
      }
    })

    // Fallback: if no root found, use first bone encountered
    if (!rootBoneRef.current) {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Bone && !rootBoneRef.current) {
          rootBoneRef.current = obj
        }
      })
    }
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
    const rootBone = rootBoneRef.current
    const spineBone = spineBoneRef.current || rootBone

    // Reset bones to initial state each frame
    initialBoneStates.current.forEach((state, bone) => {
      bone.rotation.copy(state.rotation)
      bone.scale.copy(state.scale)
      bone.position.copy(state.position)
    })

    // Model always faces front (rotation.y = 0)
    group.rotation.y = 0

    // === BREATHING ===
    let breathSpeed = 1.2
    let breathAmp = 0.03
    if (emotion === 'sleep') {
      breathSpeed = 0.4
      breathAmp = 0.015
    }
    const breathScale = 1.0 + Math.sin(t * breathSpeed * Math.PI * 2) * breathAmp
    if (spineBone) {
      spineBone.scale.set(breathScale, breathScale, breathScale)
    }

    // === EAR TWITCH ===
    earBonesRef.current.forEach((ear) => {
      const earWiggle = Math.sin(t * Math.PI * 2 * 2.5) * 0.08
      ear.rotation.z += earWiggle
    })

    // === TAIL WAG ===
    tailBonesRef.current.forEach((tail, index) => {
      const tailWag = Math.sin(t * Math.PI * 2 * 1.5 + index * 0.5) * 0.4
      tail.rotation.y += tailWag
    })

    // === BLINK ===
    blinkTimerRef.current += delta
    if (blinkPhaseRef.current === 0 && blinkTimerRef.current >= nextBlinkRef.current) {
      blinkPhaseRef.current = 1
      blinkTRef.current = 0
    }
    if (blinkPhaseRef.current === 1) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyeBonesRef.current.forEach((eye) => {
        // Close eye by rotating X axis
        eye.rotation.x += v * 0.5
      })
      if (v >= 1) { blinkPhaseRef.current = 2; blinkTRef.current = 0 }
    }
    if (blinkPhaseRef.current === 2) {
      blinkTRef.current += delta * 10
      const v = Math.min(blinkTRef.current, 1)
      eyeBonesRef.current.forEach((eye) => {
        // Open eye
        eye.rotation.x += (1 - v) * 0.5
      })
      if (v >= 1) {
        blinkPhaseRef.current = 0
        blinkTimerRef.current = 0
        nextBlinkRef.current = 3 + Math.random() * 2
      }
    }

    // === IDLE HOP ===
    let posY = 0
    if (emotion === 'idle') {
      posY = Math.sin(t * Math.PI * 2 * 0.8) * 0.04
    }

    // === LANDING SQUASH ===
    let scaleY = 1.0
    if (landingSquashRef.current > 0) {
      landingSquashRef.current -= delta * 4
      if (landingSquashRef.current < 0) landingSquashRef.current = 0
      scaleY = 1 - landingSquashRef.current * 0.3
    }

    // === EMOTION ANIMATIONS ===
    
    // TOUCH: Z axis shake on root
    if (emotion === 'touch') {
      if (shakeActiveRef.current) {
        shakeRef.current += delta
        const progress = shakeRef.current / 0.5
        if (progress >= 1) {
          shakeActiveRef.current = false
        } else if (rootBone) {
          const decay = 1 - progress
          rootBone.rotation.z += Math.sin(progress * Math.PI * 2 * 10) * 0.12 * decay
        }
      }
    }

    // ANGRY: Intense left-right shake
    if (emotion === 'angry' && rootBone) {
      rootBone.rotation.z += Math.sin(t * Math.PI * 2 * 14) * 0.15
    }

    // SAD: Forward lean + tears
    if (emotion === 'sad') {
      if (rootBone) {
        rootBone.rotation.x += 0.35
        rootBone.rotation.z += Math.sin(t * Math.PI * 2 * 0.5) * 0.06
      }
      
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

    // HAPPY: Y axis fast rotation + bounce
    if (emotion === 'happy') {
      if (rootBone) {
        rootBone.rotation.y += t * 3 // Fast spin
      }
      posY = Math.abs(Math.sin(t * Math.PI * 2 * 2.0)) * 0.12
    }

    // SLEEP: Slow Z tilt
    if (emotion === 'sleep' && rootBone) {
      rootBone.rotation.z += Math.min(emotionTimerRef.current * 0.4, 0.45)
    }

    // SURPRISE: Scale spike
    if (emotion === 'surprise' && rootBone) {
      const et = Math.min(emotionTimerRef.current / 0.15, 1)
      const surpriseScale = 1 + Math.sin(et * Math.PI) * 0.35
      rootBone.scale.set(surpriseScale, surpriseScale, surpriseScale)
    }

    // JUMP: Higher jump (2x) with squash
    if (emotion === 'jump') {
      const et = emotionTimerRef.current
      const jumpDuration = 0.8
      const jumpHeight = 1.6
      posY = Math.max(0, Math.sin(et * Math.PI / jumpDuration) * jumpHeight)
      
      if (posY > 0.1) {
        wasJumpingRef.current = true
      }
      if (wasJumpingRef.current && posY < 0.05 && et > jumpDuration * 0.5) {
        landingSquashRef.current = 1
        wasJumpingRef.current = false
      }
    } else {
      wasJumpingRef.current = false
    }

    // Apply group transforms
    group.position.y = -0.5 + posY
    group.scale.set(1, scaleY, 1)
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} />
      
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
