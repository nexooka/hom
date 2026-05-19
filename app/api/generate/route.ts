import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import fs from 'fs'
import path from 'path'
import { buildPrompt } from '@/lib/promptBuilder'

// Reference image filenames stored in /public/refs/
const REF_IMAGES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

// Read a reference image from disk and return as a base64 data URI.
// This is the key mechanism: every generation is anchored to an actual
// example from the hamster sticker collection, so the model SEES the style.
function getRandomRefDataUri(): string {
  const name = REF_IMAGES[Math.floor(Math.random() * REF_IMAGES.length)]
  const filePath = path.join(process.cwd(), 'public', 'refs', name)
  const buffer = fs.readFileSync(filePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

const NEGATIVE_PROMPT =
  'smooth lines, clean lineart, professional art, polished, beautiful, cute kawaii, anime, manga, 3d render, realistic, photorealistic, detailed fur, shading, gradients, soft lighting, disney, pixar, studio ghibli, well-drawn, high quality, masterpiece, 8k, watercolor, digital painting'

export async function POST(req: NextRequest) {
  try {
    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured. Add it to your .env file (see .env.example).' },
        { status: 500 }
      )
    }

    fal.config({ credentials: falKey })

    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Prompt too long (max 500 chars)' }, { status: 400 })
    }

    const styledPrompt = buildPrompt(prompt)
    const refImageDataUri = getRandomRefDataUri()

    // fal.ai FLUX img2img — the model receives a real reference hamster image.
    // strength=0.85: strong enough to change content (accessories, expression)
    // while preserving the visual style DNA from the reference image.
    const result = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
      input: {
        image_url: refImageDataUri,
        prompt: styledPrompt,
        strength: 0.85,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        seed: Math.floor(Math.random() * 999999),
        output_format: 'png',
      },
    })

    const images = (result.data as { images?: { url: string }[] })?.images
    const imageUrl = images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from fal.ai' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
