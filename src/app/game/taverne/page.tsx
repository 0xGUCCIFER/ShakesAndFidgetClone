'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { QuestCard, Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Filter, RefreshCw, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Quest, QuestDifficulty, ActiveQuest } from '@/lib/store/types'

type DifficultyFilter = 'all' | QuestDifficulty

export default function TavernePage() {
  const character = useGameStore((s) => s.character)
  const activeQuest = useGameStore((s) => s.activeQuest)
  const setActiveQuest = useGameStore((s) => s.setActiveQuest)
  const updateCharacter = useGameStore((s) => s.updateCharacter)

  const [quests, setQuests] = useState<Quest[]>([])
  const [filter, setFilter] = useState<DifficultyFilter>('all')
  const [loading, setLoading] = useState(true)
  const [showReward, setShowReward] = useState(false)
  const [reward, setReward] = useState<{ xp: number; gold: number } | null>(null)

  const loadQuests = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('quests').select('*').order('min_level')
    if (data) {
      setQuests(
        data.map((q) => ({
          id: q.id,
          name: q.name,
          description: q.description ?? '',
          difficulty: q.difficulty as QuestDifficulty,
          duration_seconds: q.duration_seconds,
          xp_reward: q.xp_reward,
          gold_reward: q.gold_reward,
          item_chance: q.item_drop_chance,
          min_level: q.min_level,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadQuests()
  }, [loadQuests])

  // Check if active quest completed
  useEffect(() => {
    if (!activeQuest) return

    const checkCompletion = () => {
      const now = Date.now()
      const end = new Date(activeQuest.ends_at).getTime()
      if (now >= end) {
        completeQuest()
      }
    }

    const interval = setInterval(checkCompletion, 1000)
    checkCompletion()
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuest])

  async function startQuest(quest: Quest) {
    if (!character || activeQuest) return
    if (character.stamina < (quest as Quest & { stamina_cost?: number }).duration_seconds / 60) {
      showToast('error', 'Nicht genug Ausdauer!')
      return
    }

    const supabase = createClient()
    const now = new Date()
    const completesAt = new Date(now.getTime() + quest.duration_seconds * 1000)

    const { data, error } = await supabase
      .from('active_quests')
      .insert({
        character_id: character.id,
        quest_id: quest.id,
        completes_at: completesAt.toISOString(),
      })
      .select('*, quest:quests(*)')
      .single()

    if (error) {
      showToast('error', 'Quest konnte nicht gestartet werden.')
      return
    }

    if (data) {
      const aq: ActiveQuest = {
        id: data.id,
        character_id: data.character_id,
        quest,
        started_at: data.started_at,
        ends_at: data.completes_at,
      }
      setActiveQuest(aq)
      showToast('quest', `Quest "${quest.name}" gestartet!`)
    }
  }

  async function completeQuest() {
    if (!activeQuest || !character) return

    const supabase = createClient()

    // Delete active quest
    await supabase.from('active_quests').delete().eq('id', activeQuest.id)

    // Grant rewards
    const xpGain = activeQuest.quest.xp_reward
    const goldGain = activeQuest.quest.gold_reward

    await supabase
      .from('profiles')
      .update({
        xp: character.xp + xpGain,
        gold: character.gold + goldGain,
      })
      .eq('id', character.user_id)

    updateCharacter({
      xp: character.xp + xpGain,
      gold: character.gold + goldGain,
    })

    setReward({ xp: xpGain, gold: goldGain })
    setShowReward(true)
    setActiveQuest(null)
    showToast('success', 'Quest abgeschlossen!')
  }

  const filteredQuests =
    filter === 'all'
      ? quests
      : quests.filter((q) => q.difficulty === filter)

  const filters: { value: DifficultyFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'easy', label: 'Einfach' },
    { value: 'medium', label: 'Mittel' },
    { value: 'hard', label: 'Schwer' },
    { value: 'legendary', label: 'Legendaer' },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="fantasy-card p-4 animate-pulse h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-light">Taverne</h1>
        <button
          onClick={loadQuests}
          className="p-2 rounded hover:bg-bg-light text-text-muted hover:text-parchment transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Active Quest */}
      {activeQuest && (
        <div className="border-2 border-accent rounded-lg p-1">
          <div className="text-xs text-accent font-display uppercase tracking-wider px-3 pt-2 mb-1">
            Aktive Quest
          </div>
          <QuestCard
            quest={activeQuest.quest}
            isActive
            endsAt={activeQuest.ends_at}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-text-muted" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded text-xs font-display uppercase tracking-wider transition-colors ${
              filter === f.value
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'text-text-muted hover:text-parchment hover:bg-bg-light/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onStart={startQuest}
          />
        ))}
      </div>

      {filteredQuests.length === 0 && (
        <p className="text-center text-text-muted py-8">Keine Quests gefunden.</p>
      )}

      {/* Reward Modal */}
      <Modal open={showReward} onClose={() => setShowReward(false)} title="Quest abgeschlossen!">
        {reward && (
          <div className="text-center space-y-4">
            <Gift className="w-12 h-12 text-primary-light mx-auto" />
            <div className="space-y-2">
              <p className="text-lg text-parchment">
                <span className="text-xp font-bold">+{reward.xp} XP</span>
              </p>
              <p className="text-lg text-parchment">
                <span className="text-primary-light font-bold">+{reward.gold} Gold</span>
              </p>
            </div>
            <Button onClick={() => setShowReward(false)}>Weiter</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
