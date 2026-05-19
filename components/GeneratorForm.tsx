'use client'

import { useState, useRef } from 'react'

const EXAMPLE_PROMPTS = [
  'sad hamster holding coffee',
  'hamster as a Formula 1 driver',
  'hamster eating watermelon with sunglasses',
  'hamster crying because it\'s Monday',
  'hamster as a medieval knight',
  'hamster holding a tiny guitar',
  'hamster in a suit, completely stressed',
  'hamster in a tiny gaming chair',
  'hamster as a pirate captain',
  'hamster playing video games',
  'hamster doing yoga',
  'hamster as a chef',
]

interface Props {
  onGenerate: (prompt: string) => void
  isLoading: boolean
}

export default function GeneratorForm({ onGenerate, isLoading }: Props) {
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return
    onGenerate(prompt.trim())
  }

  function useExample(ex: string) {
    setPrompt(ex)
    textareaRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"what is your hamster up to?\ne.g. sad hamster holding coffee"}
          maxLength={500}
          rows={4}
          disabled={isLoading}
          className="w-full bg-pink-950/20 border border-pink-900/30 focus:border-pink-500/50 rounded-2xl px-4 py-4 text-pink-100 placeholder-pink-900/60 text-sm resize-none outline-none transition-colors duration-200 disabled:opacity-50 leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <span className="absolute bottom-3 right-4 text-pink-900/50 text-xs">
          {prompt.length}/500
        </span>
      </div>

      {/* Example chips */}
      <div>
        <p className="text-pink-800 text-xs uppercase tracking-widest mb-3">
          need inspiration? ✦
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => useExample(ex)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-pink-950/30 text-pink-700 hover:text-pink-200 hover:bg-pink-900/40 border border-pink-900/30 hover:border-pink-500/40 transition-all duration-150 disabled:opacity-30"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full py-4 rounded-2xl font-semibold text-white text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #db2777 100%)',
          boxShadow: isLoading || !prompt.trim() ? 'none' : '0 0 40px rgba(236,72,153,0.35), 0 4px 20px rgba(236,72,153,0.2)',
        }}
      >
        {isLoading ? 'working on it...' : '✦ generate sticker'}
      </button>
    </form>
  )
}
