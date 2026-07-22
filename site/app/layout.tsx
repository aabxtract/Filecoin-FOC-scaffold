import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'scaffold-foc — build on Filecoin Onchain Cloud in one command',
  description:
    'A CLI that scaffolds a working Filecoin Onchain Cloud app: upload, retrieve, and verify real storage from a Next.js starter, with setup checks that catch problems before you hit them.',
  icons: {
    icon: '/ChatGPT_Image_Jul_22__2026__01_27_48_PM-removebg-preview.png',
    shortcut: '/ChatGPT_Image_Jul_22__2026__01_27_48_PM-removebg-preview.png',
    apple: '/ChatGPT_Image_Jul_22__2026__01_27_48_PM-removebg-preview.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/ChatGPT_Image_Jul_22__2026__01_27_48_PM-removebg-preview.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
