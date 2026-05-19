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
    <div className="flex flex-col items-center gap-6 py-16 relative overflow-hidden" style={{ aspectRatio: '1/1', justifyContent: 'center' }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border border-pink-500/20 animate-spin-slow" />
        <div className="absolute inset-3 rounded-full border border-dashed border-pink-400/15 animate-spin-reverse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl select-none animate-float">🐹</span>
        </div>
      </div>

      <div className="text-center px-8 relative z-10">
        <p className="text-pink-500/70 text-xs tracking-[0.3em] uppercase mb-3">
          generating...
        </p>
        <p className="text-pink-700 text-base font-display italic transition-all duration-500">
          {LOADING_MESSAGES[msgIndex]}
        </p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-pink-500/50"
            style={{ animation: `bounce 1.4s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
