'use client'

import { useEffect, useState } from 'react'
import { LOADING_MESSAGES } from '@/lib/promptBuilder'

export default function LoadingHamster() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-32 h-32">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-spin-slow" />
        {/* Inner ring opposite direction */}
        <div
          className="absolute inset-2 rounded-full border-4 border-dashed border-orange-400/40"
          style={{ animation: 'spin 2s linear infinite reverse' }}
        />
        {/* Hamster face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl select-none animate-bounce-slow">🐹</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-orange-400 text-sm tracking-widest uppercase animate-pulse">
          Generating...
        </p>
        <p className="text-gray-400 text-xs mt-2 transition-all duration-500">
          {LOADING_MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500"
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
