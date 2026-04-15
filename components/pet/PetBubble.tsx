'use client'

import { useEffect, useState } from 'react'

interface PetBubbleProps {
  text: string
}

export default function PetBubble({ text }: PetBubbleProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger fade-in
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className="transition-all duration-300 pointer-events-none select-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
      }}
    >
      <div
        className="px-5 py-2 rounded-full text-lg font-bold shadow-lg"
        style={{
          background: 'rgba(255,255,255,0.85)',
          color: '#d63384',
          backdropFilter: 'blur(8px)',
          border: '2px solid #f8bbd0',
          boxShadow: '0 4px 20px rgba(214,51,132,0.15)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {text}
      </div>
    </div>
  )
}
