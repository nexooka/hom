import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { buildPrompt } from '@/lib/promptBuilder'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// Things we never want in the output — locks out the polished/animated aesthetic
const NEGATIVE_PROMPT =
  'smooth lines, clean lineart, professional art, polished, beautiful, cute kawaii, anime, manga, 3d, realistic, photorealistic, detailed fur, shading, gradients, soft lighting, disney, pixar, studio ghibli, cartoon network, well-drawn, high quality, masterpiece, 8k, detailed, intricate, watercolor, digital painting, airbrush'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured. Add it to your .env file (see .env.example).' },
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

    // Using schnell (4 steps) — faster AND produces rougher, less-polished output
    // which is exactly what we want for the crude meme sticker aesthetic.
    // flux-dev at 28 steps looks too clean/animated; schnell at 4 stays raw.
    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt: styledPrompt,
          num_outputs: 1,
          num_inference_steps: 4,
          output_format: 'png',
          output_quality: 95,
          aspect_ratio: '1:1',
          go_fast: true,
          negative_prompt: NEGATIVE_PROMPT,
        },
      }
    )

    const imageOutput = Array.isArray(output) ? output[0] : output
    const imageUrl =
      typeof imageOutput === 'string'
        ? imageOutput
        : (imageOutput as { url?: () => string })?.url?.() ?? imageOutput?.toString()

    if (!imageUrl || imageUrl === '[object Object]') {
      return NextResponse.json({ error: 'No valid image URL returned from generation' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown generation error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
