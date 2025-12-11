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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      engine_brands: {
        Row: {
          created_at: string | null
          engine_brand: string
          id: string
        }
        Insert: {
          created_at?: string | null
          engine_brand: string
          id?: string
        }
        Update: {
          created_at?: string | null
          engine_brand?: string
          id?: string
        }
        Relationships: []
      }
      oem_brands: {
        Row: {
          created_at: string | null
          id: string
          oem_brand: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          oem_brand: string
        }
        Update: {
          created_at?: string | null
          id?: string
          oem_brand?: string
        }
        Relationships: []
      }
      payment_types: {
        Row: {
          created_at: string | null
          id: string
          payment_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          id: string
          product: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          old_laravel_id: number | null
          phone_no: string | null
          short_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          old_laravel_id?: number | null
          phone_no?: string | null
          short_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          old_laravel_id?: number | null
          phone_no?: string | null
          short_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      vendor_engine_brands: {
        Row: {
          created_at: string | null
          engine_brand_id: string
          id: string
          is_certified: boolean | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          engine_brand_id: string
          id?: string
          is_certified?: boolean | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          engine_brand_id?: string
          id?: string
          is_certified?: boolean | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_engine_brands_engine_brand_id_fkey"
            columns: ["engine_brand_id"]
            isOneToOne: false
            referencedRelation: "engine_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_engine_brands_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_epp_brands: {
        Row: {
          created_at: string | null
          id: string
          oem_brand_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          oem_brand_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          oem_brand_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_epp_brands_oem_brand_id_fkey"
            columns: ["oem_brand_id"]
            isOneToOne: false
            referencedRelation: "oem_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_epp_brands_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_oem_brands: {
        Row: {
          created_at: string | null
          id: string
          oem_brand_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          oem_brand_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          oem_brand_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_oem_brands_oem_brand_id_fkey"
            columns: ["oem_brand_id"]
            isOneToOne: false
            referencedRelation: "oem_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_oem_brands_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          city: string | null
          comments: string | null
          created_at: string | null
          created_by: string | null
          email_address: string | null
          epp: boolean | null
          fax_no: string | null
          hr_labour_rate: number | null
          id: string
          latitude: number | null
          longitude: number | null
          oem: boolean | null
          payment_type_id: string | null
          phone_no: string | null
          poc: string | null
          preference: string | null
          state: string | null
          updated_at: string | null
          updated_by: string | null
          vendor_level: string | null
          vendor_name: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          email_address?: string | null
          epp?: boolean | null
          fax_no?: string | null
          hr_labour_rate?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          oem?: boolean | null
          payment_type_id?: string | null
          phone_no?: string | null
          poc?: string | null
          preference?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_level?: string | null
          vendor_name: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          email_address?: string | null
          epp?: boolean | null
          fax_no?: string | null
          hr_labour_rate?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          oem?: boolean | null
          payment_type_id?: string | null
          phone_no?: string | null
          poc?: string | null
          preference?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_level?: string | null
          vendor_name?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_payment_type_id_fkey"
            columns: ["payment_type_id"]
            isOneToOne: false
            referencedRelation: "payment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      zipcode_lists: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          zipcode: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          zipcode: string
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          zipcode?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_full_name: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "viewer"
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
      app_role: ["admin", "manager", "user", "viewer"],
    },
  },
} as const
