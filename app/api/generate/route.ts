import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

const REF_FILES = ['ref1.png', 'ref2.png', 'ref3.png', 'ref4.png', 'ref5.png']

function loadRef(name: string) {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'refs', name))
  return { bytes: buf.toString('base64'), mimeType: 'image/png' }
}

// Hard rules in systemInstruction — processed separately from user content, higher priority
const SYSTEM_INSTRUCTION = [
  'You generate crude MS Paint hamster sticker images.',
  'These rules are ABSOLUTE and override everything else:',
  '1. NO TEXT. Zero letters, words, numbers, or symbols anywhere in the image. None.',
  '2. DRAW ONLY WHAT IS EXPLICITLY ASKED. Never add anything not in the user prompt. No food, props, scenery, or objects unless the user named them. A "happy hamster" means only a happy hamster — not cheese, not seeds, not anything else.',
  '3. BODY SHAPE = wide triangle/cone. Narrow flat top, very wide base. NOT a circle or egg.',
  '4. CRUDE MS PAINT STYLE. Thick jagged outlines, flat colors, zero shading, zero gradients, zero polish.',
  '5. BLACK BACKGROUND (#000000). Nothing else.',
  '6. HAMSTER FILLS THE FRAME. Simple composition. Hamster is the only subject.',
].join('\n')

function buildUserPrompt(userPrompt: string): string {
  return [
    'The reference images above show the exact art style to copy.',
    '',
    `Draw this, and ONLY this: ${userPrompt}`,
    '',
    'Express the mood through the hamster\'s eyes and face — happy=bright wide eyes, sad=droopy lids, angry=sharp lines.',
    'Nothing in the image except what is described above. No text. Black background.',
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
    ...refs.map(r => ({ inlineData: { mimeType: r.mimeType, data: r.bytes } })),
    { text: buildUserPrompt(userPrompt) },
  ]

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
      systemInstruction: SYSTEM_INSTRUCTION,
    },
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
