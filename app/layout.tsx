import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HOM — Hamster Sticker Generator',
  description: 'Generate custom hamster stickers in the iconic meme art style. Pure black background for iPhone sticker use.',
  keywords: ['hamster', 'sticker', 'meme', 'generator', 'AI', 'funny'],
  openGraph: {
    title: 'HOM — Hamster Sticker Generator',
    description: 'Generate your own hamster meme stickers',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
