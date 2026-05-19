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
        <h2 className="text-gray-500 font-mono text-xs uppercase tracking-widest">
          History ({stickers.length})
        </h2>
        <button
          onClick={onClear}
          className="text-gray-700 hover:text-red-400 font-mono text-xs transition-colors"
        >
          clear all
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {[...stickers].reverse().map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            title={sticker.prompt}
            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-150 active:scale-95 ${
              activeId === sticker.id
                ? 'border-orange-500 scale-105'
                : 'border-[#333] hover:border-orange-500/50'
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
