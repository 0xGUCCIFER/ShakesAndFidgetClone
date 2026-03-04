# Blades & Bravery -- Game Design Document

## 1. Character System

### 1.1 Classes

Players choose a class at registration. The class determines starting stats and affects combat mechanics.

| Class | STR | DEX | INT | CON | LCK | Base HP | Description |
|---|---|---|---|---|---|---|---|
| Warrior | 15 | 8 | 5 | 13 | 5 | 130 | High strength and endurance. Excels at sustained melee damage and tanking. |
| Mage | 5 | 8 | 16 | 6 | 6 | 80 | High intelligence. Deals bonus magic damage (`INT * 0.8` added to attacks). Low HP. |
| Rogue | 8 | 16 | 6 | 7 | 8 | 90 | High dexterity and luck. Attacks first and crits more often. |
| Paladin | 12 | 7 | 8 | 14 | 5 | 120 | Balanced offensive stats with the highest constitution. Durable frontline fighter. |

### 1.2 Stats

| Stat | Abbreviation | Effect |
|---|---|---|
| Strength | STR | Increases base melee damage (`STR * 1.5` in damage formula). |
| Dexterity | DEX | Determines turn order in combat. Higher DEX attacks first. |
| Intelligence | INT | Mage-only bonus: adds `INT * 0.8` to base damage. |
| Constitution | CON | Increases defense (`CON * 0.5` damage reduction). Each point adds 10 max HP on allocation. |
| Luck | LCK | Critical hit chance (`LCK%` probability for 2x damage). |

### 1.3 Stat Allocation

- Players receive **5 stat points per level** starting at level 2.
- Points can be allocated freely across any stat.
- Each CON point allocated also grants **+10 max HP**.

---

## 2. Combat System

### 2.1 Damage Formula

```
base_damage = (attacker.STR * 1.5 + weapon_bonus) * random(0.8, 1.2)

if attacker.class == "mage":
    base_damage += attacker.INT * 0.8

if random(0, 100) < attacker.LCK:  // Critical hit
    base_damage *= 2

defense = defender.CON * 0.5 + armor_bonus
final_damage = max(1, floor(base_damage - defense))
```

### 2.2 Turn Order

- The fighter with **higher Dexterity** attacks first each round.
- If DEX is equal, the attacker (initiator) goes first.

### 2.3 Fight Flow

1. Both fighters load their stats including equipped item bonuses.
2. Each round, fighters alternate attacks based on turn order.
3. Damage is calculated per the formula above.
4. The fight ends when one fighter reaches 0 HP.
5. A detailed fight log records each turn (attacker, damage, critical, remaining HP).

### 2.4 Effective Stats

Equipment modifies base stats before combat:
- `stat_bonuses.strength` adds to STR
- `stat_bonuses.dexterity` adds to DEX
- `stat_bonuses.intelligence` adds to INT
- `stat_bonuses.constitution` adds to CON
- `stat_bonuses.luck` adds to LCK
- `stat_bonuses.damage` adds to weapon bonus
- `stat_bonuses.armor` adds to armor bonus

---

## 3. Arena (PvP)

### 3.1 Matchmaking

- The system finds opponents within **+/- 200 honor points** of the player.
- Up to 10 candidates are fetched, shuffled, and 3 are presented as choices.

### 3.2 Honor System

| Result | Honor Change | Gold Reward |
|---|---|---|
| Win | +25 | +50 gold |
| Loss | -15 | 0 |

- Honor cannot drop below 0.
- Starting honor: 1000 (default).
- Both attacker and defender rankings are updated after each fight.

### 3.3 Rankings

- Global leaderboard sorted by honor points (descending).
- Tracks wins, losses, and honor for each character.

---

## 4. Quest System

### 4.1 Quest Properties

| Field | Description |
|---|---|
| `name` | Quest title |
| `description` | Flavor text |
| `difficulty` | easy / medium / hard / legendary |
| `min_level` | Minimum character level required |
| `stamina_cost` | Stamina deducted on start |
| `duration_seconds` | Real-time wait before completion |
| `xp_reward` | XP granted on completion |
| `gold_reward` | Gold granted on completion |
| `item_drop_chance` | Probability (0.0 - 1.0) of receiving an item |

### 4.2 Quest Flow

1. Player browses available quests (filtered by level).
2. Player starts a quest -- stamina is deducted, a timer begins.
3. Only **one active quest** at a time.
4. When the timer expires, the player completes the quest.
5. Rewards: XP + gold + possible random item drop.

### 4.3 Item Drops

- On completion, a roll against `item_drop_chance` determines if an item drops.
- If successful, a random item is selected from items with `level_required <= player_level`.
- The item is added directly to the player's inventory (unequipped).

### 4.4 Level-Up on Completion

- XP is added to the player's total.
- If XP exceeds the threshold, the player levels up (possibly multiple times).
- XP formula: `xp_needed = floor(level * 100 * 1.5)`
- Each level grants 5 allocatable stat points.

---

## 5. Economy

### 5.1 Currencies

| Currency | Source | Usage |
|---|---|---|
| Gold | Quests, arena wins, marketplace sales | Shop purchases, guild creation, marketplace |
| Gems | Premium / special rewards | Select shop items |

