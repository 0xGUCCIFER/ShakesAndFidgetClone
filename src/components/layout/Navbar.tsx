'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Beer, Swords, ShoppingBag, Users, ArrowLeftRight } from 'lucide-react'

const navItems = [
  { href: '/game/taverne', label: 'Taverne', icon: Beer },
  { href: '/game/arena', label: 'Arena', icon: Swords },
  { href: '/game/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/game/gilde', label: 'Gilde', icon: Users },
  { href: '/game/marktplatz', label: 'Markt', icon: ArrowLeftRight },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-dark/95 backdrop-blur border-t border-bg-light lg:relative lg:border-t-0 lg:border-b lg:border-bg-light">
      <div className="flex items-center justify-around max-w-lg mx-auto lg:max-w-none lg:justify-center lg:gap-1 px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all text-xs
                ${
                  isActive
                    ? 'text-primary-light bg-primary/10'
                    : 'text-text-muted hover:text-parchment hover:bg-bg-light/30'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-display text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
