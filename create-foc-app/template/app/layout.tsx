import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FOC App',
  description: 'Built on Filecoin Onchain Cloud with create-foc-app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
