'use client'

import { useState, useEffect, useCallback } from 'react'
import GeneratorForm from '@/components/GeneratorForm'
import ImageResult from '@/components/ImageResult'
import Gallery from '@/components/Gallery'
import LoadingHamster from '@/components/LoadingHamster'
import type { GeneratedSticker } from '@/lib/types'

const STORAGE_KEY = 'hom_gallery'
const MAX_GALLERY = 24

function loadGallery(): GeneratedSticker[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveGallery(stickers: GeneratedSticker[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers.slice(-MAX_GALLERY)))
  } catch {}
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSticker, setCurrentSticker] = useState<GeneratedSticker | null>(null)
  const [gallery, setGallery] = useState<GeneratedSticker[]>([])
  const [lastPrompt, setLastPrompt] = useState('')

  useEffect(() => {
    setGallery(loadGallery())
  }, [])

  const generate = useCallback(async (prompt: string) => {
    setIsLoading(true)
    setError(null)
    setLastPrompt(prompt)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Generation failed')
      }

      const sticker: GeneratedSticker = {
        id: Date.now().toString(),
        prompt,
        imageUrl: data.imageUrl,
        timestamp: Date.now(),
      }

      setCurrentSticker(sticker)
      setGallery((prev) => {
        const next = [...prev, sticker].slice(-MAX_GALLERY)
        saveGallery(next)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [])

  function regenerate() {
    if (lastPrompt) generate(lastPrompt)
  }

  function clearGallery() {
    setGallery([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-5 pt-16 pb-24 max-w-md mx-auto">

      {/* Header */}
      <header className="w-full text-center mb-14 relative">
        {/* Warm glow behind title */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)',
          }}
        />

        <p className="text-[#7a6040] text-xs tracking-[0.4em] uppercase mb-6 relative">
          ✦ hamster sticker generator ✦
        </p>

        <h1
          className="font-display text-[88px] leading-none tracking-tight mb-5 relative"
          style={{ fontStyle: 'italic', fontWeight: 900 }}
        >
          <span className="text-[#f0e0c8]">H</span>
          <span className="text-orange-400">o</span>
          <span className="text-[#f0e0c8]">m</span>
        </h1>

        <p className="text-[#a08060] text-sm leading-relaxed">
          give your hamster a moment.
        </p>
      </header>

      {/* Divider */}
      <div className="w-full flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-[#2a1a08]" />
        <span className="text-[#3a2810] text-xs">✦</span>
        <div className="flex-1 h-px bg-[#2a1a08]" />
      </div>

      {/* Generator form */}
      <div className="w-full mb-8">
        <GeneratorForm onGenerate={(p) => generate(p)} isLoading={isLoading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="w-full mb-6 p-4 rounded-2xl border border-red-900/40 bg-red-950/20">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-700 text-xs mt-1">
            Check the terminal for more details.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="w-full mb-6 rounded-2xl border border-[#2a1a08] bg-[#0e0904] overflow-hidden">
          <LoadingHamster />
        </div>
      )}

      {/* Result */}
      {currentSticker && !isLoading && (
        <div className="w-full mb-12">
          <ImageResult
            sticker={currentSticker}
            onRegenerate={regenerate}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="w-full">
          <Gallery
            stickers={gallery}
            activeId={currentSticker?.id ?? null}
            onSelect={setCurrentSticker}
            onClear={clearGallery}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-center flex flex-col gap-2">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-6 h-px bg-[#2a1a08]" />
          <span className="text-[#3a2810] text-xs">✦</span>
          <div className="w-6 h-px bg-[#2a1a08]" />
        </div>
        <p className="text-[#6a4820] text-xs">
          made with ♥ by{' '}
          <span className="text-[#c4a060] font-medium tracking-wide">dawid kopik</span>
        </p>
        <p className="text-[#3a2810] text-xs">powered by gemini</p>
      </footer>

    </main>
  )
}
