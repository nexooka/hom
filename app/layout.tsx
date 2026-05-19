import type { Metadata } from 'next'
import { Nunito, Fraunces } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  variable: '--font-nunito',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})

export const metadata: Metadata = {
  title: 'HOM — Hamster Sticker Generator',
  description: 'Generate custom hamster stickers in the iconic meme art style.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-[#09060c] ${fraunces.variable} ${nunito.variable}`}>
      <body className="bg-[#09060c] text-pink-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
