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
  } catch { return [] }
}

function saveGallery(stickers: GeneratedSticker[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers.slice(-MAX_GALLERY)))
  } catch {}
}

function EmptyState() {
  const refs = ['/refs/ref1.png', '/refs/ref2.png', '/refs/ref3.png', '/refs/ref4.png', '/refs/ref5.png']
  return (
    <div className="w-full aspect-square rounded-3xl overflow-hidden relative bg-[#09060c]">
      {/* Collage grid: big left + 2 right top + 3 bottom */}
      <div className="w-full h-full flex flex-col gap-1 p-1">

        {/* Top row: 1 large + 2 stacked */}
        <div className="flex gap-1 flex-[3]">
          <div className="flex-[5] rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refs[0]} alt="" className="w-full h-full object-cover object-center" />
          </div>
          <div className="flex-[3] flex flex-col gap-1">
            <div className="flex-1 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refs[1]} alt="" className="w-full h-full object-cover object-center" />
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refs[2]} alt="" className="w-full h-full object-cover object-center" />
            </div>
          </div>
        </div>

        {/* Bottom row: 2 equal */}
        <div className="flex gap-1 flex-[2]">
          <div className="flex-1 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refs[3]} alt="" className="w-full h-full object-cover object-center" />
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refs[4]} alt="" className="w-full h-full object-cover object-center" />
          </div>
        </div>

      </div>

      {/* Top label pill */}
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
        <span className="bg-black/50 backdrop-blur-md text-pink-300/80 text-xs px-4 py-1.5 rounded-full border border-pink-900/40 tracking-widest uppercase">
          example style
        </span>
      </div>

      {/* Bottom gradient + text */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 py-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(9,6,12,0.85) 0%, transparent 100%)' }}
      >
        <p className="text-pink-200/70 text-sm font-display italic text-center">
          your result will appear here ♥
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSticker, setCurrentSticker] = useState<GeneratedSticker | null>(null)
  const [gallery, setGallery] = useState<GeneratedSticker[]>([])
  const [lastPrompt, setLastPrompt] = useState('')

  useEffect(() => { setGallery(loadGallery()) }, [])

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
      if (!response.ok || data.error) throw new Error(data.error || 'Generation failed')

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

  function regenerate() { if (lastPrompt) generate(lastPrompt) }
  function clearGallery() { setGallery([]); localStorage.removeItem(STORAGE_KEY) }

  return (
    <main className="min-h-screen px-5 py-10 lg:px-12 lg:py-14">
      <div className="max-w-5xl mx-auto">

        {/* Two-column grid on desktop */}
        <div className="flex flex-col lg:flex-row lg:gap-14 items-start">

          {/* ── LEFT COLUMN: header + form ── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-14 mb-10 lg:mb-0">

            {/* Header */}
            <header className="mb-10 relative">
              {/* Glow */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.15) 0%, transparent 70%)' }}
              />

              <p className="text-pink-800 text-xs tracking-[0.4em] uppercase mb-5 relative">
                ✦ sticker generator ✦
              </p>

              <h1
                className="font-logo text-[80px] leading-none tracking-tight mb-4 relative"
                style={{ fontWeight: 900 }}
              >
                <span className="text-pink-100">H</span>
                <span className="text-pink-400">o</span>
                <span className="text-pink-100">m</span>
              </h1>

              <p className="text-pink-400/70 text-sm leading-relaxed mb-1">
                give your hamster a moment. ♥
              </p>
              <p className="text-pink-900 text-xs">
                crude ms paint stickers — black bg, iphone ready
              </p>
            </header>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-pink-950/60" />
              <span className="text-pink-900/50 text-xs">✦</span>
              <div className="flex-1 h-px bg-pink-950/60" />
            </div>

            {/* Form */}
            <GeneratorForm onGenerate={generate} isLoading={isLoading} />

            {/* Error */}
            {error && (
              <div className="mt-5 p-4 rounded-2xl border border-red-900/40 bg-red-950/20">
                <p className="text-red-300 text-sm">{error}</p>
                <p className="text-red-800 text-xs mt-1">Check the terminal for details.</p>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: result + gallery ── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-8">

            {/* Loading */}
            {isLoading && (
              <div className="w-full rounded-3xl border border-pink-900/20 bg-pink-950/10 overflow-hidden">
                <LoadingHamster />
              </div>
            )}

            {/* Result or empty state */}
            {!isLoading && (
              currentSticker
                ? <ImageResult sticker={currentSticker} onRegenerate={regenerate} isLoading={isLoading} />
                : <EmptyState />
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <Gallery
                stickers={gallery}
                activeId={currentSticker?.id ?? null}
                onSelect={setCurrentSticker}
                onClear={clearGallery}
              />
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-px bg-pink-950/60" />
            <span className="text-pink-900/40 text-xs">✦</span>
            <div className="w-10 h-px bg-pink-950/60" />
          </div>
          <p className="text-pink-900 text-xs">
            made with ♥ by <span className="text-pink-600 font-medium tracking-wide">dawid kopik</span>
          </p>
          <p className="text-pink-950 text-xs">powered by gemini</p>
        </footer>

      </div>
    </main>
  )
}
