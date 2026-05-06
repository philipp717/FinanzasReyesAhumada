import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Fami — Finanzas Familiares',
  description: 'Administra los ingresos, gastos y metas de ahorro de tu familia de forma simple y clara.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full" style={{ fontFamily: 'var(--font-geist-sans), Helvetica Neue, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
