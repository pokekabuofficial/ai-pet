'use client'

import dynamic from 'next/dynamic'

const PetScene = dynamic(() => import('@/components/pet/PetScene'), { ssr: false })

export default function PetPage() {
  return (
    <main className="w-full h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #fff0f5 0%, #f8bbd0 100%)' }}>
      <PetScene />
    </main>
  )
}
