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

  function useExamplePrompt(example: string) {
    setPrompt(example)
    textareaRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"what is your hamster up to?\ne.g. sad hamster holding coffee"}
          maxLength={500}
          rows={3}
          disabled={isLoading}
          className="w-full bg-[#0e0b07] border border-[#2a1a08] focus:border-orange-500/50 rounded-2xl px-4 py-4 text-[#f0e0c8] placeholder-[#4a3020] text-sm resize-none outline-none transition-colors duration-200 disabled:opacity-50 leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <span className="absolute bottom-3 right-4 text-[#3a2810] text-xs">
          {prompt.length}/500
        </span>
      </div>

      {/* Examples */}
      <div>
        <p className="text-[#6a4820] text-xs uppercase tracking-widest mb-3">
          need inspiration?
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => useExamplePrompt(ex)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-[#120d06] text-[#9a7040] hover:text-[#f0e0c8] hover:bg-[#1e1408] border border-[#2a1a08] hover:border-orange-500/30 transition-all duration-200 disabled:opacity-30"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full py-4 rounded-2xl font-semibold text-[#080604] text-sm tracking-widest uppercase transition-all duration-200 relative overflow-hidden
          disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        style={{
          background: isLoading || !prompt.trim()
            ? '#6b3a10'
            : 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea6d10 100%)',
          boxShadow: isLoading || !prompt.trim()
            ? 'none'
            : '0 0 40px rgba(249,115,22,0.3), 0 4px 20px rgba(249,115,22,0.2)',
        }}
      >
        {isLoading ? 'working on it...' : '✦ generate sticker'}
      </button>
    </form>
  )
}
