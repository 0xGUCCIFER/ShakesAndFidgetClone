export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          description: string
          gem_reward: number
          icon_name: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category: string
          description: string
          gem_reward?: number
          icon_name: string
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          description?: string
          gem_reward?: number
          icon_name?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      active_quests: {
        Row: {
          character_id: string
          completes_at: string
          id: string
          quest_id: string
          started_at: string
        }
        Insert: {
          character_id: string
          completes_at: string
          id?: string
          quest_id: string
          started_at?: string
        }
        Update: {
          character_id?: string
          completes_at?: string
          id?: string
          quest_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_quests_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_fights: {
        Row: {
          attacker_id: string
          defender_id: string
          fight_log: Json
          fought_at: string
          honor_gained: number
          id: string
          winner_id: string | null
        }
        Insert: {
          attacker_id: string
          defender_id: string
          fight_log?: Json
          fought_at?: string
          honor_gained?: number
          id?: string
          winner_id?: string | null
        }
        Update: {
          attacker_id?: string
          defender_id?: string
          fight_log?: Json
          fought_at?: string
          honor_gained?: number
          id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_fights_attacker_id_fkey"
            columns: ["attacker_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_fights_defender_id_fkey"
            columns: ["defender_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_fights_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_rankings: {
        Row: {
          character_id: string
          honor_points: number
          id: string
          losses: number
          wins: number
        }
        Insert: {
          character_id: string
          honor_points?: number
          id?: string
          losses?: number
          wins?: number
        }
        Update: {
          character_id?: string
          honor_points?: number
          id?: string
          losses?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "arena_rankings_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rewards: {
        Row: {
          character_id: string
          id: string
          last_claimed: string | null
          streak_count: number
        }
        Insert: {
          character_id: string
          id?: string
          last_claimed?: string | null
          streak_count?: number
        }
        Update: {
          character_id?: string
          id?: string
          last_claimed?: string | null
          streak_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_rewards_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeon_progress: {
        Row: {
          character_id: string
          completed_at: string | null
          current_stage: number
          dungeon_id: string
          id: string
          started_at: string
        }
        Insert: {
          character_id: string
          completed_at?: string | null
          current_stage?: number
          dungeon_id: string
          id?: string
          started_at?: string
        }
        Update: {
          character_id?: string
          completed_at?: string | null
          current_stage?: number
          dungeon_id?: string
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dungeon_progress_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dungeon_progress_dungeon_id_fkey"
            columns: ["dungeon_id"]
            isOneToOne: false
            referencedRelation: "dungeons"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeons: {
        Row: {
          boss_name: string
          cooldown_hours: number
          created_at: string
          description: string
          gem_reward: number
          gold_reward: number
          id: string
          min_level: number
          name: string
          stages: number
          xp_reward: number
        }
        Insert: {
          boss_name?: string
          cooldown_hours?: number
          created_at?: string
          description?: string
          gem_reward?: number
          gold_reward?: number
          id?: string
          min_level?: number
          name: string
          stages?: number
          xp_reward?: number
        }
        Update: {
          boss_name?: string
          cooldown_hours?: number
          created_at?: string
          description?: string
          gem_reward?: number
          gold_reward?: number
          id?: string
          min_level?: number
          name?: string
          stages?: number
          xp_reward?: number
        }
        Relationships: []
      }
      characters: {
        Row: {
          constitution: number
          current_hp: number
          dexterity: number
          id: string
          intelligence: number
          luck: number
          max_hp: number
          max_stamina: number
          profile_id: string
          stamina: number
          strength: number
        }
        Insert: {
          constitution?: number
          current_hp?: number
          dexterity?: number
          id?: string
          intelligence?: number
          luck?: number
          max_hp?: number
          max_stamina?: number
          profile_id: string
          stamina?: number
          strength?: number
        }
        Update: {
          constitution?: number
          current_hp?: number
          dexterity?: number
          id?: string
          intelligence?: number
          luck?: number
          max_hp?: number
          max_stamina?: number
          profile_id?: string
          stamina?: number
          strength?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_chat: {
        Row: {
          character_id: string
          guild_id: string
          id: string
          message: string
          sent_at: string
        }
        Insert: {
          character_id: string
          guild_id: string
          id?: string
          message: string
          sent_at?: string
        }
        Update: {
          character_id?: string
          guild_id?: string
          id?: string
          message?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_chat_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_chat_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          character_id: string
          guild_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["guild_role"]
        }
        Insert: {
          character_id: string
          guild_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
        }
        Update: {
          character_id?: string
          guild_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string
          level: number
          max_members: number
          name: string
          treasury_gold: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          name: string
          treasury_gold?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          name?: string
          treasury_gold?: number
        }
        Relationships: [
          {
            foreignKeyName: "guilds_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          character_id: string
          equipped: boolean
          id: string
          item_id: string
          quantity: number
        }
        Insert: {
          character_id: string
          equipped?: boolean
          id?: string
          item_id: string
          quantity?: number
        }
        Update: {
          character_id?: string
          equipped?: boolean
          id?: string
          item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          description: string | null
          icon_name: string | null
          id: string
          item_type: string
          level_required: number
          name: string
          rarity: Database["public"]["Enums"]["item_rarity"]
          slot: Database["public"]["Enums"]["item_slot"]
          stat_bonuses: Json
        }
        Insert: {
          description?: string | null
          icon_name?: string | null
          id?: string
          item_type: string
          level_required?: number
          name: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          slot: Database["public"]["Enums"]["item_slot"]
          stat_bonuses?: Json
        }
        Update: {
          description?: string | null
          icon_name?: string | null
          id?: string
          item_type?: string
          level_required?: number
          name?: string
          rarity?: Database["public"]["Enums"]["item_rarity"]
          slot?: Database["public"]["Enums"]["item_slot"]
          stat_bonuses?: Json
        }
        Relationships: []
      }
      player_achievements: {
        Row: {
          achievement_id: string
          character_id: string
          id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          character_id: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          character_id?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class: Database["public"]["Enums"]["character_class"]
          created_at: string
          display_name: string
          gems: number
          gold: number
          id: string
          level: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          class: Database["public"]["Enums"]["character_class"]
          created_at?: string
          display_name: string
          gems?: number
          gold?: number
          id: string
          level?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          class?: Database["public"]["Enums"]["character_class"]
          created_at?: string
          display_name?: string
          gems?: number
          gold?: number
          id?: string
          level?: number
          xp?: number
        }
        Relationships: []
      }
      quests: {
        Row: {
          description: string | null
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          duration_seconds: number
          gold_reward: number
          id: string
          item_drop_chance: number
          min_level: number
          name: string
          stamina_cost: number
          xp_reward: number
        }
        Insert: {
          description?: string | null
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          duration_seconds: number
          gold_reward: number
          id?: string
          item_drop_chance?: number
          min_level?: number
          name: string
          stamina_cost?: number
          xp_reward: number
        }
        Update: {
          description?: string | null
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          duration_seconds?: number
          gold_reward?: number
          id?: string
          item_drop_chance?: number
          min_level?: number
          name?: string
          stamina_cost?: number
          xp_reward?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          available_until: string | null
          id: string
          is_featured: boolean
          item_id: string
          price_gems: number | null
          price_gold: number | null
        }
        Insert: {
          available_until?: string | null
          id?: string
          is_featured?: boolean
          item_id: string
          price_gems?: number | null
          price_gold?: number | null
        }
        Update: {
          available_until?: string | null
          id?: string
          is_featured?: boolean
          item_id?: string
          price_gems?: number | null
          price_gold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_history: {
        Row: {
          buyer_id: string
          completed_at: string
          id: string
          trade_offer_id: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string
          id?: string
          trade_offer_id: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string
          id?: string
          trade_offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_history_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_history_trade_offer_id_fkey"
            columns: ["trade_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offers: {
        Row: {
          created_at: string
          id: string
          item_id: string
          price_gems: number | null
          price_gold: number
          seller_id: string
          status: Database["public"]["Enums"]["trade_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          price_gems?: number | null
          price_gold?: number
          seller_id: string
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          price_gems?: number | null
          price_gold?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Relationships: [
          {
            foreignKeyName: "trade_offers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      character_class: "warrior" | "mage" | "rogue" | "paladin"
      guild_role: "leader" | "officer" | "member"
      item_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      item_slot:
        | "head"
        | "chest"
        | "legs"
        | "boots"
        | "weapon"
        | "shield"
        | "ring"
        | "amulet"
      quest_difficulty: "easy" | "medium" | "hard" | "legendary"
      trade_status: "active" | "sold" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      character_class: ["warrior", "mage", "rogue", "paladin"],
      guild_role: ["leader", "officer", "member"],
      item_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
      item_slot: [
        "head",
        "chest",
        "legs",
        "boots",
        "weapon",
        "shield",
        "ring",
        "amulet",
      ],
      quest_difficulty: ["easy", "medium", "hard", "legendary"],
      trade_status: ["active", "sold", "cancelled"],
    },
  },
} as const
