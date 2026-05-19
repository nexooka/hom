'use client'

import { useState, useEffect, useCallback } from 'react'
import GeneratorForm from '@/components/GeneratorForm'
import ImageResult from '@/components/ImageResult'
import Gallery from '@/components/Gallery'
import StyleExamples from '@/components/StyleExamples'
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
  } catch {
    // localStorage may be unavailable
  }
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
    if (lastPrompt) {
      generate(lastPrompt)
    }
  }

  function clearGallery() {
    setGallery([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center px-4 py-8 pb-16 max-w-xl mx-auto">

      {/* Header */}
      <header className="w-full text-center mb-8">
        <h1 className="text-4xl font-black font-mono tracking-tight mb-1">
          <span className="text-orange-500">HOM</span>
        </h1>
        <p className="text-gray-600 font-mono text-xs tracking-widest uppercase">
          Hamster Sticker Generator
        </p>
        <p className="text-gray-700 font-mono text-xs mt-2 max-w-xs mx-auto">
          Generate custom hamster meme stickers. Black background ready for iPhone stickers.
        </p>
      </header>

      {/* Style examples */}
      <div className="w-full mb-8">
        <StyleExamples />
      </div>

      {/* Generator form */}
      <div className="w-full mb-8">
        <GeneratorForm onGenerate={(p) => generate(p)} isLoading={isLoading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="w-full mb-6 p-4 rounded-xl border border-red-900 bg-red-950/30">
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <p className="text-red-700 font-mono text-xs mt-1">
            Make sure REPLICATE_API_TOKEN is set in your .env file.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="w-full mb-6 rounded-2xl border border-[#222] bg-[#111] overflow-hidden">
          <LoadingHamster />
        </div>
      )}

      {/* Result */}
      {currentSticker && !isLoading && (
        <div className="w-full mb-8">
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
      <footer className="mt-12 text-center">
        <p className="text-gray-800 font-mono text-xs">
          Style locked to the exact hamster meme collection.
        </p>
        <p className="text-gray-900 font-mono text-xs mt-1">
          Powered by FLUX Dev via Replicate
        </p>
      </footer>
    </main>
  )
}
