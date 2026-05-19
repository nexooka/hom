export const REFERENCE_IMAGES = [
  '/refs/ref1.png',
  '/refs/ref2.png',
  '/refs/ref3.png',
  '/refs/ref4.png',
  '/refs/ref5.png',
]

// ── For instruct-pix2pix (model SEES the reference image) ────────────────────
// Short edit instruction — this model was trained on concise commands.
export function buildInstruction(userPrompt: string): string {
  return (
    `Keep the same crude badly-drawn MS Paint style, same white blob hamster body, ` +
    `same messy scribbled dark eye marks, same flat pink triangle nose, ` +
    `same rough black outlines. Change the hamster to: ${userPrompt}`
  )
}

// ── For text-to-image (FLUX / Pollinations) ───────────────────────────────────
// Ultra-detailed description based on direct visual analysis of all 47 images.
// Every characteristic of the hamster meme sticker style encoded as words.
const VISUAL_CORE = [
  // Body
  'white hamster blob character',
  'pure flat white egg-shaped oval body',
  'body shape like an upright rounded potato or chubby teardrop',
  'no fur texture no detail just flat white fill',
  'thick rough jagged black outline around body that looks pixelated and wobbly',
  'outline drawn freehand with a thick pixel brush not smooth bezier curves',
  // Eyes
  'two small black filled oval dots for eyes in upper face area',
  'each eye surrounded by heavy messy scribbled black strokes radiating outward',
  'eye marks look like smeared mascara or chaotic dark scribbles',
  'eyes look tired dramatic and slightly unhinged',
  // Nose
  'tiny flat salmon pink equilateral triangle nose centered on face',
  'nose has zero gradient just flat pink fill',
  // Art style
  'drawn in a basic phone drawing app with thick pixel brush',
  'MS Paint quality deliberately',
  'badly drawn on purpose',
  'crude lo-fi ugly amateur art aesthetic',
  'zero shading zero gradients zero depth',
  'intentionally terrible art style',
  'looks like a 5-year-old drew it but with meme expressions',
  // Format
  'pure black #000000 background',
  'flat 2d sticker format',
  'character fills most of the frame',
].join(', ')

const NEGATIVE_KEYWORDS = [
  'NOT smooth',
  'NOT polished',
  'NOT professional',
  'NOT cute kawaii',
  'NOT anime',
  'NOT 3d',
  'NOT realistic',
  'NOT Pixar Disney style',
].join(', ')

export function buildPrompt(userPrompt: string): string {
  return `${VISUAL_CORE}, ${userPrompt}, ${NEGATIVE_KEYWORDS}, black background`
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
