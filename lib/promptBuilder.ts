// Reference images shown in the UI as style examples (hosted in /public/refs/)
export const REFERENCE_IMAGES = [
  '/refs/ref1.png',
  '/refs/ref2.png',
  '/refs/ref3.png',
  '/refs/ref4.png',
  '/refs/ref5.png',
]

// =============================================================================
// STYLE PROMPT — the single most important thing in this entire codebase.
//
// Every generation is prefixed with this. It describes the EXACT visual language
// of the hamster meme sticker collection:
//   - crude lo-fi hand-drawn aesthetic (phone drawing app, MS Paint energy)
//   - white blob hamster body (rounded triangle / egg silhouette)
//   - small beady black dot eyes with heavy scribbled dark shadow rings
//   - small pink triangle nose, centered
//   - deliberately pixelated/jagged black outlines (NOT smooth bezier curves)
//   - flat white body, extremely limited color palette
//   - pure black background for sticker use
//   - meme/cursed art energy — intentionally "bad" art
//
// DO NOT remove or soften this prefix. It is the style lock.
// =============================================================================
const STYLE_PREFIX = [
  'internet meme hamster sticker',
  'crude deliberately lo-fi hand-drawn digital art',
  'ms paint drawing style',
  'white chubby blob hamster character',
  'rounded triangular egg-shaped body',
  'small beady black dot eyes with heavy dark scribbled shadow circles around them',
  'tiny pink salmon-colored triangle nose centered on face',
  'rough pixelated jagged black outlines',
  'thick black cartoon border',
  'flat 2d illustration',
  'no gradients no shading',
  'pure flat colors',
  'intentionally crude ugly art aesthetic',
  'internet meme humor',
  'cursed meme art style',
  'viral hamster meme character',
  'pixel-quality rough lines',
  'white hamster body',
  'pure black background',
].join(', ') + ', '

const STYLE_SUFFIX =
  ', pure black background #000000, flat sticker art, lo-fi drawing, limited color palette, white hamster, black border outline'

export function buildPrompt(userPrompt: string): string {
  return STYLE_PREFIX + userPrompt + STYLE_SUFFIX
}

// Not used directly in generation but exported for reference
export const NEGATIVE_PROMPT =
  'realistic fur, photorealistic, smooth lines, 3d render, detailed, anime, manga, disney, pixar, studio ghibli, professional art, watercolor, oil painting, complex shading, gradient, beautiful, masterpiece, 8k'

export const LOADING_MESSAGES = [
  'Scribbling in ms paint...',
  'Adding the perfect sad eyes...',
  'Calibrating weirdness levels...',
  'Teaching hamster new tricks...',
  'Injecting meme energy...',
  'Drawing whiskers by hand...',
  'Pixel-perfecting the nose...',
  'Applying cursed art filter...',
  'Consulting the hamster council...',
  'Making it intentionally ugly...',
  'Flattening the gradients...',
  'Vibing with the blob...',
]
