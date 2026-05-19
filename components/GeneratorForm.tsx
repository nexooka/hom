'use client'

import { useState, useRef } from 'react'

const EXAMPLE_PROMPTS = [
  'sad hamster holding coffee',
  'hamster dressed as a Formula 1 driver',
  'hamster wearing sunglasses and eating watermelon',
  'hamster crying because Monday started',
  'hamster as a medieval knight',
  'hamster holding a tiny guitar',
  'hamster in a business suit looking stressed',
  'hamster sitting in a tiny gaming chair',
  'hamster as a pirate captain',
  'hamster playing video games',
  'hamster doing yoga',
  'hamster as a chef holding a spoon',
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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      {/* Prompt textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your hamster...&#10;e.g. sad hamster holding coffee"
          maxLength={500}
          rows={3}
          disabled={isLoading}
          className="w-full bg-[#111] border-2 border-[#333] focus:border-orange-500 rounded-xl px-4 py-3 text-white placeholder-gray-700 font-mono text-sm resize-none outline-none transition-colors duration-200 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <span className="absolute bottom-2 right-3 text-gray-700 text-xs font-mono">
          {prompt.length}/500
        </span>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-gray-700 font-mono text-xs uppercase tracking-widest mb-2">
          Try one of these
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => useExamplePrompt(ex)}
              disabled={isLoading}
              className="text-xs font-mono px-2 py-1 rounded-lg bg-[#1a1a1a] text-gray-500 hover:text-orange-400 hover:bg-[#222] border border-[#2a2a2a] hover:border-orange-500/40 transition-all duration-150 disabled:opacity-30 truncate max-w-[220px]"
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
        className="w-full py-4 rounded-xl font-mono font-bold text-black text-lg tracking-wider uppercase transition-all duration-200
          bg-orange-500 hover:bg-orange-400 active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-500
          shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
      >
        {isLoading ? 'Generating...' : 'Generate Hamster ↗'}
      </button>
    </form>
  )
}
