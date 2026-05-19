export interface GeneratedSticker {
  id: string
  prompt: string
  imageUrl: string
  timestamp: number
  imageData?: string // base64 for persistence
}

export interface GenerateResponse {
  imageUrl: string
  error?: string
}
