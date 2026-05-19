'use client'

import { REFERENCE_IMAGES } from '@/lib/promptBuilder'

const CAPTIONS = [
  'classic derp',
  'maximum anger',
  'the hat era',
  'pizza time',
  'jail arc',
]

export default function StyleExamples() {
  return (
    <div className="w-full">
      <p className="text-gray-600 font-mono text-xs uppercase tracking-widest mb-3">
        Style reference — all generated hamsters must look like these
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {REFERENCE_IMAGES.map((ref, i) => (
          <div key={ref} className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#333] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ref} alt={CAPTIONS[i]} className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-700 font-mono text-[10px] text-center">{CAPTIONS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
