'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileHeader } from './MobileHeader'
import { ToastContainer } from '@/components/ui/Toast'

interface GameLayoutProps {
  children: ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader />
      <Navbar />

      <div className="flex flex-1 gap-4 p-4 pb-20 lg:pb-4 max-w-7xl mx-auto w-full">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
