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
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          contract_terms: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          service_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          contract_terms?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          service_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          contract_terms?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          service_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          site_name: string
          staff_id: string
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          site_name: string
          staff_id: string
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          site_name?: string
          staff_id?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          bank_details: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          employment_type: string
          full_name: string
          hourly_rate: number | null
          id: string
          licences: string | null
          phone: string | null
          role: string
          site_assigned: string | null
          status: string
          tax_number: string | null
          updated_at: string
          user_id: string
          visa_expiry: string | null
        }
        Insert: {
          address?: string | null
          bank_details?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          employment_type?: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          licences?: string | null
          phone?: string | null
          role?: string
          site_assigned?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          user_id: string
          visa_expiry?: string | null
        }
        Update: {
          address?: string | null
          bank_details?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          employment_type?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          licences?: string | null
          phone?: string | null
          role?: string
          site_assigned?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          user_id?: string
          visa_expiry?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          shift_id: string | null
          staff_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          staff_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      pay_runs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          total_gross: number
          total_net: number
          total_super: number
          total_tax: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          total_gross?: number
          total_net?: number
          total_super?: number
          total_tax?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_gross?: number
          total_net?: number
          total_super?: number
          total_tax?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payslips: {
        Row: {
          created_at: string
          gross_pay: number
          hours_worked: number
          hourly_rate: number
          id: string
          net_pay: number
          overtime_hours: number
          overtime_rate: number
          pay_run_id: string
          staff_id: string
          status: string
          super_amount: number
          tax_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gross_pay?: number
          hours_worked?: number
          hourly_rate?: number
          id?: string
          net_pay?: number
          overtime_hours?: number
          overtime_rate?: number
          pay_run_id: string
          staff_id: string
          status?: string
          super_amount?: number
          tax_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gross_pay?: number
          hours_worked?: number
          hourly_rate?: number
          id?: string
          net_pay?: number
          overtime_hours?: number
          overtime_rate?: number
          pay_run_id?: string
          staff_id?: string
          status?: string
          super_amount?: number
          tax_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "pay_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
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
    : never = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? DefaultSchemaTableNameOrOptions
    : never,
  DefaultSchemaTableName extends TableName = TableName
> = DefaultSchema["Tables"] & DefaultSchema["Views"] extends infer DefaultSchemaTables
  ? DefaultSchemaTables[DefaultSchemaTableName] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchemaTableNameOrOptions
    : never = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchemaTableNameOrOptions
    : never,
  DefaultSchemaTableName extends TableName = TableName
> = DefaultSchema["Tables"] extends infer DefaultSchemaTables
  ? DefaultSchemaTables[DefaultSchemaTableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchemaTableNameOrOptions
    : never = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchemaTableNameOrOptions
    : never,
  DefaultSchemaTableName extends TableName = TableName
> = DefaultSchema["Tables"] extends infer DefaultSchemaTables
  ? DefaultSchemaTables[DefaultSchemaTableName] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchemaEnumNameOrOptions
    : never = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchemaEnumNameOrOptions
    : never,
  DefaultSchemaEnumName extends EnumName = EnumName
> = DefaultSchema["Enums"] extends infer DefaultSchemaEnums
  ? DefaultSchemaEnums[DefaultSchemaEnumName] extends infer EnumType
    ? EnumType
    : never
  : never
