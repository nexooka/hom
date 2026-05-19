import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})

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
    <html lang="en" className={`bg-[#080604] ${fraunces.variable}`}>
      <body className="bg-[#080604] text-[#f0e0c8] antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
