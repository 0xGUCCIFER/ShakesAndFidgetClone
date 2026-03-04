'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileHeader } from './MobileHeader'
import { ToastContainer } from '@/components/ui/Toast'

interface GameLayoutProps {
  children: ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader />
      <Navbar />

      <div className="flex flex-1 gap-4 p-4 pb-20 lg:pb-4 max-w-7xl mx-auto w-full">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <ToastContainer />
    </div>
  )
}
