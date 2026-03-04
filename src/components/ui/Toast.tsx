'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Star, Swords } from 'lucide-react'

type ToastType = 'success' | 'error' | 'levelup' | 'quest'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  levelup: Star,
  quest: Swords,
}

const colors: Record<ToastType, string> = {
  success: 'border-stamina text-stamina',
  error: 'border-secondary-light text-secondary-light',
  levelup: 'border-primary text-primary-light',
  quest: 'border-accent text-accent',
}

let addToastExternal: ((type: ToastType, message: string) => void) | null = null

export function showToast(type: ToastType, message: string) {
  addToastExternal?.(type, message)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    addToastExternal = addToast
    return () => {
      addToastExternal = null
    }
  }, [addToast])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className={`fantasy-card px-4 py-3 flex items-center gap-3 border-l-4 ${colors[toast.type]} pointer-events-auto min-w-[250px]`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm text-parchment">{toast.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
