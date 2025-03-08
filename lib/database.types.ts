export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      workouts: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          start_time: string
          end_time: string
          route_data: Json
          distance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          start_time: string
          end_time: string
          route_data: Json
          distance: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          start_time?: string
          end_time?: string
          route_data?: Json
          distance?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

