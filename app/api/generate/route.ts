import { NextRequest, NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'
import fs from 'fs'
import path from 'path'
import { buildPrompt, buildStyleInstruction } from '@/lib/promptBuilder'

const REF_IMAGES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function getRandomRefBlob(): Blob {
  const name = REF_IMAGES[Math.floor(Math.random() * REF_IMAGES.length)]
  const buffer = fs.readFileSync(path.join(process.cwd(), 'public', 'refs', name))
  return new Blob([buffer], { type: 'image/png' })
}

// Normalize whatever HF SDK v4 returns into a usable image URL or data URI
async function toImageUrl(result: unknown): Promise<string> {
  if (typeof result === 'string') return result
  if (result instanceof Blob) {
    const buf = Buffer.from(await result.arrayBuffer())
    return `data:${result.type || 'image/jpeg'};base64,${buf.toString('base64')}`
  }
  // Some models return { url: string } or { images: [{ url }] }
  const obj = result as Record<string, unknown>
  if (typeof obj?.url === 'string') return obj.url
  if (Array.isArray(obj?.images) && typeof obj.images[0]?.url === 'string') {
    return obj.images[0].url
  }
  throw new Error('Unrecognised image output format from HuggingFace')
}

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
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    if (prompt.length > 500) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })

    const hf = new HfInference(token)

    // ── STAGE 1: instruct-pix2pix ──────────────────────────────────────────
    // Model receives an actual reference hamster image from the collection.
    // It edits that image based on the instruction, preserving the crude style.
    try {
      const refBlob = getRandomRefBlob()
      const instruction = buildStyleInstruction(prompt)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await hf.imageToImage({
        model: 'timbrooks/instruct-pix2pix',
        inputs: refBlob,
        parameters: {
          prompt: instruction,
          image_guidance_scale: 1.6,
          guidance_scale: 9,
          num_inference_steps: 30,
        },
      } as Parameters<typeof hf.imageToImage>[0])

      const imageUrl = await toImageUrl(raw)
      return NextResponse.json({ imageUrl })

    } catch (img2imgErr) {
      console.warn('[generate] img2img failed, falling back to txt2img:', img2imgErr)
    }

    // ── STAGE 2: FLUX schnell fallback ─────────────────────────────────────
    // If instruct-pix2pix is unavailable (cold start / rate limit).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: buildPrompt(prompt),
      parameters: {
        num_inference_steps: 4,
        width: 1024,
        height: 1024,
      },
    } as Parameters<typeof hf.textToImage>[0])

    const imageUrl = await toImageUrl(raw)
    return NextResponse.json({ imageUrl })

  } catch (err) {
    console.error('[generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
