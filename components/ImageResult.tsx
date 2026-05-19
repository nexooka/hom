'use client'

import { useState } from 'react'
import type { GeneratedSticker } from '@/lib/types'

interface Props {
  sticker: GeneratedSticker
  onRegenerate: () => void
  isLoading: boolean
}

export default function ImageResult({ sticker, onRegenerate, isLoading }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function downloadImage() {
    setDownloading(true)
    try {
      const response = await fetch(sticker.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hamster-${sticker.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab
      window.open(sticker.imageUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(sticker.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-400 font-mono text-xs uppercase tracking-widest">Result</h2>
        <button
          onClick={copyPrompt}
          className="text-gray-600 hover:text-orange-400 font-mono text-xs transition-colors"
        >
          {copied ? '✓ copied' : '⌘ copy prompt'}
        </button>
      </div>

      {/* Image on pure black background */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[#222]" style={{ aspectRatio: '1/1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker.imageUrl}
          alt={sticker.prompt}
          className="w-full h-full object-contain"
          style={{ backgroundColor: '#000000' }}
        />
      </div>

      {/* Prompt display */}
      <p className="text-gray-600 font-mono text-xs px-1 italic truncate">
        &quot;{sticker.prompt}&quot;
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="flex-1 py-3 rounded-xl font-mono font-bold text-black uppercase tracking-wider transition-all duration-150
            bg-orange-500 hover:bg-orange-400 active:scale-95
            disabled:opacity-50 shadow-lg shadow-orange-500/20"
        >
          {downloading ? 'Saving...' : '↓ Download PNG'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          title="Generate a variation of this hamster"
          className="px-4 py-3 rounded-xl font-mono text-gray-400 uppercase tracking-wider
            bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-orange-500/40
            hover:text-orange-400 active:scale-95 transition-all duration-150
            disabled:opacity-30"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
