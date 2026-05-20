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
  { text: "The purpose of life is to live it, to taste experience to the utmost.", author: "Eleanor Roosevelt" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama XIV" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Tell me, what is it you plan to do with your one wild and precious life?", author: "Mary Oliver" },
  { text: "Joy is the simplest form of gratitude.", author: "Karl Barth" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "To live is the rarest thing in the world. Most people just exist.", author: "Oscar Wilde" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Spread love everywhere you go. Let no one ever leave you without feeling happier.", author: "Mother Teresa" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive.", author: "Marcus Aurelius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Life is not measured by the breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" },
]

function randomQuote(exclude = -1): number {
  let idx = Math.floor(Math.random() * HAMSTER_QUOTES.length)
  if (idx === exclude && HAMSTER_QUOTES.length > 1) {
    idx = (idx + 1) % HAMSTER_QUOTES.length
  }
  return idx
}

function QuoteCard({ quote }: { quote: typeof HAMSTER_QUOTES[0] }) {
  return (
    <div
      className="w-full aspect-square rounded-3xl flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #160a20 0%, #0d0612 40%, #130818 100%)' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-pink-700/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-pink-500/6 blur-3xl" />
      </div>

      {/* Inner frame */}
      <div className="absolute inset-4 rounded-2xl border border-pink-900/15 pointer-events-none" />

      {/* Giant decorative opening mark — anchored top-left */}
      <div
        className="absolute -top-4 left-6 font-display select-none pointer-events-none"
        style={{ fontSize: '220px', lineHeight: 1, color: 'rgba(236,72,153,0.07)', fontStyle: 'italic' }}
      >
        &ldquo;
      </div>

      {/* Quote text — fills the vertical space */}
      <div className="flex-1 flex items-center px-10 lg:px-12 relative z-10">
        <p
          className="font-display text-pink-50 leading-relaxed"
          style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.9rem)', fontStyle: 'italic', fontWeight: 300 }}
        >
          {quote.text}
        </p>
      </div>

      {/* Attribution — pinned to bottom */}
      <div className="px-10 lg:px-12 pb-9 relative z-10">
        <div className="w-8 h-px bg-pink-600/40 mb-3" />
        <p className="text-pink-400/70 text-sm font-logo" style={{ fontWeight: 600 }}>
          — {quote.author}
        </p>
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
  const [quoteIdx, setQuoteIdx] = useState(0)

  useEffect(() => {
    setGallery(loadGallery())
    setQuoteIdx(randomQuote())
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
                generate yourself a hom. any hom you want.
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
                : <QuoteCard quote={HAMSTER_QUOTES[quoteIdx] ?? HAMSTER_QUOTES[0]} />
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
            made by <span className="text-pink-600 font-medium tracking-wide">dawid kopik</span>
          </p>
        </footer>

      </div>
    </main>
  )
}
