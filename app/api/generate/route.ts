import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

const REF_FILES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function loadRef(name: string) {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'refs', name))
  return { bytes: buf.toString('base64'), mimeType: 'image/png' }
}

function buildGeminiPrompt(userPrompt: string): string {
  return [
    'You are given reference hamster sticker images. Study EVERY reference image extremely carefully before generating.',
    'Your ONLY job is to reproduce this exact crude hand-drawn style. Do NOT use your default art style.',
    '',
    '=== BODY SHAPE — most important, get this right ===',
    '• WIDE TRIANGLE / CONE — narrow flat top, extremely wide base. Like a mountain or doorstop.',
    '• NOT a circle, NOT an egg, NOT a round blob — a TRIANGLE.',
    '• The sides angle steeply outward from top to bottom.',
    '• Flat pure white fill. Thick rough jagged black outline, wobbly and uneven like a fat marker.',
    '• Two tiny curved stub arms at the very bottom corners ("c" or "∫" shapes).',
    '',
    '=== EYES — match the emotional vibe of the prompt ===',
    `The hamster is: "${userPrompt}"`,
    '• Read the mood. Happy prompt = happy eyes (wide open, bright, upward curve). Sad = droopy heavy lids. Angry = furrowed sharp lines. Surprised = wide circles. Tired = half-closed. Scared = huge wide ovals.',
    '• Eyes are always crude and hand-drawn — but the SHAPE changes to match the emotion.',
    '• Around each eye: messy scribbled dark marks, like smeared mascara. More intense for dramatic moods, softer for happy/calm.',
    '• Never use the exact same eye style for every image — vary it to match the feeling.',
    '',
    '=== NOSE ===',
    '• Small pink rounded triangle or blob, centered, flat color, no gradient.',
    '',
    '=== ART QUALITY ===',
    '• MS Paint quality, drawn by a child with a thick pixel brush.',
    '• ZERO polish, ZERO smooth curves, ZERO shading, ZERO 3D.',
    '• NO cute/kawaii, NO anime, NO Pixar style.',
    '',
    '=== COMPOSITION — the hom is the star ===',
    '• The hamster must fill most of the frame. It is the focus — front and center.',
    '• Props or accessories should be small and secondary — never overshadow the hom.',
    '• Keep the scene simple. One clear thing. Do not clutter.',
    '',
    '=== TEXT — absolute rule ===',
    '• NO text anywhere in the image. NO letters, NO words, NO labels, NO signs, NO captions.',
    '• Not even a single character. Completely text-free.',
    '',
    'BACKGROUND: Pure solid black #000000 only.',
    '',
    `=== GENERATE: ${userPrompt} ===`,
    '',
    '=== FINAL CHECK ===',
    '• Body shape = wide triangle/cone? ✓',
    '• Eyes match the mood? ✓',
    '• Hom fills the frame and is the focus? ✓',
    '• Zero text anywhere? ✓',
    '• Looks crude and MS Paint? ✓',
    'If any answer is no — redo it.',
  ].join('\n')
}

// Confirmed available models from /api/models — ordered best to fastest
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-image-preview',  // newest, best quality
  'gemini-3-pro-image-preview',       // pro quality
  'gemini-2.5-flash-image',           // stable
]

// Cache the first model name that works — avoids probing on every request
let cachedModel: string | null = null

type Part = { inlineData?: { mimeType?: string; data?: string } }

async function tryGenerate(ai: GoogleGenAI, model: string, userPrompt: string): Promise<string | null> {
  const refs = REF_FILES.map(loadRef)

  const parts = [
    // Send all 5 reference images so Gemini sees the exact style
    ...refs.map(r => ({ inlineData: { mimeType: r.mimeType, data: r.bytes } })),
    { text: buildGeminiPrompt(userPrompt) },
  ]

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['IMAGE'] },
  })

  // Extract image bytes from the response
  const responseParts: Part[] = (response.candidates?.[0]?.content?.parts ?? []) as Part[]
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`
    }
  }
  if (response.data) return `data:image/png;base64,${response.data}`
  return null
}

async function discoverImageModel(ai: GoogleGenAI): Promise<string | null> {
  try {
    const pager = await ai.models.list()
    for await (const m of pager) {
      const name = String(m.name ?? '').replace(/^models\//, '')
      if (name.toLowerCase().includes('image') && name.toLowerCase().includes('generation')) {
        console.log('[generate] Discovered model via list:', name)
        return name
      }
    }
  } catch (e) {
    console.warn('[generate] model list failed:', e)
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_KEY
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_KEY not set. Get a free key at aistudio.google.com' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const userPrompt: string = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!userPrompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    if (userPrompt.length > 500) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })

    const ai = new GoogleGenAI({ apiKey: geminiKey })

    // If we already know which model works, use it directly
    if (cachedModel) {
      try {
        const imageUrl = await tryGenerate(ai, cachedModel, userPrompt)
        if (imageUrl) return NextResponse.json({ imageUrl })
      } catch {
        cachedModel = null // Model may have changed, re-probe below
      }
    }

    // Probe candidate models until one works
    const allModels = [...CANDIDATE_MODELS]

    // Also try any image generation models discovered dynamically
    const discovered = await discoverImageModel(ai)
    if (discovered && !allModels.includes(discovered)) allModels.unshift(discovered)

    for (const model of allModels) {
      try {
        const imageUrl = await tryGenerate(ai, model, userPrompt)
        if (imageUrl) {
          console.log(`[generate] ✓ Model worked: ${model}`)
          cachedModel = model
          return NextResponse.json({ imageUrl })
        }
      } catch (e) {
        const msg = String((e as Error).message ?? '')
        const short = msg.slice(0, 120)

        // 429 = rate limited — stop immediately, don't burn quota on other models
        if (msg.includes('429')) {
          console.warn(`[generate] ✗ ${model}: rate limited (429)`)
          return NextResponse.json(
            { error: 'Gemini image quota reached. Wait 1 minute and try again, or enable billing at aistudio.google.com.' },
            { status: 429 }
          )
        }

        console.warn(`[generate] ✗ ${model}: ${short}`)
      }
    }

    return NextResponse.json(
      {
        error:
          'No Gemini image generation model worked. ' +
          'Visit /api/models to see available models on your account. ' +
          'You may need to enable image generation in Google AI Studio.',
      },
      { status: 500 }
    )
  } catch (err) {
    console.error('[generate] Error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Unknown error' }, { status: 500 })
  }
}
