import { NextRequest, NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'
import fs from 'fs'
import path from 'path'
import { buildInstruction, buildPrompt } from '@/lib/promptBuilder'

const REF_FILES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function loadRefBlob(): Blob {
  const buf = fs.readFileSync(
    path.join(process.cwd(), 'public', 'refs', pickRandom(REF_FILES))
  )
  return new Blob([buf], { type: 'image/png' })
}

// ── Stage 1: HuggingFace instruct-pix2pix (img2img — model SEES reference) ──
// Edits a real reference hamster based on the instruction.
// Preserves the crude style because it starts from an actual example.
async function tryImg2Img(prompt: string, token: string): Promise<string | null> {
  const hf = new HfInference(token)
  const ref = loadRefBlob()

  const blob = await hf.imageToImage({
    model: 'timbrooks/instruct-pix2pix',
    inputs: ref,
    parameters: {
      prompt: buildInstruction(prompt),
      image_guidance_scale: 1.8,
      guidance_scale: 10,
      num_inference_steps: 25,
    },
  } as Parameters<typeof hf.imageToImage>[0])

  if (!blob) return null
  const buf = Buffer.from(await (blob as unknown as Blob).arrayBuffer())
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

// ── Stage 2: HuggingFace FLUX text-to-image ──────────────────────────────────
async function tryFlux(prompt: string, token: string): Promise<string | null> {
  const hf = new HfInference(token)
  const raw = await hf.textToImage({
    model: 'black-forest-labs/FLUX.1-schnell',
    inputs: buildPrompt(prompt),
    parameters: { num_inference_steps: 4, width: 1024, height: 1024 },
  } as Parameters<typeof hf.textToImage>[0])

  if (!raw) return null
  if (typeof raw === 'string') return raw
  const buf = Buffer.from(await (raw as unknown as Blob).arrayBuffer())
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

// ── Stage 3: Pollinations.ai — NO API KEY NEEDED ─────────────────────────────
// Always available as last resort. Uses FLUX under the hood.
async function tryPollinations(prompt: string): Promise<string | null> {
  const params = new URLSearchParams({
    model: 'flux',
    width: '1024',
    height: '1024',
    seed: String(Math.floor(Math.random() * 999999)),
    nologo: 'true',
    enhance: 'false',
  })
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(buildPrompt(prompt))}?${params}`
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!res.ok) return null
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

export async function POST(req: NextRequest) {
  try {
    const hfToken = process.env.HF_TOKEN

    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    if (prompt.length > 500) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })

    if (hfToken) {
      // Stage 1: img2img — model sees a real reference hamster
      try {
        const url = await tryImg2Img(prompt, hfToken)
        if (url) {
          console.log('[generate] ✓ Stage 1: instruct-pix2pix img2img')
          return NextResponse.json({ imageUrl: url })
        }
      } catch (e) {
        console.warn('[generate] ✗ Stage 1 failed:', (e as Error).message?.slice(0, 150))
      }

      // Stage 2: FLUX text-to-image
      try {
        const url = await tryFlux(prompt, hfToken)
        if (url) {
          console.log('[generate] ✓ Stage 2: HuggingFace FLUX')
          return NextResponse.json({ imageUrl: url })
        }
      } catch (e) {
        console.warn('[generate] ✗ Stage 2 failed:', (e as Error).message?.slice(0, 150))
      }
    } else {
      console.log('[generate] No HF_TOKEN — skipping stages 1 & 2, using Pollinations')
    }

    // Stage 3: Pollinations — no API key needed
    try {
      const url = await tryPollinations(prompt)
      if (url) {
        console.log('[generate] ✓ Stage 3: Pollinations.ai')
        return NextResponse.json({ imageUrl: url })
      }
    } catch (e) {
      console.warn('[generate] ✗ Stage 3 failed:', (e as Error).message?.slice(0, 150))
    }

    return NextResponse.json(
      { error: 'Generation failed — check terminal for details.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('[generate] Unhandled error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Unknown error' }, { status: 500 })
  }
}
