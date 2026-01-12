import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { Web3ModalProvider } from '@/lib/web3modal-provider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Footer from '@/components/Footer'

// Clean neutral sans for UI/body
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Editorial serif for accents (optional use in components)
const sourceSerif = Source_Serif_4({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'feedgod - by Switchboard',
  description: 'Build custom Switchboard oracle feeds with AI assistance. Simple, fast, and intuitive.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${sourceSerif.variable}`}>
      <body className={`${inter.className} flex flex-col min-h-screen bg-feedgod-dark text-gray-200 antialiased`}>
        <ThemeProvider>
          <Web3ModalProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </Web3ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
