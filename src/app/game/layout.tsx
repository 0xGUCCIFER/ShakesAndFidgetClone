import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameLayout } from '@/components/layout/GameLayout'
import { GameDataLoader } from './GameDataLoader'
import { DailyRewardModal } from '@/components/game/DailyRewardModal'

export default async function GameRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id

  // First get profile + character
  const [profileRes, characterRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('characters').select('*').eq('profile_id', userId).single(),
  ])

  const profile = profileRes.data
  const character = characterRes.data
  const characterId = character?.id ?? ''

  // Then fetch inventory + active quest using character ID
  const [inventoryRes, activeQuestRes] = await Promise.all([
    supabase
      .from('inventory')
      .select('*, item:items(*)')
      .eq('character_id', characterId),
    supabase
      .from('active_quests')
      .select('*, quest:quests(*)')
      .eq('character_id', characterId)
      .maybeSingle(),
  ])

  const inventoryData = inventoryRes.data ?? []
  const activeQuestData = activeQuestRes.data

  return (
    <GameLayout>
      <GameDataLoader
        profile={profile}
        character={character}
        inventory={inventoryData}
        activeQuest={activeQuestData}
      />
      <DailyRewardModal />
      {children}
    </GameLayout>
  )
}
