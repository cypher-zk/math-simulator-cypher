import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cyper — Market Math Simulator',
  description: 'Interactive payout calculator for all three Cyper prediction market types',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
