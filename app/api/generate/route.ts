import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/promptBuilder'

const NEGATIVE_PROMPT =
  'smooth lines, clean lineart, professional art, polished, beautiful, cute kawaii, anime, manga, 3d, realistic, photorealistic, detailed fur, shading, gradients, soft lighting, disney, pixar, studio ghibli, cartoon network, well-drawn, high quality, masterpiece, 8k, detailed, intricate, watercolor, digital painting'

export async function POST(req: NextRequest) {
  try {
    const token = process.env.HF_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'HF_TOKEN is not configured. Add it to your .env file (see .env.example).' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Prompt too long (max 500 chars)' }, { status: 400 })
    }

    const styledPrompt = buildPrompt(prompt)

    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({
          inputs: styledPrompt,
          parameters: {
            num_inference_steps: 4,
            width: 1024,
            height: 1024,
            negative_prompt: NEGATIVE_PROMPT,
          },
        }),
        // HF cold starts can take up to 60s
        signal: AbortSignal.timeout(120_000),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('[/api/generate] HF error:', response.status, text)
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'Model is loading, please try again in 20 seconds.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: `Generation failed (${response.status}): ${text}` },
        { status: 500 }
      )
    }

    // HF returns raw image bytes — convert to base64 data URL
    const imageBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const imageUrl = `data:${contentType};base64,${base64}`

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown generation error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
