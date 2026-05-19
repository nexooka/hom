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
    <div className="w-full flex flex-col gap-5">

      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[#6a4820] text-xs uppercase tracking-widest">your hamster</span>
        <button
          onClick={copyPrompt}
          className="text-[#6a4820] hover:text-orange-400 text-xs transition-colors"
        >
          {copied ? '✓ copied' : 'copy prompt'}
        </button>
      </div>

      {/* Image — warm frame */}
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          aspectRatio: '1/1',
          boxShadow: '0 0 0 1px #2a1a08, 0 0 60px rgba(249,115,22,0.08)',
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
      <p className="text-[#7a5030] text-xs px-1 italic truncate text-center">
        &ldquo;{sticker.prompt}&rdquo;
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="flex-1 py-4 rounded-2xl font-semibold text-[#080604] uppercase tracking-widest text-xs transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea6d10 100%)',
            boxShadow: '0 0 30px rgba(249,115,22,0.25)',
          }}
        >
          {downloading ? 'saving...' : '↓ download png'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          title="Try again"
          className="px-5 py-4 rounded-2xl text-[#9a7040] hover:text-[#f0e0c8] bg-[#0e0b07] hover:bg-[#1a1208] border border-[#2a1a08] hover:border-orange-500/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-30 text-base"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
