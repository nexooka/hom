export const REFERENCE_IMAGES = [
  '/refs/ref1.png',
  '/refs/ref2.png',
  '/refs/ref3.png',
  '/refs/ref4.png',
  '/refs/ref5.png',
]

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 PROMPT: for instruct-pix2pix (the model SEES a real reference image)
//
// instruct-pix2pix takes an actual example hamster + this instruction.
// It edits the reference image based on the instruction.
// Goal: preserve every crude visual characteristic, only change the scenario.
//
// Instruction format must be short and direct — the model was trained on
// simple edit commands, not long descriptions.
// ─────────────────────────────────────────────────────────────────────────────
export function buildStyleInstruction(userPrompt: string): string {
  return (
    `Keep the exact same crude badly drawn ms paint style, ` +
    `same white blob hamster body, same scribbled dark eye marks, ` +
    `same pink triangle nose, same thick jagged outlines, same flat white fill. ` +
    `Change the hamster to be: ${userPrompt}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 PROMPT: for FLUX text-to-image fallback (no image reference)
//
// Based on direct visual analysis of all 47 reference images.
// Describes every observable characteristic as precisely as possible.
// ─────────────────────────────────────────────────────────────────────────────
const PREFIX = [
  'badly drawn crude internet meme hamster sticker',
  'white egg-shaped blob body',
  'flat pure white fill zero texture zero fur',
  'thick jagged aliased black outline looks drawn freehand in MS Paint',
  'two small filled black circles for eyes',
  'heavy messy scribbled black strokes radiating around each eye like smeared mascara',
  'small flat salmon-pink equilateral triangle nose centered on face',
  'zero shading zero gradients pure flat colors only',
  'looks drawn on a phone with a thick pixel brush',
  'deliberately ugly lo-fi amateur art',
  'crude doodle no artistic skill',
  'internet troll meme art',
  'pure black background',
].join(', ')

const SUFFIX = [
  'black background',
  'crude pixel lines',
  'badly drawn',
  'ms paint quality',
  'no smooth lines',
  'flat white hamster blob',
].join(', ')

export function buildPrompt(userPrompt: string): string {
  return `${PREFIX}, ${userPrompt}, ${SUFFIX}`
}

export const LOADING_MESSAGES = [
  'Showing it the examples...',
  'Scribbling in ms paint...',
  'Adding the perfect sad eyes...',
  'Calibrating weirdness levels...',
  'Teaching hamster new tricks...',
  'Injecting meme energy...',
  'Pixel-perfecting the nose...',
  'Applying cursed art filter...',
  'Consulting the hamster council...',
  'Making it intentionally ugly...',
  'Vibing with the blob...',
]
