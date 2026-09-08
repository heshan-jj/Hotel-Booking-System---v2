import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

const env = import.meta.env

const supabaseUrl: string =
  env.VITE_SUPABASE_URL ||
  (typeof globalThis !== "undefined" && "process" in globalThis
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SUPABASE_URL
    : undefined) ||
  ""

const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  (typeof globalThis !== "undefined" && "process" in globalThis
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SUPABASE_ANON_KEY
    : undefined) ||
  ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)."
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
