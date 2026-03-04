'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type CharacterClass = Database['public']['Enums']['character_class']

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  characterClass: CharacterClass
) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        character_class: characterClass,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Profile + character are auto-created by database trigger on auth.users
  // Auto-sign in after registration (email is auto-confirmed by trigger)
  if (data.user && !data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      return { error: signInError.message }
    }
  }

  return { data: data.user }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { data: data.session }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getSession() {
  const supabase = await createClient()

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    return { error: error.message }
  }

  return { data: session }
}