### 5.2 Shop

- The NPC shop sells items at fixed prices (gold or gems).
- Items can be marked as **featured** for prominence.
- Items can have an **expiration date** (`available_until`).
- Purchased items go directly to the player's inventory.

### 5.3 Marketplace (Player Trading)

- Players can list unequipped inventory items for sale at a gold price (optionally gems).
- The item is removed from the seller's inventory when listed.
- Buyers pay the listed price; gold transfers to the seller.
- Sellers can cancel offers to reclaim items.
- Offers can be filtered by slot, rarity, and price range.
- Trade history is recorded for buyer reference.

### 5.4 Pricing Reference

| Action | Cost |
|---|---|
| Create guild | 500 gold |
| Arena win reward | 50 gold |

---

## 6. Guild System

### 6.1 Guild Properties

| Field | Description |
|---|---|
| `name` | Guild name (unique) |
| `description` | Guild description |
| `leader_id` | Character ID of the guild leader |
| `level` | Guild level (default 1) |
| `max_members` | Maximum member count (default 20) |
| `treasury_gold` | Shared guild gold pool |

### 6.2 Roles

| Role | Permissions |
|---|---|
| Leader | Full control. Cannot leave without transferring leadership or disbanding. |
| Officer | Elevated member. |
| Member | Standard member. Can chat and leave freely. |

### 6.3 Membership Rules

- A character can belong to only **one guild** at a time.
- Joining requires the guild to have available space (`member_count < max_members`).
- Leaders cannot leave; they must transfer leadership or disband first.

### 6.4 Guild Chat

- Real-time messaging within the guild.
- Messages are stored with character ID and timestamp.
- Last 50 messages are loaded on entry, ordered chronologically.

---

## 7. Equipment System

### 7.1 Equipment Slots

| Slot | Description |
|---|---|
| Head | Helmets, hoods, crowns |
| Chest | Armor, robes, tunics |
| Legs | Leggings, greaves, pants |
| Boots | Footwear |
| Weapon | Swords, staves, daggers |
| Shield | Shields, orbs, off-hand |
| Ring | Finger accessories |
| Amulet | Neck accessories |

Only **one item per slot** can be equipped at a time. Equipping a new item in an occupied slot automatically unequips the previous item.

### 7.2 Rarity Tiers

| Rarity | Color Tier |
|---|---|
| Common | Grey / White |
| Uncommon | Green |
| Rare | Blue |
| Epic | Purple |
| Legendary | Orange / Gold |

Higher rarity items generally have stronger stat bonuses.

### 7.3 Item Properties

| Field | Description |
|---|---|
| `name` | Item display name |
| `item_type` | Category identifier |
| `slot` | Equipment slot |
| `rarity` | Rarity tier |
| `level_required` | Minimum level to equip |
| `stat_bonuses` | JSON object with stat modifiers |
| `icon_name` | Lucide icon identifier |
| `description` | Flavor text |

### 7.4 Stat Bonuses (JSON)

Items can provide any combination of the following bonuses:

```json
{
  "strength": 5,
  "dexterity": 3,
  "intelligence": 0,
  "constitution": 4,
  "luck": 2,
  "damage": 10,
  "armor": 8
}
```

These bonuses are added to the character's base stats during combat calculations.

---

## 8. XP Curve

### Formula

```
xp_for_level(n) = floor(n * 100 * 1.5)
```

### Progression Table

| Level | XP Required | Cumulative XP |
|---|---|---|
| 1 | 150 | 150 |
| 2 | 300 | 450 |
| 3 | 450 | 900 |
| 4 | 600 | 1,500 |
| 5 | 750 | 2,250 |
| 10 | 1,500 | 8,250 |
| 15 | 2,250 | 18,000 |
| 20 | 3,000 | 31,500 |
| 25 | 3,750 | 48,750 |
| 50 | 7,500 | 191,250 |

---

## 9. Database Schema Summary

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User account data (display name, class, level, XP, gold, gems) |
| `characters` | Character stats (STR, DEX, INT, CON, LCK, HP, stamina) |
| `items` | Item definitions (name, slot, rarity, stat bonuses) |
| `inventory` | Character-item ownership and equipped state |
| `quests` | Quest definitions (rewards, difficulty, duration) |
| `active_quests` | Currently running quests with completion timestamps |
| `shop_items` | Items available in the NPC shop with pricing |
| `arena_fights` | Fight records with full combat logs |
| `arena_rankings` | Honor points, wins, losses per character |
| `guilds` | Guild metadata (name, leader, level, treasury) |
| `guild_members` | Membership records with roles |
| `guild_chat` | Chat message history |
| `trade_offers` | Marketplace listings |
| `trade_history` | Completed trade records |

### Enums

| Enum | Values |
|---|---|
| `character_class` | warrior, mage, rogue, paladin |
| `guild_role` | leader, officer, member |
| `item_rarity` | common, uncommon, rare, epic, legendary |
| `item_slot` | head, chest, legs, boots, weapon, shield, ring, amulet |
| `quest_difficulty` | easy, medium, hard, legendary |
| `trade_status` | active, sold, cancelled |
