'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Gift, Gem, Coins } from 'lucide-react'
import { getDailyRewardStatus, claimDailyReward } from '@/lib/actions/daily-rewards'
import { getRewardForDay } from '@/lib/utils/daily-reward-tiers'

const DAY_LABELS = [
  { day: 1, label: 'Day 1' },
  { day: 2, label: 'Day 2' },
  { day: 3, label: 'Day 3' },
  { day: 4, label: 'Day 4' },
  { day: 5, label: 'Day 5' },
  { day: 6, label: 'Day 6' },
  { day: 7, label: 'Day 7' },
]

export function DailyRewardModal() {
  const character = useGameStore((s) => s.character)
  const updateCharacter = useGameStore((s) => s.updateCharacter)

  const [open, setOpen] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [streak, setStreak] = useState(0)
  const [nextDay, setNextDay] = useState(1)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimedReward, setClaimedReward] = useState<{ gold: number; gems: number } | null>(null)

  const checkStatus = useCallback(async () => {
    if (!character) return
    const result = await getDailyRewardStatus()
    if (result.data) {
      setCanClaim(result.data.canClaim)
      setStreak(result.data.streak)
      setNextDay(result.data.nextDay)
      if (result.data.canClaim) {
        setOpen(true)
      }
    }
  }, [character])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  async function handleClaim() {
    if (claiming || !canClaim) return
    setClaiming(true)

    const result = await claimDailyReward()

    if (result.error) {
      showToast('error', result.error)
      setClaiming(false)
      return
    }

    if (result.data) {
      setClaimedReward({ gold: result.data.gold, gems: result.data.gems })
      setClaimed(true)
      setCanClaim(false)
      setStreak(result.data.streak)

      updateCharacter({
        gold: (character?.gold ?? 0) + result.data.gold,
        gems: (character?.gems ?? 0) + result.data.gems,
      })

      showToast('success', `Daily reward claimed! +${result.data.gold} Gold${result.data.gems > 0 ? ` +${result.data.gems} Gems` : ''}`)
    }

    setClaiming(false)
  }

  if (!character) return null

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Daily Rewards">
      <div className="space-y-5">
        <p className="text-sm text-text-light text-center">
          Log in every day to earn rewards! Consecutive days increase your streak.
        </p>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map(({ day, label }) => {
            const reward = getRewardForDay(day)
            const isCurrentDay = day === nextDay && canClaim && !claimed
            const isPast = day < nextDay || (day === nextDay && claimed)

            return (
              <div
                key={day}
                className={`flex flex-col items-center p-1.5 rounded text-center text-[10px] transition-all ${
                  isCurrentDay
                    ? 'bg-primary/20 border border-primary/50 ring-1 ring-primary/30'
                    : isPast
                      ? 'bg-stamina/10 border border-stamina/30'
                      : 'bg-bg-darkest/50 border border-bg-light/20'
                }`}
              >
                <span className={`font-display uppercase tracking-wider ${isCurrentDay ? 'text-primary-light' : isPast ? 'text-stamina' : 'text-text-muted'}`}>
                  {label}
                </span>
                <Coins className={`w-3.5 h-3.5 mt-1 ${isCurrentDay ? 'text-primary-light' : isPast ? 'text-stamina' : 'text-text-muted'}`} />
                <span className={`mt-0.5 ${isCurrentDay ? 'text-primary-light' : isPast ? 'text-stamina' : 'text-text-muted'}`}>
                  {reward.gold}g
                </span>
                {reward.gems > 0 && (
                  <span className={`${isCurrentDay ? 'text-accent' : isPast ? 'text-stamina' : 'text-text-muted'}`}>
                    {reward.gems} <Gem className="w-2.5 h-2.5 inline" />
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center text-xs text-text-muted">
          Current streak: <span className="text-primary-light font-semibold">{streak}</span> {streak === 1 ? 'day' : 'days'}
        </div>

        {/* Claim or claimed state */}
        {claimed && claimedReward ? (
          <div className="text-center space-y-3">
            <Gift className="w-10 h-10 text-primary-light mx-auto" />
            <div className="space-y-1">
              <p className="text-parchment font-semibold">Reward Claimed!</p>
              <p className="text-sm text-primary-light">+{claimedReward.gold} Gold</p>
              {claimedReward.gems > 0 && (
                <p className="text-sm text-accent">+{claimedReward.gems} Gems</p>
              )}
            </div>
            <Button onClick={() => setOpen(false)}>Continue</Button>
          </div>
        ) : canClaim ? (
          <div className="text-center">
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? 'Claiming...' : 'Claim Reward'}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-text-muted">You have already claimed today&apos;s reward.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
