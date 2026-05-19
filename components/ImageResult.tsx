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
      a.download = `hom-${sticker.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
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

      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs uppercase tracking-widest">Result</span>
        <button
          onClick={copyPrompt}
          className="text-gray-500 hover:text-orange-400 text-xs transition-colors"
        >
          {copied ? '✓ copied' : 'copy prompt'}
        </button>
      </div>

      {/* Image */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/[0.07]" style={{ aspectRatio: '1/1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker.imageUrl}
          alt={sticker.prompt}
          className="w-full h-full object-contain"
          style={{ backgroundColor: '#000000' }}
        />
      </div>

      {/* Prompt */}
      <p className="text-gray-500 text-xs px-1 italic truncate">
        &quot;{sticker.prompt}&quot;
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="flex-1 py-3.5 rounded-2xl font-bold text-black uppercase tracking-wide text-sm transition-all duration-150
            bg-orange-500 hover:bg-orange-400 active:scale-[0.98]
            disabled:opacity-50
            shadow-[0_0_25px_rgba(249,115,22,0.2)] hover:shadow-[0_0_35px_rgba(249,115,22,0.35)]"
        >
          {downloading ? 'Saving...' : '↓ Download PNG'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          title="Regenerate"
          className="px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white
            bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20
            active:scale-[0.98] transition-all duration-150 disabled:opacity-30 text-base"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
