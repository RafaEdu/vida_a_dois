// AUTO-GERADO pelo Supabase CLI — não editar manualmente.
//
// Fonte de verdade: as migrations em supabase/migrations/.
// Regenerar:
//   npm run gen:types          (banco local do Supabase)
//   npm run gen:types:linked   (projeto remoto linkado)
//
// Tipos de aplicação devem ficar em src/types/domain.ts.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      couples: {
        Row: {
          created_at: string;
          ended_at: string | null;
          ended_by: string | null;
          id: string;
          last_closed_month: string | null;
          linked_at: string | null;
          monthly_budget: number;
          shared_balance: number;
          split_ratio_a: number;
          split_ratio_b: number;
          status: string;
          user_a: string;
          user_b: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          last_closed_month?: string | null;
          linked_at?: string | null;
          monthly_budget?: number;
          shared_balance?: number;
          split_ratio_a?: number;
          split_ratio_b?: number;
          status?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          last_closed_month?: string | null;
          linked_at?: string | null;
          monthly_budget?: number;
          shared_balance?: number;
          split_ratio_a?: number;
          split_ratio_b?: number;
          status?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [
          {
            foreignKeyName: "couples_user_a_fkey";
            columns: ["user_a"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_user_b_fkey";
            columns: ["user_b"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_ended_by_fkey";
            columns: ["ended_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          couple_id: string;
          created_at: string;
          created_by: string;
          description: string;
          due_date: string | null;
          id: string;
          is_recurring: boolean;
          paid: boolean;
          paid_at: string | null;
          paid_by: string | null;
          recurrence_series_id: string | null;
        };
        Insert: {
          amount: number;
          category: string;
          couple_id: string;
          created_at?: string;
          created_by: string;
          description: string;
          due_date?: string | null;
          id?: string;
          is_recurring?: boolean;
          paid?: boolean;
          paid_at?: string | null;
          paid_by?: string | null;
          recurrence_series_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          couple_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          is_recurring?: boolean;
          paid?: boolean;
          paid_at?: string | null;
          paid_by?: string | null;
          recurrence_series_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      incomes: {
        Row: {
          amount: number;
          couple_id: string;
          created_at: string;
          description: string;
          id: string;
          is_extra: boolean;
          received_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          couple_id: string;
          created_at?: string;
          description: string;
          id?: string;
          is_extra?: boolean;
          received_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          couple_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_extra?: boolean;
          received_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incomes_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incomes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          created_at: string;
          full_name: string;
          id: string;
          invite_code: string | null;
          monthly_income: number | null;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          invite_code?: string | null;
          monthly_income?: number | null;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          invite_code?: string | null;
          monthly_income?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      partner_profiles: {
        Row: {
          couple_id: string;
          full_name: string;
          id: string;
          monthly_income: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_invitation: {
        Args: {
          p_couple_id: string;
        };
        Returns: Json;
      };
      close_month: {
        Args: {
          p_couple_id: string;
        };
        Returns: Json;
      };
      link_partner: {
        Args: {
          p_invite_code: string;
        };
        Returns: Json;
      };
      lookup_partner: {
        Args: {
          p_invite_code: string;
        };
        Returns: {
          full_name: string;
        }[];
      };
      mark_expense_paid: {
        Args: {
          p_expense_id: string;
        };
        Returns: Json;
      };
      reject_invitation: {
        Args: {
          p_couple_id: string;
        };
        Returns: Json;
      };
      rotate_couple_invite_codes: {
        Args: {
          p_couple_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
