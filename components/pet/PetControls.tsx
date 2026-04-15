'use client'

import type { EmotionType } from './PetScene'

interface PetControlsProps {
  triggerEmotion: (e: EmotionType, msg?: string) => void
  currentEmotion: EmotionType
}

const buttons: { emotion: EmotionType; label: string; msg: string; color: string; active: string }[] = [
  { emotion: 'jump',     label: 'ジャンプ ↑',    msg: '',              color: 'bg-sky-100 text-sky-700 border-sky-300',        active: 'bg-sky-300' },
  { emotion: 'happy',   label: '喜ぶ 💕',        msg: 'やったー！💕', color: 'bg-pink-100 text-pink-700 border-pink-300',      active: 'bg-pink-300' },
  { emotion: 'angry',   label: '怒る 😤',        msg: 'むきーっ！😤', color: 'bg-red-100 text-red-700 border-red-300',         active: 'bg-red-300' },
  { emotion: 'sad',     label: '悲しむ 😢',      msg: 'うぅ…😢',      color: 'bg-blue-100 text-blue-700 border-blue-300',      active: 'bg-blue-300' },
  { emotion: 'sleep',   label: '眠る 💤',        msg: '',              color: 'bg-indigo-100 text-indigo-700 border-indigo-300', active: 'bg-indigo-300' },
  { emotion: 'surprise',label: '驚く 😲',        msg: 'びっくり！😲', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', active: 'bg-yellow-300' },
]

export default function PetControls({ triggerEmotion, currentEmotion }: PetControlsProps) {
  return (
    <>
      {/* Title */}
      <div
        className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none"
      >
        <h1
          className="text-2xl font-bold tracking-wide select-none"
          style={{
            color: '#c2185b',
            textShadow: '0 2px 8px rgba(194,24,91,0.15)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🐾 AI ペット
        </h1>
      </div>

      {/* Hint */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <p className="text-sm text-pink-400 select-none" style={{ fontFamily: 'system-ui, sans-serif' }}>
          タップ・クリックでなでなで / ドラッグで回転
        </p>
      </div>

      {/* Emotion Buttons */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-wrap justify-center gap-2 px-4">
        {buttons.map(({ emotion, label, msg, color, active }) => (
          <button
            key={emotion}
            onClick={() => triggerEmotion(emotion, msg || undefined)}
            className={`
              px-4 py-2 rounded-full border-2 font-semibold text-sm shadow-md
              transition-all duration-150 active:scale-95
              ${currentEmotion === emotion ? active + ' scale-105 shadow-lg' : color}
            `}
            style={{
              fontFamily: 'system-ui, sans-serif',
              backdropFilter: 'blur(6px)',
              background: currentEmotion === emotion ? undefined : 'rgba(255,255,255,0.7)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
