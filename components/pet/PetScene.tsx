'use client'

import { useState, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import PetModel from './PetModel'
import PetBubble from './PetBubble'
import PetControls from './PetControls'

export type EmotionType = 'idle' | 'angry' | 'sad' | 'happy' | 'sleep' | 'surprise' | 'jump' | 'touch'

export type BubbleMessage = {
  id: number
  text: string
}

export default function PetScene() {
  const [emotion, setEmotion] = useState<EmotionType>('idle')
  const [bubbles, setBubbles] = useState<BubbleMessage[]>([])
  const [showFlash, setShowFlash] = useState(false)
  const bubbleIdRef = useRef(0)
  const interactionTimeRef = useRef(0)

  const triggerFlash = useCallback(() => {
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 150)
  }, [])

  const addBubble = useCallback((text: string) => {
    const id = ++bubbleIdRef.current
    setBubbles(prev => [...prev, { id, text }])
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== id))
    }, 2500)
  }, [])

  const triggerEmotion = useCallback((e: EmotionType, msg?: string) => {
    setEmotion(e)
    interactionTimeRef.current = Date.now()
    if (msg) addBubble(msg)
    if (e !== 'sleep') {
      setTimeout(() => setEmotion('idle'), e === 'surprise' ? 1000 : e === 'jump' ? 800 : 2500)
    }
  }, [addBubble])

  const handleTouch = useCallback(() => {
    triggerEmotion('touch', 'なでなで〜💕')
  }, [triggerEmotion])

  return (
    <div className="relative w-full h-screen">
      {/* Bubbles */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-start pt-16 gap-2">
        {bubbles.map(b => (
          <PetBubble key={b.id} text={b.text} />
        ))}
      </div>

      {/* Angry Aura */}
      {emotion === 'angry' && (
        <div className="absolute inset-0 z-10 pointer-events-none animate-pulse"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,50,50,0.18) 0%, transparent 70%)' }} />
      )}

      {/* Sleep ZZZ */}
      {emotion === 'sleep' && (
        <div className="absolute top-1/4 right-1/3 z-20 pointer-events-none text-4xl font-bold text-indigo-300 animate-bounce select-none">
          ZZZ...
        </div>
      )}

      {/* Pink Flash on Touch */}
      {showFlash && (
        <div 
          className="absolute inset-0 z-30 pointer-events-none"
          style={{ background: 'rgba(255, 182, 193, 0.5)' }}
        />
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        className="w-full h-full"
        onClick={handleTouch}
        onPointerDown={handleTouch}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-3, 3, 3]} intensity={0.6} color="#ffb7c5" />
        <PetModel emotion={emotion} onFlash={triggerFlash} interactionTime={interactionTimeRef.current} />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Controls */}
      <PetControls triggerEmotion={triggerEmotion} currentEmotion={emotion} />
    </div>
  )
}
