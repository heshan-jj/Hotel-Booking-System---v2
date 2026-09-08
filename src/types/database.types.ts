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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_id: string
          ical_uid: string | null
          id: string
          notes: string | null
          room_id: string
          source: Database["public"]["Enums"]["booking_source"]
          status: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_id: string
          ical_uid?: string | null
          id?: string
          notes?: string | null
          room_id: string
          source: Database["public"]["Enums"]["booking_source"]
          status?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_id?: string
          ical_uid?: string | null
          id?: string
          notes?: string | null
          room_id?: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          id_number: string | null
          name: string
          nationality: string | null
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      hotel_settings: {
        Row: {
          created_at: string
          id: number
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          theme_primary_color: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          theme_primary_color?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          theme_primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      ical_feeds: {
        Row: {
          created_at: string
          feed_url: string
          id: string
          last_synced_at: string | null
          room_id: string
          source_name: string
        }
        Insert: {
          created_at?: string
          feed_url: string
          id?: string
          last_synced_at?: string | null
          room_id: string
          source_name: string
        }
        Update: {
          created_at?: string
          feed_url?: string
          id?: string
          last_synced_at?: string | null
          room_id?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ical_feeds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          base_rate: number
          capacity: number
          created_at: string
          id: string
          name: string
          property_id: string
        }
        Insert: {
          base_rate: number
          capacity?: number
          created_at?: string
          id?: string
          name: string
          property_id: string
        }
        Update: {
          base_rate?: number
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_log: {
        Row: {
          error: string | null
          feed_id: string
          id: string
          status: string
          synced_at: string
        }
        Insert: {
          error?: string | null
          feed_id: string
          id?: string
          status: string
          synced_at?: string
        }
        Update: {
          error?: string | null
          feed_id?: string
          id?: string
          status?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_log_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "ical_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_source: "direct" | "phone" | "onsite" | "booking_com" | "airbnb"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      booking_source: ["direct", "phone", "onsite", "booking_com", "airbnb"],
    },
  },
} as const
