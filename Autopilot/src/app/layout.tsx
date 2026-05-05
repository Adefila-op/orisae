import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Autopilot - Conversion Recovery for Creators',
  description: 'Smart link tracking, intent scoring, and offer automation for digital creators',
  keywords: ['conversion recovery', 'smart links', 'creator tools', 'digital products'],
  authors: [{ name: 'Autopilot' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className="bg-black text-white">{children}</body>
    </html>
  )
}
