import React, { createContext, useContext, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { applyThemePrimaryColor } from "@/lib/colorUtils"
import type { Database } from "@/types/database.types"
import { Loader2 } from "lucide-react"

export type HotelSettingsRow = Database["public"]["Tables"]["hotel_settings"]["Row"]
export type HotelSettingsUpdate = Database["public"]["Tables"]["hotel_settings"]["Update"]

export const HOTEL_SETTINGS_QUERY_KEY = ["hotel_settings"]
const STORAGE_THEME_KEY = "hotel_theme_primary_color"

// Immediately apply cached theme if available to prevent any flash of unstyled content
if (typeof window !== "undefined") {
  const cachedColor = localStorage.getItem(STORAGE_THEME_KEY)
  if (cachedColor) {
    applyThemePrimaryColor(cachedColor)
  }
}

interface HotelSettingsContextType {
  settings: HotelSettingsRow | null | undefined
  isLoading: boolean
  updateSettings: (updates: HotelSettingsUpdate) => Promise<HotelSettingsRow>
  isUpdating: boolean
}

const HotelSettingsContext = createContext<HotelSettingsContextType | undefined>(undefined)

export function HotelSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: HOTEL_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle()

      if (error) throw error
      return data as HotelSettingsRow | null
    },
    enabled: Boolean(user),
    staleTime: 1000 * 60 * 5,
  })

  // Apply theme color whenever settings are loaded or changed
  useEffect(() => {
    if (settings?.theme_primary_color) {
      applyThemePrimaryColor(settings.theme_primary_color)
      localStorage.setItem(STORAGE_THEME_KEY, settings.theme_primary_color)
    }
  }, [settings?.theme_primary_color])

  const updateMutation = useMutation({
    mutationFn: async (updates: HotelSettingsUpdate) => {
      const { data, error } = await supabase
        .from("hotel_settings")
        .update(updates)
        .eq("id", 1)
        .select()
        .single()

      if (error) throw error
      return data as HotelSettingsRow
    },
    onSuccess: (updated) => {
      if (updated.theme_primary_color) {
        applyThemePrimaryColor(updated.theme_primary_color)
        localStorage.setItem(STORAGE_THEME_KEY, updated.theme_primary_color)
      }
      queryClient.setQueryData(HOTEL_SETTINGS_QUERY_KEY, updated)
      queryClient.invalidateQueries({ queryKey: HOTEL_SETTINGS_QUERY_KEY })
    },
  })

  // Show a brief loading screen while auth or initial settings are resolving for logged in users
  const isInitialLoading = isAuthLoading || (Boolean(user) && isSettingsLoading)

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-500">Loading hotel environment...</p>
        </div>
      </div>
    )
  }

  return (
    <HotelSettingsContext.Provider
      value={{
        settings,
        isLoading: isSettingsLoading,
        updateSettings: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
      }}
    >
      {children}
    </HotelSettingsContext.Provider>
  )
}

export function useHotelSettings() {
  const context = useContext(HotelSettingsContext)
  if (context === undefined) {
    throw new Error("useHotelSettings must be used within a HotelSettingsProvider")
  }
  return context
}
