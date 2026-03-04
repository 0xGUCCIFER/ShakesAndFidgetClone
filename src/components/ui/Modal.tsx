'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative fantasy-card p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="font-display text-lg font-semibold text-primary-light">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-bg-light text-text-muted hover:text-parchment transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
