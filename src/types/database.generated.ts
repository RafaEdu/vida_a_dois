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
      category_budgets: {
        Row: {
          category: string;
          couple_id: string;
          created_at: string;
          id: string;
          monthly_amount: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          couple_id: string;
          created_at?: string;
          id?: string;
          monthly_amount: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          couple_id?: string;
          created_at?: string;
          id?: string;
          monthly_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_budgets_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      couple_activity: {
        Row: {
          actor_id: string | null;
          couple_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          couple_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          couple_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "couple_activity_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couple_activity_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
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
          split_mode: string;
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
          split_mode?: string;
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
          split_mode?: string;
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
      expense_recurrence_series: {
        Row: {
          active: boolean;
          amount: number;
          category: string;
          couple_id: string;
          created_at: string;
          created_by: string;
          description: string;
          frequency: string;
          id: string;
          next_due_date: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          amount: number;
          category: string;
          couple_id: string;
          created_at?: string;
          created_by: string;
          description: string;
          frequency?: string;
          id?: string;
          next_due_date?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          amount?: number;
          category?: string;
          couple_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string;
          frequency?: string;
          id?: string;
          next_due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_recurrence_series_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_recurrence_series_created_by_fkey";
            columns: ["created_by"];
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
      financial_goals: {
        Row: {
          couple_id: string;
          created_at: string;
          created_by: string;
          id: string;
          status: string;
          target_amount: number;
          target_date: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          couple_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          status?: string;
          target_amount: number;
          target_date?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          couple_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_goals_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_goals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      goal_contributions: {
        Row: {
          amount: number;
          contributed_at: string;
          goal_id: string;
          id: string;
          note: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          contributed_at?: string;
          goal_id: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          contributed_at?: string;
          goal_id?: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "financial_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_contributions_user_id_fkey";
            columns: ["user_id"];
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
      monthly_closings: {
        Row: {
          closed_at: string;
          closed_by: string | null;
          couple_id: string;
          id: string;
          month_delta: number;
          monthly_budget: number;
          shared_balance_after: number;
          shared_balance_before: number;
          split_ratio_a: number;
          split_ratio_b: number;
          total_expenses: number;
          total_incomes: number;
          year_month: string;
        };
        Insert: {
          closed_at?: string;
          closed_by?: string | null;
          couple_id: string;
          id?: string;
          month_delta?: number;
          monthly_budget?: number;
          shared_balance_after?: number;
          shared_balance_before?: number;
          split_ratio_a?: number;
          split_ratio_b?: number;
          total_expenses?: number;
          total_incomes?: number;
          year_month: string;
        };
        Update: {
          closed_at?: string;
          closed_by?: string | null;
          couple_id?: string;
          id?: string;
          month_delta?: number;
          monthly_budget?: number;
          shared_balance_after?: number;
          shared_balance_before?: number;
          split_ratio_a?: number;
          split_ratio_b?: number;
          total_expenses?: number;
          total_incomes?: number;
          year_month?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_closings_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "monthly_closings_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          closing_reminder_enabled: boolean;
          created_at: string;
          due_soon_enabled: boolean;
          invite_updates_enabled: boolean;
          last_activity_seen_at: string | null;
          notifications_enabled: boolean;
          pending_expenses_enabled: boolean;
          reminder_time: string;
          shared_activity_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          closing_reminder_enabled?: boolean;
          created_at?: string;
          due_soon_enabled?: boolean;
          invite_updates_enabled?: boolean;
          last_activity_seen_at?: string | null;
          notifications_enabled?: boolean;
          pending_expenses_enabled?: boolean;
          reminder_time?: string;
          shared_activity_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          closing_reminder_enabled?: boolean;
          created_at?: string;
          due_soon_enabled?: boolean;
          invite_updates_enabled?: boolean;
          last_activity_seen_at?: string | null;
          notifications_enabled?: boolean;
          pending_expenses_enabled?: boolean;
          reminder_time?: string;
          shared_activity_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          birth_date: string | null;
          created_at: string;
          full_name: string;
          id: string;
          invite_code: string | null;
          monthly_income: number | null;
        };
        Insert: {
          avatar_path?: string | null;
          birth_date?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          invite_code?: string | null;
          monthly_income?: number | null;
        };
        Update: {
          avatar_path?: string | null;
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
          avatar_path: string | null;
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
      end_recurrence_series: {
        Args: {
          p_series_id: string;
        };
        Returns: Json;
      };
      end_relationship: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_active_partner: {
        Args: {
          p_owner: string;
        };
        Returns: boolean;
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
          p_payer_id: string;
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
      set_recurrence_series_active: {
        Args: {
          p_active: boolean;
          p_series_id: string;
        };
        Returns: Json;
      };
      update_recurrence_series: {
        Args: {
          p_amount: number;
          p_category: string;
          p_description: string;
          p_series_id: string;
        };
        Returns: Json;
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
