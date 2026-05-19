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
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-spin-slow" />
        <div
          className="absolute inset-3 rounded-full border border-dashed border-orange-400/20"
          style={{ animation: 'spin 3s linear infinite reverse' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl select-none" style={{ animation: 'bounce 2s ease-in-out infinite' }}>🐹</span>
        </div>
      </div>

      <div className="text-center px-6">
        <p className="text-orange-400/80 text-xs tracking-[0.3em] uppercase mb-2">
          generating...
        </p>
        <p className="text-[#9a7040] text-sm transition-all duration-500 italic">
          {LOADING_MESSAGES[msgIndex]}
        </p>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-orange-500/60"
            style={{ animation: `bounce 1.4s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
