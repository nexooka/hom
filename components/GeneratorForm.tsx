'use client'

import { useState, useRef } from 'react'

const EXAMPLE_PROMPTS = [
  'sad hamster holding coffee',
  'hamster as a Formula 1 driver',
  'hamster wearing sunglasses eating watermelon',
  'hamster crying because Monday',
  'hamster as a medieval knight',
  'hamster holding a tiny guitar',
  'hamster in a suit looking stressed',
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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={'Describe your hamster...\ne.g. sad hamster holding coffee'}
          maxLength={500}
          rows={3}
          disabled={isLoading}
          className="w-full bg-[#0d0d0d] border border-white/10 focus:border-orange-500/60 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm resize-none outline-none transition-colors duration-200 disabled:opacity-50 leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <span className="absolute bottom-3 right-4 text-gray-600 text-xs">
          {prompt.length}/500
        </span>
      </div>

      {/* Example chips */}
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2.5">
          Try one →
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => useExamplePrompt(ex)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/8 hover:border-orange-500/30 transition-all duration-150 disabled:opacity-30"
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
        className="w-full py-4 rounded-2xl font-bold text-black text-base tracking-wide uppercase transition-all duration-200
          bg-orange-500 hover:bg-orange-400 active:scale-[0.98]
          disabled:opacity-30 disabled:cursor-not-allowed
          shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
      >
        {isLoading ? 'Generating...' : 'Generate Hamster'}
      </button>
    </form>
  )
}
