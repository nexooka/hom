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

      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 h-px bg-pink-950/50" />
        <span className="text-pink-900/40 text-xs">✦</span>
        <div className="flex-1 h-px bg-pink-950/50" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-pink-700 text-xs uppercase tracking-widest">
          your collection
          <span className="text-pink-900/60 ml-2">({stickers.length})</span>
        </span>
        <button onClick={onClear} className="text-pink-900/60 hover:text-red-400 text-xs transition-colors">
          clear all
        </button>
      </div>

      {/* Grid layout — much better than horizontal scroll */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...stickers].reverse().map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            title={sticker.prompt}
            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 active:scale-95 hover:scale-105 ${
              activeId === sticker.id
                ? 'border-pink-500/70 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-105'
                : 'border-pink-900/30 hover:border-pink-500/30'
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
