'use client'

import dynamic from 'next/dynamic'

const PetScene = dynamic(() => import('@/components/pet/PetScene'), { ssr: false })

export default function PetPage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <PetScene />
    </main>
  )
}
