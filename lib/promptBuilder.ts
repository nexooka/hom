// Reference images shown in the UI as style examples (hosted in /public/refs/)
export const REFERENCE_IMAGES = [
  '/refs/ref1.png',
  '/refs/ref2.png',
  '/refs/ref3.png',
  '/refs/ref4.png',
  '/refs/ref5.png',
]

// =============================================================================
// STYLE PROMPT — the most critical part of the entire codebase.
//
// The target style is a SPECIFIC viral internet hamster meme drawn on a phone.
// Key characteristics that MUST be preserved:
//   - BADLY drawn on purpose — looks like a 5-year-old drew it in a phone app
//   - White egg/triangle blob body — no fur texture, just flat white fill
//   - Scribbled dark eye marks — messy black scrawl, not cute anime eyes
//   - Pink flat triangle nose — pixelated, no gradients
//   - ROUGH jagged black outlines — not smooth, not bezier, looks hand-wobbled
//   - Zero shading, zero gradients, zero depth
//   - MS Paint / phone drawing app quality — deliberately amateur
//   - NOT animated, NOT cute, NOT polished, NOT Disney, NOT anime
// =============================================================================
const STYLE_PREFIX = [
  'badly drawn crude internet meme hamster',
  'ugly on purpose amateur drawing',
  'phone finger-drawing app scribble',
  'ms paint quality',
  'poorly drawn',
  'intentionally bad art',
  'no artistic skill',
  'white egg-shaped blob hamster body',
  'flat white fill no texture no fur',
  'scribbled messy dark black marks for eyes',
  'small pixelated pink triangle nose',
  'rough wobbly jagged thick black outline',
  'zero shading zero gradients',
  'flat solid colors only',
  'crude doodle style',
  'lo-fi pixel quality lines',
  'looks drawn by a child',
  'deliberately terrible art',
  'cursed meme drawing',
  'pure black background',
].join(', ') + ', '

const STYLE_SUFFIX = [
  'pure black #000000 background',
  'ugly drawing style',
  'no smooth lines',
  'no professional art',
  'crude pixelated outlines',
  'flat white hamster body',
  'badly drawn sticker',
  'ms paint scribble',
].join(', ')

export function buildPrompt(userPrompt: string): string {
  return STYLE_PREFIX + userPrompt + ', ' + STYLE_SUFFIX
}

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
