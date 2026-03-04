import { Coins, Gem } from 'lucide-react'

interface GoldDisplayProps {
  amount: number
  type?: 'gold' | 'gems'
}

export function GoldDisplay({ amount, type = 'gold' }: GoldDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      {type === 'gold' ? (
        <Coins className="w-4 h-4 text-primary" />
      ) : (
        <Gem className="w-4 h-4 text-accent" />
      )}
      <span className={`text-sm font-semibold ${type === 'gold' ? 'text-primary-light' : 'text-accent'}`}>
        {amount.toLocaleString()}
      </span>
    </div>
  )
}
