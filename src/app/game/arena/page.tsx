'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { CharacterAvatar, Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Swords, Trophy, History, Heart, Sword as SwordIcon, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Character, ArenaRound } from '@/lib/store/types'

type ArenaTab = 'fight' | 'leaderboard' | 'history'

interface Opponent {
  id: string
  name: string
  class: Character['class']
  level: number
  strength: number
  dexterity: number
  intelligence: number
  constitution: number
  hp: number
}

interface FightResult {
  won: boolean
  rounds: ArenaRound[]
  honor: number
  gold: number
  opponentName: string
}

interface LeaderboardEntry {
  character_id: string
  wins: number
  losses: number
  honor_points: number
  name?: string
  class?: Character['class']
  level?: number
}

interface FightHistoryEntry {
  id: string
  opponent_name: string
  won: boolean
  honor: number
  fought_at: string
}

export default function ArenaPage() {
  const character = useGameStore((s) => s.character)
  const [tab, setTab] = useState<ArenaTab>('fight')
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [fightResult, setFightResult] = useState<FightResult | null>(null)
  const [showFightModal, setShowFightModal] = useState(false)
  const [fighting, setFighting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [history, setHistory] = useState<FightHistoryEntry[]>([])
  const [displayRound, setDisplayRound] = useState(0)

  const loadOpponents = useCallback(async () => {
    if (!character) return
    const supabase = createClient()

    const { data } = await supabase
      .from('characters')
      .select('id, strength, dexterity, intelligence, constitution, max_hp, profile_id, profiles(display_name, class, level)')
      .neq('profile_id', character.user_id)
      .limit(3)

    if (data) {
      setOpponents(
        data.map((c) => {
          const p = (c.profiles as unknown as { display_name: string; class: Character['class']; level: number })
          return {
            id: c.id,
            name: p?.display_name ?? 'Unknown',
            class: p?.class ?? 'warrior',
            level: p?.level ?? 1,
            strength: c.strength,
            dexterity: c.dexterity,
            intelligence: c.intelligence,
            constitution: c.constitution,
            hp: c.max_hp,
          }
        })
      )
    }
  }, [character])

  const loadLeaderboard = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('arena_rankings')
      .select('*, character:characters(profile_id, profiles(display_name, class, level))')
      .order('honor_points', { ascending: false })
      .limit(20)

    if (data) {
      setLeaderboard(
        data.map((r) => {
          const ch = r.character as unknown as { profiles: { display_name: string; class: Character['class']; level: number } }
          return {
            character_id: r.character_id,
            wins: r.wins,
            losses: r.losses,
            honor_points: r.honor_points,
            name: ch?.profiles?.display_name,
            class: ch?.profiles?.class,
            level: ch?.profiles?.level,
          }
        })
      )
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (!character) return
    const supabase = createClient()
    const { data } = await supabase
      .from('arena_fights')
      .select('*')
      .or(`attacker_id.eq.${character.id},defender_id.eq.${character.id}`)
      .order('fought_at', { ascending: false })
      .limit(20)

    if (data) {
      setHistory(
        data.map((f) => ({
          id: f.id,
          opponent_name: f.attacker_id === character.id ? 'Gegner' : 'Angreifer',
          won: f.winner_id === character.id,
          honor: f.honor_gained,
          fought_at: f.fought_at,
        }))
      )
    }
  }, [character])

  useEffect(() => {
    loadOpponents()
    loadLeaderboard()
    loadHistory()
  }, [loadOpponents, loadLeaderboard, loadHistory])

  async function fight(opponent: Opponent) {
    if (!character || fighting) return
    setFighting(true)

    // Simple auto-combat simulation
    let attackerHp = character.max_hp
    let defenderHp = opponent.hp
    const rounds: ArenaRound[] = []

    for (let round = 1; round <= 20 && attackerHp > 0 && defenderHp > 0; round++) {
      const atkDmg = Math.max(1, Math.floor(
        (character.strength * 1.5 + character.dexterity * 0.5) * (0.8 + Math.random() * 0.4)
      ))
      const defDmg = Math.max(1, Math.floor(
        (opponent.strength * 1.5 + opponent.dexterity * 0.5) * (0.8 + Math.random() * 0.4)
      ))

      defenderHp = Math.max(0, defenderHp - atkDmg)
      if (defenderHp > 0) {
        attackerHp = Math.max(0, attackerHp - defDmg)
      }

      rounds.push({
        round,
        attacker_hp: attackerHp,
        defender_hp: defenderHp,
        attacker_damage: atkDmg,
        defender_damage: defenderHp > 0 ? defDmg : 0,
      })
    }

    const won = attackerHp > 0 && defenderHp <= 0
    const honor = won ? 15 : -10

    // Save fight to DB
    const supabase = createClient()
    await supabase.from('arena_fights').insert({
      attacker_id: character.id,
      defender_id: opponent.id,
      winner_id: won ? character.id : opponent.id,
      fight_log: JSON.parse(JSON.stringify(rounds)),
      honor_gained: Math.abs(honor),
    })

    // Update ranking
    // Update arena ranking
    try {
      const { data: ranking } = await supabase
        .from('arena_rankings')
        .select('*')
        .eq('character_id', character.id)
        .single()
      if (ranking) {
        await supabase
          .from('arena_rankings')
          .update({
            wins: won ? ranking.wins + 1 : ranking.wins,
            losses: won ? ranking.losses : ranking.losses + 1,
            honor_points: Math.max(0, ranking.honor_points + honor),
          })
          .eq('character_id', character.id)
      }
    } catch {
      // Ranking update failed silently
    }

    setFightResult({
      won,
      rounds,
      honor,
      gold: won ? 50 : 0,
      opponentName: opponent.name,
    })
    setDisplayRound(0)
    setShowFightModal(true)
    setFighting(false)

    showToast(won ? 'success' : 'error', won ? 'Kampf gewonnen!' : 'Kampf verloren!')
  }

  // Animate fight rounds
  useEffect(() => {
    if (!showFightModal || !fightResult) return
    if (displayRound >= fightResult.rounds.length) return

    const timer = setTimeout(() => {
      setDisplayRound((r) => r + 1)
    }, 600)

    return () => clearTimeout(timer)
  }, [showFightModal, displayRound, fightResult])

  const tabs: { value: ArenaTab; label: string; icon: typeof Swords }[] = [
    { value: 'fight', label: 'Kampf', icon: Swords },
    { value: 'leaderboard', label: 'Rangliste', icon: Trophy },
    { value: 'history', label: 'Historie', icon: History },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-primary-light">Arena</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bg-light">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
                tab === t.value
                  ? 'text-primary-light border-b-2 border-primary'
                  : 'text-text-muted hover:text-parchment'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Fight Tab */}
      {tab === 'fight' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opponents.length === 0 ? (
            <p className="col-span-3 text-center text-text-muted py-8">Keine Gegner gefunden.</p>
          ) : (
            opponents.map((opp) => (
              <div key={opp.id} className="fantasy-card p-5 flex flex-col items-center gap-4">
                <CharacterAvatar
                  characterClass={opp.class}
                  level={opp.level}
                  name={opp.name}
                />
                <div className="w-full space-y-1 text-xs text-text-light">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><SwordIcon className="w-3 h-3" /> STR</span>
                    <span>{opp.strength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> CON</span>
                    <span>{opp.constitution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> HP</span>
                    <span>{opp.hp}</span>
                  </div>
                </div>
                <Button
                  onClick={() => fight(opp)}
                  disabled={fighting}
                  className="w-full"
                >
                  {fighting ? 'Kaempfe...' : 'Kaempfen'}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div className="fantasy-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted uppercase tracking-wider bg-bg-darkest/50">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Spieler</th>
                <th className="text-center p-3">Siege</th>
                <th className="text-center p-3">Niederlagen</th>
                <th className="text-right p-3">Ehre</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.character_id} className="border-t border-bg-light/30 hover:bg-bg-light/10">
                  <td className="p-3 text-text-muted">{i + 1}</td>
                  <td className="p-3">
                    <span className="text-parchment">{entry.name ?? 'Unknown'}</span>
                    {entry.level && (
                      <span className="text-xs text-text-muted ml-1">Lvl {entry.level}</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-stamina">{entry.wins}</td>
                  <td className="p-3 text-center text-secondary-light">{entry.losses}</td>
                  <td className="p-3 text-right text-primary-light font-semibold">{entry.honor_points}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-8">Noch keine Kaempfe.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && (
            <p className="text-center text-text-muted py-8">Noch keine Kaempfe.</p>
          )}
          {history.map((h) => (
            <div key={h.id} className="fantasy-card p-3 flex items-center justify-between">
              <div>
                <span className={h.won ? 'text-stamina font-semibold' : 'text-secondary-light font-semibold'}>
                  {h.won ? 'Sieg' : 'Niederlage'}
                </span>
                <span className="text-text-muted text-xs ml-2">
                  {new Date(h.fought_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              <span className={`text-sm ${h.won ? 'text-primary-light' : 'text-secondary-light'}`}>
                {h.won ? '+' : '-'}{h.honor} Ehre
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fight Result Modal */}
      <Modal
        open={showFightModal}
        onClose={() => setShowFightModal(false)}
        title="Kampfergebnis"
      >
        {fightResult && (
          <div className="space-y-4">
            <div className="text-center">
              <p className={`text-2xl font-display font-bold ${fightResult.won ? 'text-stamina' : 'text-secondary-light'}`}>
                {fightResult.won ? 'SIEG!' : 'NIEDERLAGE'}
              </p>
              <p className="text-sm text-text-muted mt-1">gegen {fightResult.opponentName}</p>
            </div>

            {/* Animated rounds */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {fightResult.rounds.slice(0, displayRound).map((r) => (
                <div key={r.round} className="flex items-center gap-2 text-xs p-1.5 rounded bg-bg-darkest/50">
                  <span className="text-text-muted w-12">Runde {r.round}</span>
                  <span className="text-secondary-light">-{r.attacker_damage} DMG</span>
                  <span className="text-text-muted mx-1">|</span>
                  <span className="text-stamina">-{r.defender_damage} DMG</span>
                  <span className="ml-auto text-text-muted">
                    {r.attacker_hp} / {r.defender_hp} HP
                  </span>
                </div>
              ))}
            </div>

            {displayRound >= fightResult.rounds.length && (
              <div className="text-center space-y-1">
                <p className="text-sm text-parchment">
                  Ehre: <span className={fightResult.honor > 0 ? 'text-stamina' : 'text-secondary-light'}>
                    {fightResult.honor > 0 ? '+' : ''}{fightResult.honor}
                  </span>
                </p>
                {fightResult.gold > 0 && (
                  <p className="text-sm text-primary-light">+{fightResult.gold} Gold</p>
                )}
              </div>
            )}

            <div className="text-center">
              <Button onClick={() => setShowFightModal(false)}>Schliessen</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
