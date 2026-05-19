import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function GET(req: NextRequest) {
  const geminiKey = process.env.GEMINI_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_KEY not set' }, { status: 500 })
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey })
  const models: string[] = []

  try {
    const pager = await ai.models.list()
    for await (const m of pager) {
      models.push(String(m.name ?? '').replace(/^models\//, ''))
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  const imageModels = models.filter(n => n.toLowerCase().includes('image'))
  return NextResponse.json({ imageModels, allModels: models })
}
