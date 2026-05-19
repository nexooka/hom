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
    <main className="min-h-screen bg-black flex flex-col items-center px-4 py-12 pb-20 max-w-lg mx-auto">

      {/* Header */}
      <header className="w-full text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-5">
          <div className="w-10 h-px bg-orange-500/50" />
          <span className="text-orange-500/60 font-mono text-xs tracking-[0.3em] uppercase">sticker generator</span>
          <div className="w-10 h-px bg-orange-500/50" />
        </div>
        <h1 className="text-7xl font-black tracking-tighter mb-4 leading-none">
          <span className="text-white">H</span><span className="text-orange-500">O</span><span className="text-white">M</span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-[260px] mx-auto">
          Generate crude hand-drawn hamster stickers.<br />
          Black background — iPhone ready.
        </p>
      </header>

      {/* Generator form */}
      <div className="w-full mb-8">
        <GeneratorForm onGenerate={(p) => generate(p)} isLoading={isLoading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="w-full mb-6 p-4 rounded-2xl border border-red-800/50 bg-red-950/20">
          <p className="text-red-300 text-sm font-medium">{error}</p>
          <p className="text-red-500/60 text-xs mt-1">
            Check the terminal for details on which step failed.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="w-full mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <LoadingHamster />
        </div>
      )}

      {/* Result */}
      {currentSticker && !isLoading && (
        <div className="w-full mb-10">
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
      <footer className="mt-16 text-center flex flex-col gap-2">
        <p className="text-gray-500 text-xs">
          by <span className="text-gray-300 font-medium tracking-wide">dawid kopik</span>
        </p>
        <p className="text-gray-700 text-xs">powered by gemini</p>
      </footer>

    </main>
  )
}
