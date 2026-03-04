'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Castle, Skull, Swords, ChevronRight, Lock, Clock, Trophy, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Dungeon {
  id: string
  name: string
  description: string
  min_level: number
  stages: number
  boss_name: string
  xp_reward: number
  gold_reward: number
  gem_reward: number
  cooldown_hours: number
}

interface DungeonRun {
  id: string
  dungeon_id: string
  current_stage: number
  started_at: string
  completed_at: string | null
}

interface CombatRound {
  round: number
  playerHp: number
  enemyHp: number
  playerDmg: number
  enemyDmg: number
}

export default function DungeonPage() {
  const character = useGameStore((s) => s.character)
  const updateCharacter = useGameStore((s) => s.updateCharacter)

  const [dungeons, setDungeons] = useState<Dungeon[]>([])
  const [progress, setProgress] = useState<DungeonRun[]>([])
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null)
  const [activeRun, setActiveRun] = useState<DungeonRun | null>(null)
  const [fighting, setFighting] = useState(false)
  const [showCombatModal, setShowCombatModal] = useState(false)
  const [combatRounds, setCombatRounds] = useState<CombatRound[]>([])
  const [combatWon, setCombatWon] = useState(false)
  const [displayRound, setDisplayRound] = useState(0)
  const [isBoss, setIsBoss] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewards, setRewards] = useState<{ xp: number; gold: number; gems: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!character) return
    const supabase = createClient()

    const [dungeonsRes, progressRes] = await Promise.all([
      supabase.from('dungeons').select('*').order('min_level'),
      supabase
        .from('dungeon_progress')
        .select('*')
        .eq('character_id', character.id),
    ])

    if (dungeonsRes.data) setDungeons(dungeonsRes.data as Dungeon[])
    if (progressRes.data) setProgress(progressRes.data as DungeonRun[])
    setLoading(false)
  }, [character])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Animate combat rounds
  useEffect(() => {
    if (!showCombatModal || combatRounds.length === 0) return
    if (displayRound >= combatRounds.length) return

    const timer = setTimeout(() => {
      setDisplayRound((r) => r + 1)
    }, 500)
    return () => clearTimeout(timer)
  }, [showCombatModal, displayRound, combatRounds])

  function getDungeonStatus(dungeon: Dungeon): 'locked' | 'available' | 'in_progress' | 'cooldown' {
    if (!character || character.level < dungeon.min_level) return 'locked'

    const run = progress.find(
      (p) => p.dungeon_id === dungeon.id && !p.completed_at
    )
    if (run) return 'in_progress'

    // Check cooldown
    const lastCompleted = progress
      .filter((p) => p.dungeon_id === dungeon.id && p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]

    if (lastCompleted) {
      const completedAt = new Date(lastCompleted.completed_at!).getTime()
      const cooldownEnd = completedAt + dungeon.cooldown_hours * 60 * 60 * 1000
      if (Date.now() < cooldownEnd) return 'cooldown'
    }

    return 'available'
  }

  function getCooldownRemaining(dungeon: Dungeon): string {
    const lastCompleted = progress
      .filter((p) => p.dungeon_id === dungeon.id && p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]

    if (!lastCompleted) return ''

    const completedAt = new Date(lastCompleted.completed_at!).getTime()
    const cooldownEnd = completedAt + dungeon.cooldown_hours * 60 * 60 * 1000
    const remaining = cooldownEnd - Date.now()

    if (remaining <= 0) return ''
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  async function enterDungeon(dungeon: Dungeon) {
    if (!character) return
    const status = getDungeonStatus(dungeon)

    if (status === 'in_progress') {
      const run = progress.find((p) => p.dungeon_id === dungeon.id && !p.completed_at)
      if (run) {
        setActiveRun(run)
        setSelectedDungeon(dungeon)
      }
      return
    }

    if (status !== 'available') return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('dungeon_progress')
      .insert({ character_id: character.id, dungeon_id: dungeon.id, current_stage: 1 })
      .select()
      .single()

    if (error) {
      showToast('error', 'Failed to enter dungeon.')
      return
    }

    const run = data as DungeonRun
    setActiveRun(run)
    setSelectedDungeon(dungeon)
    setProgress((prev) => [...prev, run])
    showToast('quest', `Entered ${dungeon.name}!`)
  }

  async function fightStage() {
    if (!character || !selectedDungeon || !activeRun || fighting) return
    setFighting(true)

    const stage = activeRun.current_stage
    const totalStages = selectedDungeon.stages
    const isBossStage = stage === totalStages
    setIsBoss(isBossStage)

    // Scale enemy based on dungeon min_level and current stage
    const enemyLevel = selectedDungeon.min_level + stage - 1
    const bossMultiplier = isBossStage ? 2.0 : 1.0
    const enemyHpBase = Math.floor((50 + enemyLevel * 20) * bossMultiplier)
    const enemyStr = Math.floor((5 + enemyLevel * 3) * bossMultiplier)

    let playerHp = character.max_hp
    let enemyHp = enemyHpBase
    const rounds: CombatRound[] = []

    for (let round = 1; round <= 30 && playerHp > 0 && enemyHp > 0; round++) {
      const playerDmg = Math.max(1, Math.floor(
        (character.strength * 1.5 + character.dexterity * 0.5) * (0.8 + Math.random() * 0.4)
      ))
      const enemyDmg = Math.max(1, Math.floor(
        (enemyStr * 1.2) * (0.8 + Math.random() * 0.4)
      ))

      enemyHp = Math.max(0, enemyHp - playerDmg)
      if (enemyHp > 0) {
        playerHp = Math.max(0, playerHp - enemyDmg)
      }

      rounds.push({
        round,
        playerHp,
        enemyHp,
        playerDmg,
        enemyDmg: enemyHp > 0 ? enemyDmg : 0,
      })
    }

    const won = playerHp > 0 && enemyHp <= 0
    setCombatRounds(rounds)
    setCombatWon(won)
    setDisplayRound(0)
    setShowCombatModal(true)

    const supabase = createClient()

    if (won) {
      if (isBossStage) {
        // Dungeon completed
        await supabase
          .from('dungeon_progress')
          .update({ current_stage: stage, completed_at: new Date().toISOString() })
          .eq('id', activeRun.id)

        // Grant rewards
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp, gold, gems')
          .eq('id', character.user_id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              xp: profile.xp + selectedDungeon.xp_reward,
              gold: profile.gold + selectedDungeon.gold_reward,
              gems: profile.gems + selectedDungeon.gem_reward,
            })
            .eq('id', character.user_id)

          updateCharacter({
            xp: character.xp + selectedDungeon.xp_reward,
            gold: character.gold + selectedDungeon.gold_reward,
            gems: character.gems + selectedDungeon.gem_reward,
          })
        }

        setRewards({
          xp: selectedDungeon.xp_reward,
          gold: selectedDungeon.gold_reward,
          gems: selectedDungeon.gem_reward,
        })

        // Update local state
        setProgress((prev) =>
          prev.map((p) =>
            p.id === activeRun.id
              ? { ...p, completed_at: new Date().toISOString() }
              : p
          )
        )
      } else {
        // Advance to next stage
        const nextStage = stage + 1
        await supabase
          .from('dungeon_progress')
          .update({ current_stage: nextStage })
          .eq('id', activeRun.id)

        setActiveRun({ ...activeRun, current_stage: nextStage })
        setProgress((prev) =>
          prev.map((p) =>
            p.id === activeRun.id ? { ...p, current_stage: nextStage } : p
          )
        )
      }
    } else {
      // Failed - reset dungeon run
      await supabase
        .from('dungeon_progress')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', activeRun.id)

      setProgress((prev) =>
        prev.map((p) =>
          p.id === activeRun.id
            ? { ...p, completed_at: new Date().toISOString() }
            : p
        )
      )
    }

    setFighting(false)
  }

  function closeCombatModal() {
    setShowCombatModal(false)
    if (combatWon && isBoss && rewards) {
      setShowRewardModal(true)
    }
    if (!combatWon) {
      setActiveRun(null)
      setSelectedDungeon(null)
    }
  }

  function closeRewardModal() {
    setShowRewardModal(false)
    setRewards(null)
    setActiveRun(null)
    setSelectedDungeon(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="fantasy-card p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  // Dungeon stage view
  if (selectedDungeon && activeRun && !activeRun.completed_at) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedDungeon(null); setActiveRun(null) }}
            className="text-text-muted hover:text-parchment transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="font-display text-xl font-bold text-primary-light">{selectedDungeon.name}</h1>
        </div>

        <p className="text-sm text-text-light">{selectedDungeon.description}</p>

        {/* Stage progress */}
        <div className="fantasy-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-display uppercase tracking-wider">Progress</span>
            <span className="text-sm text-parchment">
              Stage {activeRun.current_stage} / {selectedDungeon.stages}
            </span>
          </div>

          <div className="flex gap-1">
            {Array.from({ length: selectedDungeon.stages }, (_, i) => {
              const stageNum = i + 1
              const isCurrentStage = stageNum === activeRun.current_stage
              const isCompleted = stageNum < activeRun.current_stage
              const isBossStage = stageNum === selectedDungeon.stages

              return (
                <div
                  key={stageNum}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-semibold transition-all ${
                    isCompleted
                      ? 'bg-stamina/30 text-stamina border border-stamina/40'
                      : isCurrentStage
                        ? 'bg-primary/20 text-primary-light border border-primary/40 animate-pulse'
                        : 'bg-bg-darkest/50 text-text-muted border border-bg-light/20'
                  }`}
                >
                  {isBossStage ? (
                    <Skull className="w-4 h-4" />
                  ) : (
                    stageNum
                  )}
                </div>
              )
            })}
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-parchment">
              {activeRun.current_stage === selectedDungeon.stages ? (
                <>
                  <Skull className="w-4 h-4 inline mr-1" />
                  Boss: <span className="text-secondary-light font-semibold">{selectedDungeon.boss_name}</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 inline mr-1" />
                  Stage {activeRun.current_stage} Enemies
                </>
              )}
            </p>

            <Button onClick={fightStage} disabled={fighting}>
              {fighting ? 'Fighting...' : activeRun.current_stage === selectedDungeon.stages ? 'Fight Boss' : 'Fight'}
            </Button>
          </div>
        </div>

        {/* Rewards preview */}
        <div className="fantasy-card p-4">
          <h3 className="text-xs text-text-muted font-display uppercase tracking-wider mb-2">Completion Rewards</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-xp">+{selectedDungeon.xp_reward} XP</span>
            <span className="text-primary-light">+{selectedDungeon.gold_reward} Gold</span>
            {selectedDungeon.gem_reward > 0 && (
              <span className="text-accent">+{selectedDungeon.gem_reward} Gems</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Dungeon list view
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-primary-light flex items-center gap-2">
        <Castle className="w-6 h-6" /> Dungeons
      </h1>

      <div className="space-y-3">
        {dungeons.map((dungeon) => {
          const status = getDungeonStatus(dungeon)
          const cooldown = getCooldownRemaining(dungeon)

          return (
            <div
              key={dungeon.id}
              className={`fantasy-card p-4 transition-all ${
                status === 'locked'
                  ? 'opacity-50'
                  : status === 'cooldown'
                    ? 'opacity-70'
                    : 'cursor-pointer hover:border-primary/40'
              }`}
              onClick={() => {
                if (status === 'available' || status === 'in_progress') enterDungeon(dungeon)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-parchment truncate">{dungeon.name}</h3>
                    {status === 'in_progress' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 uppercase font-display tracking-wider">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{dungeon.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-light">
                    <span>Lvl {dungeon.min_level}+</span>
                    <span>{dungeon.stages} Stages</span>
                    <span className="text-xp">+{dungeon.xp_reward} XP</span>
                    <span className="text-primary-light">+{dungeon.gold_reward} Gold</span>
                    {dungeon.gem_reward > 0 && (
                      <span className="text-accent">+{dungeon.gem_reward} Gems</span>
                    )}
                  </div>
                </div>

                <div className="ml-3 flex-shrink-0">
                  {status === 'locked' && (
                    <div className="flex items-center gap-1 text-text-muted">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs">Lvl {dungeon.min_level}</span>
                    </div>
                  )}
                  {status === 'cooldown' && (
                    <div className="flex items-center gap-1 text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">{cooldown}</span>
                    </div>
                  )}
                  {(status === 'available' || status === 'in_progress') && (
                    <ChevronRight className="w-5 h-5 text-primary-light" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Combat Modal */}
      <Modal open={showCombatModal} onClose={closeCombatModal} title={isBoss ? 'Boss Fight' : 'Stage Combat'}>
        <div className="space-y-4">
          <div className="text-center">
            <p className={`text-2xl font-display font-bold ${combatWon ? 'text-stamina' : 'text-secondary-light'}`}>
              {displayRound >= combatRounds.length
                ? combatWon
                  ? 'VICTORY!'
                  : 'DEFEATED'
                : 'Fighting...'}
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {combatRounds.slice(0, displayRound).map((r) => (
              <div key={r.round} className="flex items-center gap-2 text-xs p-1.5 rounded bg-bg-darkest/50">
                <span className="text-text-muted w-12">Round {r.round}</span>
                <span className="text-stamina">-{r.playerDmg}</span>
                <span className="text-text-muted mx-1">|</span>
                <span className="text-secondary-light">-{r.enemyDmg}</span>
                <span className="ml-auto text-text-muted">
                  {r.playerHp} / {r.enemyHp} HP
                </span>
              </div>
            ))}
          </div>

          {displayRound >= combatRounds.length && (
            <div className="text-center">
              <Button onClick={closeCombatModal}>
                {combatWon && !isBoss ? 'Next Stage' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Reward Modal */}
      <Modal open={showRewardModal} onClose={closeRewardModal} title="Dungeon Completed!">
        {rewards && (
          <div className="text-center space-y-4">
            <Trophy className="w-12 h-12 text-primary-light mx-auto" />
            <p className="font-display text-lg text-parchment">
              {selectedDungeon?.name} Cleared!
            </p>
            <div className="space-y-2">
              <p className="text-sm"><span className="text-xp font-bold">+{rewards.xp} XP</span></p>
              <p className="text-sm"><span className="text-primary-light font-bold">+{rewards.gold} Gold</span></p>
              {rewards.gems > 0 && (
                <p className="text-sm"><span className="text-accent font-bold">+{rewards.gems} Gems</span></p>
              )}
            </div>
            <Button onClick={closeRewardModal}>Continue</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
