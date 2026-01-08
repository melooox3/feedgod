import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3ModalProvider } from '@/lib/web3modal-provider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Feedgod - Omnipotent Data Feeds for Mere Mortals',
  description: 'Build custom Switchboard oracle feeds with AI assistance. Simple, fast, and intuitive.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex flex-col min-h-screen bg-feedgod-dark text-gray-200`}>
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
