export const REWARD_TIERS: Record<number, { gold: number; gems: number }> = {
  1: { gold: 50, gems: 0 },
  2: { gold: 75, gems: 0 },
  3: { gold: 100, gems: 2 },
  4: { gold: 125, gems: 2 },
  5: { gold: 200, gems: 5 },
  6: { gold: 300, gems: 5 },
  7: { gold: 500, gems: 10 },
}

export function getRewardForDay(day: number): { gold: number; gems: number } {
  return REWARD_TIERS[day] ?? REWARD_TIERS[7]
}
