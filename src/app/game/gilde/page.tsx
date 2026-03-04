'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { Button, Modal } from '@/components/ui'
import { showToast } from '@/components/ui/Toast'
import { Users, Crown, Shield, Search, Plus, Send, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Character } from '@/lib/store/types'

interface GuildInfo {
  id: string
  name: string
  description: string | null
  leader_id: string
  level: number
  treasury_gold: number
  max_members: number
}

interface Member {
  id: string
  character_id: string
  role: 'leader' | 'officer' | 'member'
  name: string
  class: Character['class']
  level: number
}

interface ChatMsg {
  id: string
  character_id: string
  message: string
  sent_at: string
  name?: string
}

export default function GildePage() {
  const character = useGameStore((s) => s.character)
  const [guild, setGuild] = useState<GuildInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GuildInfo[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newGuildName, setNewGuildName] = useState('')
  const [newGuildDesc, setNewGuildDesc] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadGuild = useCallback(async () => {
    if (!character) return
    const supabase = createClient()

    // Check if character is in a guild
    const { data: membership } = await supabase
      .from('guild_members')
      .select('guild_id')
      .eq('character_id', character.id)
      .maybeSingle()

    if (!membership) {
      setGuild(null)
      setLoading(false)
      return
    }

    // Load guild info
    const { data: guildData } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', membership.guild_id)
      .single()

    if (guildData) {
      setGuild(guildData)
    }

    // Load members
    const { data: memberData } = await supabase
      .from('guild_members')
      .select('*, character:characters(profile_id, profiles(display_name, class, level))')
      .eq('guild_id', membership.guild_id)
      .order('role')

    if (memberData) {
      setMembers(
        memberData.map((m) => {
          const ch = m.character as unknown as { profiles: { display_name: string; class: Character['class']; level: number } }
          return {
            id: m.id,
            character_id: m.character_id,
            role: m.role,
            name: ch?.profiles?.display_name ?? 'Unknown',
            class: ch?.profiles?.class ?? 'warrior',
            level: ch?.profiles?.level ?? 1,
          }
        })
      )
    }

    // Load chat
    const { data: chatData } = await supabase
      .from('guild_chat')
      .select('*, character:characters(profile_id, profiles(display_name))')
      .eq('guild_id', membership.guild_id)
      .order('sent_at', { ascending: true })
      .limit(100)

    if (chatData) {
      setChatMessages(
        chatData.map((msg) => {
          const ch = msg.character as unknown as { profiles: { display_name: string } }
          return {
            id: msg.id,
            character_id: msg.character_id,
            message: msg.message,
            sent_at: msg.sent_at,
            name: ch?.profiles?.display_name,
          }
        })
      )
    }

    setLoading(false)
  }, [character])

  useEffect(() => {
    loadGuild()
  }, [loadGuild])

  // Realtime chat subscription
  useEffect(() => {
    if (!guild) return
    const supabase = createClient()

    const channel = supabase
      .channel(`guild-chat-${guild.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guild_chat', filter: `guild_id=eq.${guild.id}` },
        (payload) => {
          const msg = payload.new as { id: string; character_id: string; message: string; sent_at: string }
          setChatMessages((prev) => [...prev, { ...msg, name: undefined }])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [guild])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || !character || !guild) return

    const supabase = createClient()
    await supabase.from('guild_chat').insert({
      guild_id: guild.id,
      character_id: character.id,
      message: chatInput.trim(),
    })

    setChatInput('')
  }

  async function searchGuilds() {
    const supabase = createClient()
    const { data } = await supabase
      .from('guilds')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .limit(10)

    if (data) {
      setSearchResults(data)
    }
  }

  async function joinGuild(guildId: string) {
    if (!character) return
    const supabase = createClient()

    const { error } = await supabase.from('guild_members').insert({
      guild_id: guildId,
      character_id: character.id,
      role: 'member',
    })

    if (error) {
      showToast('error', 'Konnte Gilde nicht beitreten.')
      return
    }

    showToast('success', 'Gilde beigetreten!')
    loadGuild()
  }

  async function createGuild() {
    if (!character || !newGuildName.trim()) return
    const supabase = createClient()

    const { data: guildData, error } = await supabase
      .from('guilds')
      .insert({
        name: newGuildName.trim(),
        description: newGuildDesc.trim() || null,
        leader_id: character.id,
      })
      .select()
      .single()

    if (error) {
      showToast('error', error.message)
      return
    }

    if (guildData) {
      // Add self as leader member
      await supabase.from('guild_members').insert({
        guild_id: guildData.id,
        character_id: character.id,
        role: 'leader',
      })

      showToast('success', 'Gilde erstellt!')
      setShowCreate(false)
      loadGuild()
    }
  }

  async function leaveGuild() {
    if (!character || !guild) return
    const supabase = createClient()

    await supabase.from('guild_members').delete().eq('character_id', character.id)
    setGuild(null)
    setMembers([])
    setChatMessages([])
    showToast('success', 'Gilde verlassen.')
  }

  const roleIcon = (role: string) => {
    if (role === 'leader') return <Crown className="w-3.5 h-3.5 text-primary-light" />
    if (role === 'officer') return <Shield className="w-3.5 h-3.5 text-accent" />
    return null
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="fantasy-card p-4 animate-pulse h-48" />
      </div>
    )
  }

  // No guild view
  if (!guild) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-xl font-bold text-primary-light">Gilde</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search */}
          <div className="fantasy-card p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-primary-light flex items-center gap-2">
              <Search className="w-4 h-4" /> Gilde suchen
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gildenname..."
                className="flex-1 px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
              <Button size="sm" onClick={searchGuilds}>Suchen</Button>
            </div>
            <div className="space-y-2">
              {searchResults.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded bg-bg-darkest/50 border border-bg-light/30">
                  <div>
                    <p className="text-sm text-parchment font-semibold">{g.name}</p>
                    <p className="text-xs text-text-muted">Level {g.level}</p>
                  </div>
                  <Button size="sm" onClick={() => joinGuild(g.id)}>Beitreten</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Create */}
          <div className="fantasy-card p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-primary-light flex items-center gap-2">
              <Plus className="w-4 h-4" /> Gilde gruenden
            </h2>
            <p className="text-xs text-text-muted">Gruende deine eigene Gilde und werde zum Anfuehrer!</p>
            <Button onClick={() => setShowCreate(true)} className="w-full">Gilde erstellen</Button>
          </div>
        </div>

        {/* Create Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Gilde erstellen">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                Gildenname
              </label>
              <input
                type="text"
                value={newGuildName}
                onChange={(e) => setNewGuildName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                Beschreibung
              </label>
              <textarea
                value={newGuildDesc}
                onChange={(e) => setNewGuildDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <Button onClick={createGuild} className="w-full">Erstellen</Button>
          </div>
        </Modal>
      </div>
    )
  }

  // In guild view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-light flex items-center gap-2">
          <Users className="w-5 h-5" /> {guild.name}
        </h1>
        <Button variant="outline" size="sm" onClick={leaveGuild}>Verlassen</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guild Info + Members */}
        <div className="space-y-4">
          <div className="fantasy-card p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Level</span>
                <span className="text-parchment">{guild.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Mitglieder</span>
                <span className="text-parchment">{members.length}/{guild.max_members}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Schatzkammer</span>
                <span className="text-primary-light">{guild.treasury_gold} Gold</span>
              </div>
            </div>
            {guild.description && (
              <p className="text-xs text-text-muted mt-3 pt-3 border-t border-bg-light/30">
                {guild.description}
              </p>
            )}
          </div>

          <div className="fantasy-card p-4">
            <h3 className="font-display text-xs font-semibold text-primary-light uppercase tracking-wider mb-3">
              Mitglieder
            </h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded bg-bg-darkest/30">
                  {roleIcon(m.role)}
                  <span className="text-sm text-parchment flex-1">{m.name}</span>
                  <span className="text-xs text-text-muted">Lvl {m.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 fantasy-card p-4 flex flex-col" style={{ minHeight: 400 }}>
          <h3 className="font-display text-xs font-semibold text-primary-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Gildenchat
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
            {chatMessages.length === 0 && (
              <p className="text-center text-text-muted text-sm py-8">Noch keine Nachrichten.</p>
            )}
            {chatMessages.map((msg) => {
              const isOwn = msg.character_id === character?.id
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded ${isOwn ? 'bg-primary/15 border border-primary/20' : 'bg-bg-darkest/50 border border-bg-light/30'}`}>
                    {!isOwn && (
                      <p className="text-[10px] text-accent font-semibold mb-0.5">{msg.name ?? 'Unknown'}</p>
                    )}
                    <p className="text-sm text-parchment">{msg.message}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">
                      {new Date(msg.sent_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nachricht schreiben..."
              className="flex-1 px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
            />
            <Button type="submit" size="sm" disabled={!chatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
