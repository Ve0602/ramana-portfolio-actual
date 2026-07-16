// app/layout.tsx
// ─────────────────────────────────────────────────────────────
// Root layout — wraps every page on your site
// Change BRAND values in lib/config.js to rebrand everything
// ─────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareerFlow AI — India\'s AI-Powered Career Platform',
  description: 'AI resume builder, job matching, auto-apply, and career coaching. Get hired faster.',
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'CareerFlow AI',
    description: 'AI-powered career platform for Indian students and professionals',
    url: 'https://careerflow-ai.vercel.app',
    siteName: 'CareerFlow AI',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
