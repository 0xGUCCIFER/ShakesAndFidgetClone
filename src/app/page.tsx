'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Shield, Wand2, Sword, Cross } from 'lucide-react'

type Tab = 'login' | 'register'
type CharClass = 'warrior' | 'mage' | 'rogue' | 'paladin'

const classCards: { value: CharClass; label: string; icon: typeof Shield; desc: string; stats: string }[] = [
  { value: 'warrior', label: 'Krieger', icon: Shield, desc: 'Ein maechtiger Kaempfer mit hoher Ausdauer und Staerke.', stats: 'STR 15 / CON 13 / HP 130' },
  { value: 'mage', label: 'Magier', icon: Wand2, desc: 'Ein weiser Zauberer mit verheerender magischer Kraft.', stats: 'INT 16 / LCK 6 / HP 80' },
  { value: 'rogue', label: 'Schurke', icon: Sword, desc: 'Ein flinker Schatten mit toedlicher Praezision.', stats: 'DEX 16 / LCK 8 / HP 90' },
  { value: 'paladin', label: 'Paladin', icon: Cross, desc: 'Ein heiliger Ritter mit goettlichem Schutz.', stats: 'STR 12 / CON 14 / HP 120' },
]

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedClass, setSelectedClass] = useState<CharClass>('warrior')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/game/taverne')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!displayName.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    setLoading(true)
    const result = await signUp(email, password, displayName, selectedClass)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/game/taverne')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg fantasy-card p-8">
        <h1 className="font-display text-3xl font-bold text-center text-primary-light mb-2">
          Blades &amp; Bravery
        </h1>
        <p className="text-center text-text-muted text-sm mb-6">
          Betritt die Welt der Abenteuer
        </p>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-bg-light">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 pb-2 text-sm font-display uppercase tracking-wider transition-colors ${
              tab === 'login'
                ? 'text-primary-light border-b-2 border-primary'
                : 'text-text-muted hover:text-parchment'
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 pb-2 text-sm font-display uppercase tracking-wider transition-colors ${
              tab === 'register'
                ? 'text-primary-light border-b-2 border-primary'
                : 'text-text-muted hover:text-parchment'
            }`}
          >
            Registrieren
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-secondary/20 border border-secondary-light/30 text-secondary-light text-sm">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                E-Mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                Passwort
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Laden...' : 'Anmelden'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                E-Mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                Passwort
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-1">
                Heldenname
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-bg-darkest border border-bg-light text-parchment text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-text-muted uppercase tracking-wider mb-2">
                Klasse waehlen
              </label>
              <div className="grid grid-cols-2 gap-2">
                {classCards.map((c) => {
                  const Icon = c.icon
                  const selected = selectedClass === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedClass(c.value)}
                      className={`p-3 rounded border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-bg-light bg-bg-darkest hover:border-bg-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${selected ? 'text-primary-light' : 'text-text-muted'}`} />
                        <span className={`font-display text-xs font-semibold ${selected ? 'text-primary-light' : 'text-parchment'}`}>
                          {c.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-tight">{c.desc}</p>
                      <p className="text-[10px] text-accent mt-1">{c.stats}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Laden...' : 'Abenteuer starten'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
