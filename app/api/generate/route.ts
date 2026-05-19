import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/promptBuilder'

const NEGATIVE_PROMPT =
  'smooth lines, clean lineart, professional art, polished, beautiful, cute kawaii, anime, manga, 3d, realistic, photorealistic, detailed fur, shading, gradients, soft lighting, disney, pixar, studio ghibli, well-drawn, high quality, masterpiece, 8k, watercolor, digital painting'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Prompt too long (max 500 chars)' }, { status: 400 })
    }

    const styledPrompt = buildPrompt(prompt)
    const seed = Math.floor(Math.random() * 999999)

    const params = new URLSearchParams({
      model: 'flux',
      width: '1024',
      height: '1024',
      seed: String(seed),
      nologo: 'true',
      enhance: 'false', // keep our style prompt exactly as-is
      negative: NEGATIVE_PROMPT,
    })

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?${params}`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(120_000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Generation failed (${response.status})` },
        { status: 500 }
      )
    }

    const imageBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const imageUrl = `data:image/jpeg;base64,${base64}`

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
