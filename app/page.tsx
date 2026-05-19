'use client'

import { useState, useEffect, useCallback } from 'react'
import GeneratorForm from '@/components/GeneratorForm'
import ImageResult from '@/components/ImageResult'
import Gallery from '@/components/Gallery'
import LoadingHamster from '@/components/LoadingHamster'
import type { GeneratedSticker } from '@/lib/types'

const STORAGE_KEY = 'hom_gallery'
const MAX_GALLERY = 24

const HAMSTER_QUOTES = [
  "Life is better with full cheeks and a cozy nest.",
  "Run fast, rest often, love everything.",
  "Every sunrise deserves a little wheel time.",
  "The secret to happiness? Stuffed cheeks and a warm blanket.",
  "Small paws, enormous heart.",
  "Joy is always just one sunflower seed away.",
  "Good things come to those who run on wheels.",
  "Be the hamster you wish to see in the world.",
  "Happiness is a warm hamster in your hands.",
  "Live curiously, snack abundantly, nap freely.",
  "The best adventures start at the bottom of a food bowl.",
  "You are braver than you look and fluffier than you know.",
  "Even the tiniest hamster casts a mighty shadow.",
  "Today is a perfect day for seeds and sunshine.",
  "Home is wherever your nest is.",
  "Cheeks full of love, heart full of warmth.",
  "Run your own race, at your own pace, on your own wheel.",
  "Little creature, enormous joy.",
  "Some days you eat the seed. Some days you are the seed. Either way, stay fluffy.",
  "The world is very big, but a hamster makes it feel just the right size.",
]

function randomQuote(exclude = -1): number {
  let idx = Math.floor(Math.random() * HAMSTER_QUOTES.length)
  if (idx === exclude && HAMSTER_QUOTES.length > 1) {
    idx = (idx + 1) % HAMSTER_QUOTES.length
  }
  return idx
}

function QuoteCard({ quote }: { quote: string }) {
  return (
    <div
      className="w-full aspect-square rounded-3xl flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #120818 0%, #0d0612 50%, #160a1e 100%)' }}
    >
      {/* Soft background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-56 h-56 rounded-full bg-pink-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-40 h-40 rounded-full bg-pink-400/6 blur-2xl" />
      </div>

      {/* Decorative border */}
      <div className="absolute inset-3 rounded-2xl border border-pink-900/20 pointer-events-none" />

      {/* Giant opening quote mark */}
      <div
        className="absolute top-6 left-8 leading-none select-none pointer-events-none font-display"
        style={{ fontSize: '140px', color: 'rgba(236,72,153,0.08)', fontStyle: 'italic', lineHeight: 1 }}
      >
        &ldquo;
      </div>

      {/* Quote text */}
      <div className="relative z-10 px-12 text-center flex flex-col items-center gap-8">
        <p
          className="font-display text-pink-100/90 leading-snug"
          style={{ fontSize: 'clamp(1.15rem, 3vw, 1.6rem)', fontStyle: 'italic', fontWeight: 300 }}
        >
          {quote}
        </p>

        {/* Divider + hamster */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-px bg-pink-800/40" />
          <span className="text-xl select-none">🐹</span>
          <div className="w-10 h-px bg-pink-800/40" />
        </div>
      </div>

      {/* Closing quote mark bottom-right */}
      <div
        className="absolute bottom-2 right-8 leading-none select-none pointer-events-none font-display"
        style={{ fontSize: '140px', color: 'rgba(236,72,153,0.08)', fontStyle: 'italic', lineHeight: 1 }}
      >
        &rdquo;
      </div>

      {/* Corner label */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
        <span className="text-pink-900/50 text-xs tracking-widest uppercase">
          ✦ hom ✦
        </span>
      </div>
    </div>
  )
}

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

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSticker, setCurrentSticker] = useState<GeneratedSticker | null>(null)
  const [gallery, setGallery] = useState<GeneratedSticker[]>([])
  const [lastPrompt, setLastPrompt] = useState('')
  const [quoteIdx, setQuoteIdx] = useState(() => randomQuote())

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
      setQuoteIdx((prev) => randomQuote(prev))
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

        <div className="flex flex-col lg:flex-row lg:gap-14 items-start">

          {/* ── LEFT: header + form ── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-14 mb-10 lg:mb-0">

            <header className="mb-10 relative">
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

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-pink-950/60" />
              <span className="text-pink-900/50 text-xs">✦</span>
              <div className="flex-1 h-px bg-pink-950/60" />
            </div>

            <GeneratorForm onGenerate={generate} isLoading={isLoading} />

            {error && (
              <div className="mt-5 p-4 rounded-2xl border border-red-900/40 bg-red-950/20">
                <p className="text-red-300 text-sm">{error}</p>
                <p className="text-red-800 text-xs mt-1">Check the terminal for details.</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: quote / loading / result ── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-8">

            {isLoading && (
              <div className="w-full rounded-3xl border border-pink-900/20 bg-pink-950/10 overflow-hidden">
                <LoadingHamster />
              </div>
            )}

            {!isLoading && (
              currentSticker
                ? <ImageResult sticker={currentSticker} onRegenerate={regenerate} isLoading={isLoading} />
                : <QuoteCard quote={HAMSTER_QUOTES[quoteIdx]} />
            )}

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
