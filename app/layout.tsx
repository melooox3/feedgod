import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UnifiedWalletProvider } from '@/lib/unified-wallet-provider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'
import OfflineIndicator from '@/components/OfflineIndicator'
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
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider>
          <ToastProvider>
            <UnifiedWalletProvider>
              <div className="flex-1">
                {children}
              </div>
              <Footer />
              <OfflineIndicator />
            </UnifiedWalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
