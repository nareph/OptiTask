// src/app/layout.tsx
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Productivity SaaS',
  description: 'Boost your productivity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
