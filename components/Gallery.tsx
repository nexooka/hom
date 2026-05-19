'use client'

import type { GeneratedSticker } from '@/lib/types'

interface Props {
  stickers: GeneratedSticker[]
  activeId: string | null
  onSelect: (sticker: GeneratedSticker) => void
  onClear: () => void
}

export default function Gallery({ stickers, activeId, onSelect, onClear }: Props) {
  if (stickers.length === 0) return null

  return (
    <div className="w-full">

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-[#2a1a08]" />
        <span className="text-[#3a2810] text-xs">✦</span>
        <div className="flex-1 h-px bg-[#2a1a08]" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-[#9a7040] text-xs uppercase tracking-widest">
          your collection
          <span className="text-[#4a3020] ml-2">({stickers.length})</span>
        </span>
        <button
          onClick={onClear}
          className="text-[#4a3020] hover:text-red-400 text-xs transition-colors"
        >
          clear all
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {[...stickers].reverse().map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            title={sticker.prompt}
            className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 active:scale-95 ${
              activeId === sticker.id
                ? 'border-orange-500/70 shadow-[0_0_16px_rgba(249,115,22,0.35)] scale-105'
                : 'border-[#2a1a08] hover:border-orange-500/30 hover:scale-105'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sticker.imageUrl}
              alt={sticker.prompt}
              className="w-full h-full object-cover bg-black"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
