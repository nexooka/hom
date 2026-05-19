import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, StyleReferenceImage } from '@google/genai'
import { HfInference } from '@huggingface/inference'
import fs from 'fs'
import path from 'path'
import { buildPrompt } from '@/lib/promptBuilder'

const REF_FILES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function loadRef(name: string): { bytes: string; mimeType: string } {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'refs', name))
  return { bytes: buf.toString('base64'), mimeType: 'image/png' }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// What to tell the model — send this with the reference images
function stylePrompt(userPrompt: string): string {
  return `You are generating a hamster meme sticker. Look at the reference images above — those define the EXACT visual style you must copy perfectly:
- White egg-shaped blob hamster body, thick jagged black outline (not smooth)
- Small scribbled dark marks around each eye, looking deliberately messy
- Tiny flat pink triangle nose centered on the face
- Zero shading, zero gradients, pure flat colors only
- Deliberately crude, ugly, MS Paint quality drawing — NOT polished, NOT cute, NOT professional
- Pure black #000000 background

Now generate a NEW hamster sticker in that exact same crude style where: ${userPrompt}

Make sure the scenario (${userPrompt}) is clearly visible and depicted in the image. Pure black background.`
}

// ── Stage 1: Imagen 3 editImage with StyleReferenceImage ─────────────────────
// The model extracts the visual style from the reference image and applies it.
async function tryImagenStyleTransfer(
  ai: GoogleGenAI,
  userPrompt: string
): Promise<string | null> {
  const ref = loadRef(pickRandom(REF_FILES))

  const styleRef = new StyleReferenceImage()
  styleRef.referenceImage = { imageBytes: ref.bytes, mimeType: ref.mimeType }
  styleRef.referenceId = 1

  const response = await ai.models.editImage({
    model: 'imagen-3.0-capability-001',
    prompt: `Hamster meme sticker in the crude MS Paint style of the reference image: ${userPrompt}. Black background.`,
    referenceImages: [styleRef],
    config: { numberOfImages: 1 },
  })

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
  if (!imageBytes) return null
  const mime = response.generatedImages?.[0]?.image?.mimeType ?? 'image/png'
  return `data:${mime};base64,${imageBytes}`
}

// ── Stage 2: Gemini 2.0 Flash multimodal — sees reference images ─────────────
// Sends 3 real reference hamsters + prompt, generates a new image.
async function tryGeminiMultimodal(
  ai: GoogleGenAI,
  userPrompt: string
): Promise<string | null> {
  // Pick 3 diverse reference examples so the model gets a strong style signal
  const pickedRefs = ['ref1.png', 'ref3.png', 'ref4.png'].map(loadRef)

  const parts = [
    ...pickedRefs.map(r => ({ inlineData: { mimeType: r.mimeType, data: r.bytes } })),
    { text: stylePrompt(userPrompt) },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
    },
  })

  // Extract image bytes from the first image part in the response
  const responseParts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of responseParts) {
    const d = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData
    if (d?.data) {
      return `data:${d.mimeType ?? 'image/png'};base64,${d.data}`
    }
  }
  // Try the convenience .data property (concatenated inline data)
  if (response.data) return `data:image/png;base64,${response.data}`
  return null
}

// ── Stage 3: HuggingFace FLUX fallback (text-to-image) ───────────────────────
async function tryHuggingFace(userPrompt: string, token: string): Promise<string | null> {
  const hf = new HfInference(token)
  const raw = await hf.textToImage({
    model: 'black-forest-labs/FLUX.1-schnell',
    inputs: buildPrompt(userPrompt),
    parameters: { num_inference_steps: 4, width: 1024, height: 1024 },
  } as Parameters<typeof hf.textToImage>[0])

  if (!raw) return null
  // In HF SDK v4 textToImage returns string URL; earlier versions return Blob
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
        { error: 'Set GEMINI_KEY in your .env (free at aistudio.google.com)' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const prompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    if (prompt.length > 500) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })

    let imageUrl: string | null = null

    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey })

      // Try Imagen 3 style transfer first
      try {
        imageUrl = await tryImagenStyleTransfer(ai, prompt)
        if (imageUrl) {
          console.log('[generate] Used: Imagen 3 StyleReferenceImage')
          return NextResponse.json({ imageUrl })
        }
      } catch (e) {
        console.warn('[generate] Imagen 3 style transfer failed:', (e as Error).message)
      }

      // Try Gemini multimodal generation (sees reference images)
      try {
        imageUrl = await tryGeminiMultimodal(ai, prompt)
        if (imageUrl) {
          console.log('[generate] Used: Gemini 2.0 Flash multimodal')
          return NextResponse.json({ imageUrl })
        }
      } catch (e) {
        console.warn('[generate] Gemini multimodal failed:', (e as Error).message)
      }
    }

    // Last resort: HuggingFace FLUX text-to-image
    if (hfToken) {
      try {
        imageUrl = await tryHuggingFace(prompt, hfToken)
        if (imageUrl) {
          console.log('[generate] Used: HuggingFace FLUX fallback')
          return NextResponse.json({ imageUrl })
        }
      } catch (e) {
        console.warn('[generate] HuggingFace failed:', (e as Error).message)
      }
    }

    return NextResponse.json({ error: 'All generation methods failed. Check your API key.' }, { status: 500 })

  } catch (err) {
    console.error('[generate] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
