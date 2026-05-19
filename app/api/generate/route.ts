import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, StyleReferenceImage } from '@google/genai'
import { HfInference } from '@huggingface/inference'
import fs from 'fs'
import path from 'path'
import { buildPrompt } from '@/lib/promptBuilder'

const REF_FILES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function loadRef(name: string) {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'refs', name))
  return { bytes: buf.toString('base64'), mimeType: 'image/png' }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function stylePrompt(userPrompt: string): string {
  return (
    `Generate a new hamster meme sticker that looks EXACTLY like the crude MS Paint style in the reference images above.\n` +
    `The style rules:\n` +
    `- White egg-shaped blob hamster body with thick rough jagged black outline\n` +
    `- Small scribbled messy dark marks around each eye\n` +
    `- Tiny flat pink triangle nose\n` +
    `- Zero shading, zero gradients, pure flat colors only\n` +
    `- Deliberately crude ugly badly-drawn quality — NOT polished or cute\n` +
    `- Pure black #000000 background\n\n` +
    `Hamster scenario (show this clearly and visibly): ${userPrompt}\n\n` +
    `Black background. Crude drawing style matching the examples exactly.`
  )
}

// Stage 1: Imagen 3 editImage with StyleReferenceImage
async function tryImagenStyleTransfer(ai: GoogleGenAI, userPrompt: string): Promise<string | null> {
  const ref = loadRef(pickRandom(REF_FILES))
  const styleRef = new StyleReferenceImage()
  styleRef.referenceImage = { imageBytes: ref.bytes, mimeType: ref.mimeType }
  styleRef.referenceId = 1

  const response = await ai.models.editImage({
    model: 'imagen-3.0-capability-001',
    prompt: `Crude MS Paint hamster meme sticker: ${userPrompt}. Pure black background. Same ugly drawing style as reference.`,
    referenceImages: [styleRef],
    config: { numberOfImages: 1 },
  })

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
  if (!imageBytes) return null
  const mime = response.generatedImages?.[0]?.image?.mimeType ?? 'image/png'
  return `data:${mime};base64,${imageBytes}`
}

// Stage 2: Gemini multimodal — sends reference images, generates image output
// Tries multiple model names since the preview name changes over time
async function tryGeminiMultimodal(ai: GoogleGenAI, userPrompt: string): Promise<string | null> {
  const MODELS = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
  ]

  const pickedRefs = ['ref1.png', 'ref3.png', 'ref4.png'].map(loadRef)
  const parts = [
    ...pickedRefs.map(r => ({ inlineData: { mimeType: r.mimeType, data: r.bytes } })),
    { text: stylePrompt(userPrompt) },
  ]

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: { responseModalities: ['IMAGE'] },
      })

      // Look for image in response parts
      const responseParts = response.candidates?.[0]?.content?.parts ?? []
      for (const part of responseParts) {
        const d = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData
        if (d?.data) {
          console.log(`[generate] Gemini model worked: ${model}`)
          return `data:${d.mimeType ?? 'image/png'};base64,${d.data}`
        }
      }
      if (response.data) {
        console.log(`[generate] Gemini model worked (via .data): ${model}`)
        return `data:image/png;base64,${response.data}`
      }
    } catch (e) {
      console.warn(`[generate] Gemini model ${model} failed:`, (e as Error).message?.slice(0, 120))
    }
  }
  return null
}

// Stage 3: HuggingFace FLUX text-to-image
async function tryHuggingFace(userPrompt: string, token: string): Promise<string | null> {
  const hf = new HfInference(token)
  const raw = await hf.textToImage({
    model: 'black-forest-labs/FLUX.1-schnell',
    inputs: buildPrompt(userPrompt),
    parameters: { num_inference_steps: 4, width: 1024, height: 1024 },
  } as Parameters<typeof hf.textToImage>[0])

  if (!raw) return null
  if (typeof raw === 'string') return raw
  const buf = Buffer.from(await (raw as unknown as Blob).arrayBuffer())
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_KEY
    const hfToken = process.env.HF_TOKEN

    if (!geminiKey && !hfToken) {
      return NextResponse.json(
        { error: 'No API key found. Add GEMINI_KEY to your .env (free at aistudio.google.com).' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    if (prompt.length > 500) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })

    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey })

      // Stage 1: Imagen 3 style transfer
      try {
        const url = await tryImagenStyleTransfer(ai, prompt)
        if (url) {
          console.log('[generate] ✓ Stage 1: Imagen 3 StyleReferenceImage')
          return NextResponse.json({ imageUrl: url, stage: 1 })
        }
      } catch (e) {
        console.warn('[generate] ✗ Stage 1 failed:', (e as Error).message?.slice(0, 200))
      }

      // Stage 2: Gemini multimodal
      try {
        const url = await tryGeminiMultimodal(ai, prompt)
        if (url) {
          console.log('[generate] ✓ Stage 2: Gemini multimodal')
          return NextResponse.json({ imageUrl: url, stage: 2 })
        }
      } catch (e) {
        console.warn('[generate] ✗ Stage 2 failed:', (e as Error).message?.slice(0, 200))
      }
    }

    // Stage 3: HuggingFace
    if (hfToken) {
      try {
        const url = await tryHuggingFace(prompt, hfToken)
        if (url) {
          console.log('[generate] ✓ Stage 3: HuggingFace FLUX')
          return NextResponse.json({ imageUrl: url, stage: 3 })
        }
      } catch (e) {
        console.warn('[generate] ✗ Stage 3 failed:', (e as Error).message?.slice(0, 200))
      }
    }

    return NextResponse.json(
      { error: 'All generation methods failed — check terminal for details on which step errored.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('[generate] Unhandled error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Unknown error' }, { status: 500 })
  }
}
