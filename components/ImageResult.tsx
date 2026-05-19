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

      <div className="flex items-center justify-between">
        <span className="text-pink-700 text-xs uppercase tracking-widest">your hamster ♥</span>
        <button onClick={copyPrompt} className="text-pink-800 hover:text-pink-400 text-xs transition-colors">
          {copied ? '✓ copied' : 'copy prompt'}
        </button>
      </div>

      {/* Image */}
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          aspectRatio: '1/1',
          boxShadow: '0 0 0 1px rgba(236,72,153,0.15), 0 0 80px rgba(236,72,153,0.08)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker.imageUrl}
          alt={sticker.prompt}
          className="w-full h-full object-contain"
          style={{ backgroundColor: '#000000' }}
        />
      </div>

      {/* Prompt */}
      <p className="text-pink-800/80 text-xs px-1 italic text-center truncate">
        &ldquo;{sticker.prompt}&rdquo;
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="flex-1 py-4 rounded-2xl font-semibold text-white uppercase tracking-widest text-xs transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #db2777 100%)',
            boxShadow: '0 0 30px rgba(236,72,153,0.25)',
          }}
        >
          {downloading ? 'saving...' : '↓ download png'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          title="Try again"
          className="px-5 py-4 rounded-2xl text-pink-700 hover:text-pink-200 bg-pink-950/20 hover:bg-pink-900/30 border border-pink-900/30 hover:border-pink-500/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-30 text-base"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
