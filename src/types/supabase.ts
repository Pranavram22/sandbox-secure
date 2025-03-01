export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      code_scans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          code_snippet: string
          language: string
          vulnerabilities: Json[]
          status: string
          source: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          code_snippet: string
          language: string
          vulnerabilities?: Json[]
          status?: string
          source?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          code_snippet?: string
          language?: string
          vulnerabilities?: Json[]
          status?: string
          source?: string | null
        }
      }
      vulnerability_fixes: {
        Row: {
          id: string
          created_at: string
          scan_id: string
          vulnerability_index: number
          fix_code: string
          applied: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          scan_id: string
          vulnerability_index: number
          fix_code: string
          applied?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          scan_id?: string
          vulnerability_index?: number
          fix_code?: string
          applied?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key: string
          name: string
          created_at: string
          last_used_at: string | null
          expires_at: string | null
          revoked: boolean
        }
        Insert: {
          id?: string
          user_id: string
          key: string
          name: string
          created_at?: string
          last_used_at?: string | null
          expires_at?: string | null
          revoked?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          key?: string
          name?: string
          created_at?: string
          last_used_at?: string | null
          expires_at?: string | null
          revoked?: boolean
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