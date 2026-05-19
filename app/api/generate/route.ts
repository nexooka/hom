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
    'You are given reference hamster sticker images. Study them VERY carefully before generating anything.',
    'Your ONLY job is to reproduce this exact crude hand-drawn style. Do NOT use your default art style.',
    '',
    '=== MANDATORY STYLE RULES — violating any of these is WRONG ===',
    '',
    'BODY:',
    '• Shape: a fat upright egg or blob — not a realistic hamster, not cute, not round, not a circle',
    '• Color: flat pure white (#FFFFFF), zero shading, zero gradients, zero fur texture',
    '• Outline: thick, jagged, wobbly black stroke — looks hand-drawn with a fat marker, NOT smooth',
    '• The outline is imperfect and uneven — some parts thicker, some parts wavy',
    '',
    'EYES:',
    '• Two small filled black oval dots, placed in the upper third of the face',
    '• Around EACH eye: heavy chaotic black scribble marks radiating outward like smeared mascara',
    '• The scribbles look frantic, messy, overlapping — like a child scribbled aggressively',
    '• The eye area looks dark and dramatic, almost like dark circles or war paint',
    '',
    'NOSE:',
    '• One tiny flat salmon/pink triangle, centered between the eyes',
    '• Perfectly flat color — no gradient, no highlight, no shadow',
    '• Small — not big, not prominent',
    '',
    'EARS (if visible):',
    '• Small rounded bumps on top of the head, flat pink or white fill, rough outline',
    '',
    'ART QUALITY — this is CRITICAL:',
    '• Looks like it was drawn in MS Paint with a thick pixel brush by a child',
    '• Deliberately bad, crude, ugly, lo-fi — this is the intended aesthetic',
    '• ZERO polish, ZERO anti-aliasing, ZERO professional quality',
    '• NO smooth curves anywhere — everything looks hand-drawn and imperfect',
    '• NO shadows, NO depth, NO 3D effect, NO lighting',
    '• NO cute/kawaii style, NO anime, NO Pixar style, NO cartoon polish',
    '',
    'BACKGROUND:',
    '• Pure solid black #000000 — nothing else, no gradients, no texture',
    '',
    '=== WHAT TO GENERATE ===',
    '',
    `Draw the hamster: ${userPrompt}`,
    '',
    `The scene/action "${userPrompt}" must be clearly visible. Include props, objects, or context that make "${userPrompt}" obvious.`,
    'Any extra elements (objects, props, text) must ALSO be drawn in the same crude MS Paint style — flat colors, thick rough outlines, no shading.',
    '',
    '=== FINAL CHECK ===',
    'Before outputting: does it look like the reference images? Crude? Jagged outline? Messy eye scribbles? Black background? If yes, output it.',
    'If your generation looks polished, smooth, or professionally drawn — it is WRONG. Redo it cruder.',
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
