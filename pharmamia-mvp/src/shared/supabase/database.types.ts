// Auto-generated types from Supabase schema.
// To regenerate: pnpm run db:types  (requires supabase start)
//   supabase gen types typescript --local > src/shared/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type HouseholdRole = 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: HouseholdRole
          joined_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: HouseholdRole
          joined_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: HouseholdRole
          joined_at?: string
        }
      }
      drugs_catalog: {
        Row: {
          id: string
          aic_code: string
          ean_code: string | null
          name: string
          active_ingredient: string | null
          form: string | null
          dosage: string | null
          atc_code: string | null
          manufacturer: string | null
          package_desc: string | null
          is_otc: boolean
          requires_prescription: boolean
          created_at: string
        }
        Insert: {
          id?: string
          aic_code: string
          ean_code?: string | null
          name: string
          active_ingredient?: string | null
          form?: string | null
          dosage?: string | null
          atc_code?: string | null
          manufacturer?: string | null
          package_desc?: string | null
          is_otc?: boolean
          requires_prescription?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          aic_code?: string
          ean_code?: string | null
          name?: string
          active_ingredient?: string | null
          form?: string | null
          dosage?: string | null
          atc_code?: string | null
          manufacturer?: string | null
          package_desc?: string | null
          is_otc?: boolean
          requires_prescription?: boolean
          created_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          household_id: string
          catalog_id: string | null
          name: string
          quantity: number
          unit: string
          expires_at: string | null
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          catalog_id?: string | null
          name: string
          quantity?: number
          unit?: string
          expires_at?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          catalog_id?: string | null
          name?: string
          quantity?: number
          unit?: string
          expires_at?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      therapies: {
        Row: {
          id: string
          household_id: string
          member_id: string
          catalog_id: string | null
          medication_id: string | null
          name: string
          dosage: string | null
          frequency: string | null
          start_date: string
          end_date: string | null
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          member_id: string
          catalog_id?: string | null
          medication_id?: string | null
          name: string
          dosage?: string | null
          frequency?: string | null
          start_date: string
          end_date?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          member_id?: string
          catalog_id?: string | null
          medication_id?: string | null
          name?: string
          dosage?: string | null
          frequency?: string | null
          start_date?: string
          end_date?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      ensure_personal_household: {
        Args: Record<string, never>
        Returns: string
      }
      is_household_member: {
        Args: { p_household_id: string }
        Returns: boolean
      }
    }
    Enums: {
      household_role: HouseholdRole
    }
  }
}
