import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { buildPrompt, NEGATIVE_PROMPT } from '@/lib/promptBuilder'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

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

    // FLUX Dev — high quality, follows complex style prompts well.
    // We fix seed to undefined (random) so variations feel fresh each time.
    const output = await replicate.run(
      'black-forest-labs/flux-dev',
      {
        input: {
          prompt: styledPrompt,
          num_outputs: 1,
          num_inference_steps: 28,
          guidance: 3.5,
          output_format: 'png',
          output_quality: 95,
          aspect_ratio: '1:1',
          go_fast: false,
          // Negative prompt supported via extra_lora_scale workaround is not available on flux-dev;
          // style locking is entirely driven by the positive prompt engineering in promptBuilder.ts
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
