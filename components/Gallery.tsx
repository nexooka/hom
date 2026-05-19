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
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs uppercase tracking-widest">
          History <span className="text-gray-600">({stickers.length})</span>
        </span>
        <button
          onClick={onClear}
          className="text-gray-600 hover:text-red-400 text-xs transition-colors"
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
            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-150 active:scale-95 ${
              activeId === sticker.id
                ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                : 'border-white/10 hover:border-orange-500/40'
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
