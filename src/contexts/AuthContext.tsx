import React, { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // 2. Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        return { error }
      }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
