# Blades & Bravery

**A Shakes & Fidget-inspired browser RPG built with modern web technologies.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Game Mechanics](#game-mechanics)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Character System** -- Choose from 4 classes (Warrior, Mage, Rogue, Paladin), each with unique base stats. Allocate stat points on level up.
- **Quest System** -- Accept quests from the tavern, spend stamina, wait for timers, and collect XP, gold, and item drops.
- **Arena PvP** -- Fight other players in turn-based combat. Climb the honor leaderboard and earn gold rewards.
- **Guild System** -- Create or join guilds with up to 20 members. Real-time guild chat, officer roles, and a shared treasury.
- **Shop** -- Buy weapons, armor, and accessories with gold or gems. Featured items rotate on a schedule.
- **Marketplace** -- Player-to-player trading. List items for sale, browse offers, and buy from other heroes.
- **Inventory & Equipment** -- 8 equipment slots (head, chest, legs, boots, weapon, shield, ring, amulet). 5 rarity tiers from Common to Legendary.
- **Leveling & Progression** -- XP curve with 5 stat points per level. Constitution increases max HP.

---

## Screenshots

> Screenshots coming soon.

<!-- Replace these with actual screenshots -->
<!-- ![Login](docs/screenshots/login.png) -->
<!-- ![Tavern](docs/screenshots/tavern.png) -->
<!-- ![Arena](docs/screenshots/arena.png) -->
<!-- ![Guild](docs/screenshots/guild.png) -->

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) |
| Backend | [Supabase](https://supabase.com/) (Auth, Database, Realtime) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn)
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/0xGUCCIFER/ShakesAndFidgetClone.git
cd ShakesAndFidgetClone
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Game Mechanics

### Character Classes

| Class | STR | DEX | INT | CON | LCK | HP |
|---|---|---|---|---|---|---|
| Warrior | 15 | 8 | 5 | 13 | 5 | 130 |
| Mage | 5 | 8 | 16 | 6 | 6 | 80 |
| Rogue | 8 | 16 | 6 | 7 | 8 | 90 |
| Paladin | 12 | 7 | 8 | 14 | 5 | 120 |

On each level up, the player receives **5 stat points** to allocate freely. Each point of Constitution adds **10 max HP**.

### Combat

Fights are turn-based and fully simulated on the server.

- **Turn order**: Higher Dexterity attacks first.
- **Base damage**: `(STR * 1.5 + weapon_bonus) * random(0.8..1.2)`
- **Mage bonus**: Mages add `INT * 0.8` to base damage.
- **Critical hit**: `Luck%` chance to deal **2x** damage.
- **Defense**: `CON * 0.5 + armor_bonus` is subtracted from damage (minimum 1).

### Arena Honor

- Win: **+25 honor**, **+50 gold**
- Loss: **-15 honor**
- Matchmaking pairs opponents within +/- 200 honor points.

### XP & Leveling

XP required for the next level:

```
xp_needed = floor(level * 100 * 1.5)
```

Level 1 requires 150 XP, level 10 requires 1500 XP, and so on. Multiple level-ups can occur from a single quest reward.

### Quests

- Each quest costs **stamina** and runs on a **real-time timer** (duration in seconds).
- Only **one active quest** at a time.
- Rewards: XP + gold + a random item drop (probability set per quest).
- Quest difficulties: Easy, Medium, Hard, Legendary.

### Economy

- **Gold**: Earned from quests, arena wins, and trading. Spent in the shop, marketplace, and guild creation.
- **Gems**: Premium currency available for select shop purchases.
- **Guild creation cost**: 500 gold.

### Equipment

8 slots: Head, Chest, Legs, Boots, Weapon, Shield, Ring, Amulet.

5 rarity tiers: Common, Uncommon, Rare, Epic, Legendary.

Items provide stat bonuses (strength, dexterity, intelligence, constitution, luck, damage, armor) stored as JSON.

For detailed game design documentation, see [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

---

## Project Structure

```
shakes-and-fidget-clone/
├── public/                     # Static assets
├── docs/
│   └── GAME_DESIGN.md         # Detailed game design document
├── src/
│   ├── app/
│   │   ├── page.tsx            # Auth page (login/register)
│   │   ├── layout.tsx          # Root layout
│   │   └── game/
│   │       ├── layout.tsx      # Game layout with sidebar/navbar
│   │       ├── GameDataLoader.tsx
│   │       ├── character/      # Character stats & equipment
│   │       ├── tavern/         # Quest board
│   │       ├── arena/          # PvP arena
│   │       ├── shop/           # NPC shop
│   │       ├── inventory/      # Inventory management
│   │       ├── guild/          # Guild hub & chat
│   │       └── marketplace/    # Player trading
│   ├── components/
│   │   ├── ui/                 # Button, Modal, ProgressBar, ItemCard, etc.
│   │   └── layout/             # Sidebar, Navbar, GameLayout, MobileHeader
│   ├── lib/
│   │   ├── actions/            # Server actions
│   │   │   ├── auth.ts         # Sign up, sign in, sign out
│   │   │   ├── character.ts    # Character CRUD & stat allocation
│   │   │   ├── quest.ts        # Quest start/complete/active
│   │   │   ├── combat.ts       # Arena fight simulation
│   │   │   ├── shop.ts         # Shop browsing & purchasing
│   │   │   ├── inventory.ts    # Equip/unequip items
│   │   │   ├── guild.ts        # Guild CRUD, chat, membership
│   │   │   └── trading.ts      # Marketplace offers & trades
│   │   ├── store/
│   │   │   ├── gameStore.ts    # Zustand global state
│   │   │   └── types.ts        # Client-side type definitions
│   │   └── supabase/
│   │       ├── client.ts       # Browser Supabase client
│   │       ├── server.ts       # Server Supabase client
│   │       ├── middleware.ts    # Auth middleware helper
│   │       └── types.ts        # Generated database types
│   └── middleware.ts            # Next.js auth middleware
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to your branch: `git push origin feature/my-feature`
5. Open a Pull Request.

Please keep PRs focused on a single change and include a clear description.

---

## License

This project is licensed under the [MIT License](LICENSE).
