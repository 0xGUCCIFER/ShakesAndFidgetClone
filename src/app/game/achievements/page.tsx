'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/gameStore'
import {
  Trophy, Swords, Shield, Crown, Skull, ShieldCheck,
  Scroll, ScrollText, Map, Timer, TrendingUp, Star, Flame,
  Users, MessageCircle, Heart, Store, Landmark,
  ShoppingBag, Package, Sparkles, Gem, CheckCircle, Coins, Diamond,
  Lock,
} from 'lucide-react'

const iconMap: Record<string, typeof Trophy> = {
  Trophy, Swords, Shield, Crown, Skull, ShieldCheck,
  Scroll, ScrollText, Map, Timer, TrendingUp, Star, Flame,
  Users, MessageCircle, Heart, Store, Landmark,
  ShoppingBag, Package, Sparkles, Gem, CheckCircle, Coins, Diamond,
}

interface Achievement {
  id: string
  name: string
  description: string
  icon_name: string
  category: string
  requirement_type: string
  requirement_value: number
  xp_reward: number
  gem_reward: number
}

interface PlayerAchievement {
  achievement_id: string
  unlocked_at: string
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'combat', label: 'Combat' },
  { key: 'quest', label: 'Quests' },
  { key: 'social', label: 'Social' },
  { key: 'collection', label: 'Collection' },
]

const categoryColors: Record<string, string> = {
  combat: 'text-secondary-light',
  quest: 'text-stamina',
  social: 'text-accent',
  collection: 'text-primary-light',
}

export default function AchievementsPage() {
  const character = useGameStore((s) => s.character)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAchievements() {
      const supabase = createClient()

      const [achRes, playerRes] = await Promise.all([
        supabase.from('achievements').select('*').order('category').order('requirement_value'),
        character
          ? supabase
              .from('player_achievements')
              .select('achievement_id, unlocked_at')
              .eq('character_id', character.id)
          : Promise.resolve({ data: [] }),
      ])

      setAchievements((achRes.data ?? []) as Achievement[])
      setUnlocked(new Set(((playerRes.data ?? []) as PlayerAchievement[]).map((p) => p.achievement_id)))
      setLoading(false)
    }
    fetchAchievements()
  }, [character])

  const filtered = filter === 'all'
    ? achievements
    : achievements.filter((a) => a.category === filter)

  const unlockedCount = achievements.filter((a) => unlocked.has(a.id)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading achievements...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fantasy-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary-light" />
            <div>
              <h1 className="font-display text-lg font-semibold text-parchment">Achievements</h1>
              <p className="text-xs text-text-muted">
                {unlockedCount} / {achievements.length} unlocked
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-32 h-2 bg-bg-darkest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all ${
              filter === cat.key
                ? 'bg-primary/20 text-primary-light border border-primary/40'
                : 'bg-bg-dark text-text-muted border border-bg-light hover:text-parchment hover:border-bg-light/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ach) => {
          const isUnlocked = unlocked.has(ach.id)
          const Icon = iconMap[ach.icon_name] ?? Trophy

          return (
            <div
              key={ach.id}
              className={`fantasy-card p-4 transition-all ${
                isUnlocked
                  ? 'border-primary/30 bg-primary/5'
                  : 'opacity-60 grayscale-[30%]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? `bg-primary/20 ${categoryColors[ach.category] ?? 'text-primary-light'}`
                      : 'bg-bg-darkest text-text-muted'
                  }`}
                >
                  {isUnlocked ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-sm font-semibold truncate ${
                    isUnlocked ? 'text-parchment' : 'text-text-muted'
                  }`}>
                    {ach.name}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{ach.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {ach.xp_reward > 0 && (
                      <span className="text-[10px] text-stamina">+{ach.xp_reward} XP</span>
                    )}
                    {ach.gem_reward > 0 && (
                      <span className="text-[10px] text-accent">+{ach.gem_reward} Gems</span>
                    )}
                  </div>
                </div>
                {isUnlocked && (
                  <CheckCircle className="w-4 h-4 text-stamina shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No achievements in this category.</p>
        </div>
      )}
    </div>
  )
}
