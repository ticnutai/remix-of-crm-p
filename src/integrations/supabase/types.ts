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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vat_rate?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_id: string
          created_at: string | null
          data: Json
          id: string
          name: string
          size: number
          updated_at: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          backup_id: string
          created_at?: string | null
          data: Json
          id?: string
          name: string
          size: number
          updated_at?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          backup_id?: string
          created_at?: string | null
          data?: Json
          id?: string
          name?: string
          size?: number
          updated_at?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      bank_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          label_he: string
          name: string
          sort_order: number | null
          transaction_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label_he: string
          name: string
          sort_order?: number | null
          transaction_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label_he?: string
          name?: string
          sort_order?: number | null
          transaction_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_number: string | null
          balance: number | null
          bank_name: string | null
          category: string | null
          created_at: string
          credit: number | null
          debit: number | null
          description: string
          id: string
          is_reconciled: boolean | null
          notes: string | null
          payee: string | null
          reference_number: string | null
          source_file: string | null
          transaction_date: string
          updated_at: string
          user_id: string
          value_date: string | null
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          bank_name?: string | null
          category?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description: string
          id?: string
          is_reconciled?: boolean | null
          notes?: string | null
          payee?: string | null
          reference_number?: string | null
          source_file?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
          value_date?: string | null
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          bank_name?: string | null
          category?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string
          id?: string
          is_reconciled?: boolean | null
          notes?: string | null
          payee?: string | null
          reference_number?: string | null
          source_file?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
          value_date?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          planned_amount: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          client_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string
          is_completed: boolean | null
          location: string | null
          project_id: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_date: string | null
          call_type: string | null
          client_id: string | null
          created_at: string | null
          duration_seconds: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          notes: string | null
          phone_number: string
        }
        Insert: {
          call_date?: string | null
          call_type?: string | null
          client_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          phone_number: string
        }
        Update: {
          call_date?: string | null
          call_type?: string | null
          client_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      client_additional_payments: {
        Row: {
          amount: number
          amount_with_vat: number | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_amount: number | null
          paid_by: string | null
          paid_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_type: string
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          amount?: number
          amount_with_vat?: number | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          amount_with_vat?: number | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      client_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      client_consultants: {
        Row: {
          client_id: string
          consultant_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          role: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id: string
          consultant_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string
          consultant_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_consultants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          mobile: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_custom_tabs: {
        Row: {
          allow_files: boolean | null
          client_id: string | null
          column_order: Json | null
          created_at: string
          created_by: string
          data_type_id: string
          display_mode: string | null
          display_name: string
          folder_name: string | null
          folder_order: number | null
          grid_layout: boolean | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          show_analysis: boolean | null
          show_summary: boolean | null
          sort_order: number | null
          tab_type: string | null
          table_columns: Json | null
          updated_at: string
        }
        Insert: {
          allow_files?: boolean | null
          client_id?: string | null
          column_order?: Json | null
          created_at?: string
          created_by: string
          data_type_id: string
          display_mode?: string | null
          display_name: string
          folder_name?: string | null
          folder_order?: number | null
          grid_layout?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          show_analysis?: boolean | null
          show_summary?: boolean | null
          sort_order?: number | null
          tab_type?: string | null
          table_columns?: Json | null
          updated_at?: string
        }
        Update: {
          allow_files?: boolean | null
          client_id?: string | null
          column_order?: Json | null
          created_at?: string
          created_by?: string
          data_type_id?: string
          display_mode?: string | null
          display_name?: string
          folder_name?: string | null
          folder_order?: number | null
          grid_layout?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          show_analysis?: boolean | null
          show_summary?: boolean | null
          sort_order?: number | null
          tab_type?: string | null
          table_columns?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_tabs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_tabs_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
        ]
      }
      client_deadlines: {
        Row: {
          category: string
          client_id: string
          completed_at: string | null
          created_at: string | null
          deadline_days: number
          description: string | null
          id: string
          linked_stage_id: string | null
          notes: string | null
          reminder_days: number[] | null
          start_date: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          deadline_days: number
          description?: string | null
          id?: string
          linked_stage_id?: string | null
          notes?: string | null
          reminder_days?: number[] | null
          start_date: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          deadline_days?: number
          description?: string | null
          id?: string
          linked_stage_id?: string | null
          notes?: string | null
          reminder_days?: number[] | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deadlines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
          uploader_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
          uploader_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
          uploader_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_folder_stages: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          sort_order: number | null
          stage_icon: string | null
          stage_name: string
          started_at: string | null
          target_working_days: number | null
          timer_display_style: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          sort_order?: number | null
          stage_icon?: string | null
          stage_name: string
          started_at?: string | null
          target_working_days?: number | null
          timer_display_style?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          sort_order?: number | null
          stage_icon?: string | null
          stage_name?: string
          started_at?: string | null
          target_working_days?: number | null
          timer_display_style?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_folder_stages_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "client_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_folder_tasks: {
        Row: {
          background_color: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_bold: boolean | null
          sort_order: number | null
          stage_id: string
          started_at: string | null
          target_working_days: number | null
          text_color: string | null
          timer_display_style: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_bold?: boolean | null
          sort_order?: number | null
          stage_id: string
          started_at?: string | null
          target_working_days?: number | null
          text_color?: string | null
          timer_display_style?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_bold?: boolean | null
          sort_order?: number | null
          stage_id?: string
          started_at?: string | null
          target_working_days?: number | null
          text_color?: string | null
          timer_display_style?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_folder_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "client_folder_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_folders: {
        Row: {
          client_id: string
          created_at: string | null
          folder_icon: string | null
          folder_name: string
          id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          folder_icon?: string | null
          folder_name: string
          id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          folder_icon?: string | null
          folder_name?: string
          id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_stages: {
        Row: {
          amount: number
          amount_with_vat: number | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_amount: number | null
          paid_by: string | null
          paid_date: string | null
          payment_method: string | null
          payment_reference: string | null
          stage_name: string
          stage_number: number
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          amount?: number
          amount_with_vat?: number | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          stage_name: string
          stage_number?: number
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          amount_with_vat?: number | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          stage_name?: string
          stage_number?: number
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      client_portal_tokens: {
        Row: {
          client_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          permissions: Json | null
          token: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          permissions?: Json | null
          token: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          permissions?: Json | null
          token?: string
        }
        Relationships: []
      }
      client_sources: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_stage_tasks: {
        Row: {
          background_color: string | null
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          is_bold: boolean | null
          sort_order: number
          stage_id: string
          started_at: string | null
          target_working_days: number | null
          text_color: string | null
          timer_display_style: number | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_bold?: boolean | null
          sort_order?: number
          stage_id: string
          started_at?: string | null
          target_working_days?: number | null
          text_color?: string | null
          timer_display_style?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_bold?: boolean | null
          sort_order?: number
          stage_id?: string
          started_at?: string | null
          target_working_days?: number | null
          text_color?: string | null
          timer_display_style?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_stage_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stages: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          data_type_id: string | null
          folder_id: string | null
          id: string
          is_completed: boolean | null
          sort_order: number
          stage_icon: string | null
          stage_id: string
          stage_name: string
          started_at: string | null
          target_working_days: number | null
          timer_display_style: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          data_type_id?: string | null
          folder_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number
          stage_icon?: string | null
          stage_id: string
          stage_name: string
          started_at?: string | null
          target_working_days?: number | null
          timer_display_style?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          data_type_id?: string | null
          folder_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number
          stage_icon?: string | null
          stage_id?: string
          stage_name?: string
          started_at?: string | null
          target_working_days?: number | null
          timer_display_style?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_stages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stages_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stages_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "client_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tab_columns: {
        Row: {
          allow_multiple: boolean | null
          column_group: string | null
          column_key: string
          column_name: string
          column_options: Json | null
          column_order: number | null
          column_type: string
          column_width: number | null
          created_at: string | null
          created_by: string | null
          data_type_id: string | null
          default_value: string | null
          formula: string | null
          id: string
          is_required: boolean | null
          max_rating: number | null
          tab_id: string
          updated_at: string | null
        }
        Insert: {
          allow_multiple?: boolean | null
          column_group?: string | null
          column_key: string
          column_name: string
          column_options?: Json | null
          column_order?: number | null
          column_type?: string
          column_width?: number | null
          created_at?: string | null
          created_by?: string | null
          data_type_id?: string | null
          default_value?: string | null
          formula?: string | null
          id?: string
          is_required?: boolean | null
          max_rating?: number | null
          tab_id: string
          updated_at?: string | null
        }
        Update: {
          allow_multiple?: boolean | null
          column_group?: string | null
          column_key?: string
          column_name?: string
          column_options?: Json | null
          column_order?: number | null
          column_type?: string
          column_width?: number | null
          created_at?: string | null
          created_by?: string | null
          data_type_id?: string | null
          default_value?: string | null
          formula?: string | null
          id?: string
          is_required?: boolean | null
          max_rating?: number | null
          tab_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_tab_columns_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tab_columns_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "client_custom_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tab_data: {
        Row: {
          analysis: string | null
          client_id: string
          created_at: string
          created_by: string
          data: Json
          field_metadata: Json | null
          id: string
          notes: string | null
          summary: string | null
          tab_id: string
          updated_at: string
        }
        Insert: {
          analysis?: string | null
          client_id: string
          created_at?: string
          created_by: string
          data?: Json
          field_metadata?: Json | null
          id?: string
          notes?: string | null
          summary?: string | null
          tab_id: string
          updated_at?: string
        }
        Update: {
          analysis?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          data?: Json
          field_metadata?: Json | null
          id?: string
          notes?: string | null
          summary?: string | null
          tab_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tab_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tab_data_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "client_custom_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tab_files: {
        Row: {
          created_at: string
          created_by: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          tab_data_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          tab_data_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          tab_data_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tab_files_tab_data_id_fkey"
            columns: ["tab_data_id"]
            isOneToOne: false
            referencedRelation: "client_tab_data"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          aguda_address: string | null
          aguda_email: string | null
          budget_range: string | null
          category_id: string | null
          classification: string | null
          company: string | null
          created_at: string
          created_by: string | null
          custom_data: Json | null
          email: string | null
          field_metadata: Json | null
          gush: string | null
          helka: string | null
          id: string
          id_number: string | null
          industry: string | null
          is_sample: boolean | null
          linkedin: string | null
          migrash: string | null
          moshav: string | null
          name: string
          name_clean: string | null
          notes: string | null
          original_id: string | null
          phone: string | null
          phone_secondary: string | null
          position: string | null
          preferred_contact: string | null
          source: string | null
          stage: string | null
          status: string | null
          street: string | null
          taba: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          vaad_moshav_address: string | null
          vaad_moshav_email: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          aguda_address?: string | null
          aguda_email?: string | null
          budget_range?: string | null
          category_id?: string | null
          classification?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          email?: string | null
          field_metadata?: Json | null
          gush?: string | null
          helka?: string | null
          id?: string
          id_number?: string | null
          industry?: string | null
          is_sample?: boolean | null
          linkedin?: string | null
          migrash?: string | null
          moshav?: string | null
          name: string
          name_clean?: string | null
          notes?: string | null
          original_id?: string | null
          phone?: string | null
          phone_secondary?: string | null
          position?: string | null
          preferred_contact?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          street?: string | null
          taba?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          vaad_moshav_address?: string | null
          vaad_moshav_email?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          aguda_address?: string | null
          aguda_email?: string | null
          budget_range?: string | null
          category_id?: string | null
          classification?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          email?: string | null
          field_metadata?: Json | null
          gush?: string | null
          helka?: string | null
          id?: string
          id_number?: string | null
          industry?: string | null
          is_sample?: boolean | null
          linkedin?: string | null
          migrash?: string | null
          moshav?: string | null
          name?: string
          name_clean?: string | null
          notes?: string | null
          original_id?: string | null
          phone?: string | null
          phone_secondary?: string | null
          position?: string | null
          preferred_contact?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          street?: string | null
          taba?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          vaad_moshav_address?: string | null
          vaad_moshav_email?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "client_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          id_number: string | null
          license_number: string | null
          name: string
          notes: string | null
          phone: string | null
          profession: string
          specialty: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          license_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          profession?: string
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          license_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          profession?: string
          specialty?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contract_amendments: {
        Row: {
          amendment_number: number
          approved_by_client: boolean | null
          approved_date: string | null
          change_type: string | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          new_value: string | null
          notes: string | null
          previous_value: string | null
          value_change_amount: number | null
        }
        Insert: {
          amendment_number: number
          approved_by_client?: boolean | null
          approved_date?: string | null
          change_type?: string | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          new_value?: string | null
          notes?: string | null
          previous_value?: string | null
          value_change_amount?: number | null
        }
        Update: {
          amendment_number?: number
          approved_by_client?: boolean | null
          approved_date?: string | null
          change_type?: string | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          new_value?: string | null
          notes?: string | null
          previous_value?: string | null
          value_change_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          document_name: string
          document_type: string | null
          document_url: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          document_name: string
          document_type?: string | null
          document_url: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          document_name?: string
          document_type?: string | null
          document_url?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          css_styles: string | null
          default_duration_days: number | null
          default_payment_schedule: Json | null
          default_payment_terms: string | null
          default_special_clauses: string | null
          default_terms_and_conditions: string | null
          description: string | null
          footer_html: string | null
          header_html: string | null
          html_content: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          default_duration_days?: number | null
          default_payment_schedule?: Json | null
          default_payment_terms?: string | null
          default_special_clauses?: string | null
          default_terms_and_conditions?: string | null
          description?: string | null
          footer_html?: string | null
          header_html?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          default_duration_days?: number | null
          default_payment_schedule?: Json | null
          default_payment_terms?: string | null
          default_special_clauses?: string | null
          default_terms_and_conditions?: string | null
          description?: string | null
          footer_html?: string | null
          header_html?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          advance_payment_amount: number | null
          advance_payment_required: boolean | null
          advance_payment_status: string | null
          client_id: string
          contract_number: string
          contract_pdf_url: string | null
          contract_type: string | null
          contract_value: number
          created_at: string | null
          created_by: string
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_terms: string | null
          project_id: string | null
          quote_id: string | null
          signature_data: string | null
          signed_by_client: string | null
          signed_by_company: string | null
          signed_contract_pdf_url: string | null
          signed_date: string
          special_clauses: string | null
          start_date: string
          status: string | null
          tags: string[] | null
          template_id: string | null
          terminated_at: string | null
          termination_reason: string | null
          terms_and_conditions: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          advance_payment_amount?: number | null
          advance_payment_required?: boolean | null
          advance_payment_status?: string | null
          client_id: string
          contract_number: string
          contract_pdf_url?: string | null
          contract_type?: string | null
          contract_value: number
          created_at?: string | null
          created_by: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          project_id?: string | null
          quote_id?: string | null
          signature_data?: string | null
          signed_by_client?: string | null
          signed_by_company?: string | null
          signed_contract_pdf_url?: string | null
          signed_date: string
          special_clauses?: string | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          advance_payment_amount?: number | null
          advance_payment_required?: boolean | null
          advance_payment_status?: string | null
          client_id?: string
          contract_number?: string
          contract_pdf_url?: string | null
          contract_type?: string | null
          contract_value?: number
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          project_id?: string | null
          quote_id?: string | null
          signature_data?: string | null
          signed_by_client?: string | null
          signed_by_company?: string | null
          signed_contract_pdf_url?: string | null
          signed_date?: string
          special_clauses?: string | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_reports: {
        Row: {
          chart_type: string | null
          config: Json | null
          created_at: string | null
          data_source: string | null
          description: string | null
          filters: Json | null
          id: string
          is_favorite: boolean | null
          name: string
          report_type: string | null
          updated_at: string | null
        }
        Insert: {
          chart_type?: string | null
          config?: Json | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean | null
          name: string
          report_type?: string | null
          updated_at?: string | null
        }
        Update: {
          chart_type?: string | null
          config?: Json | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          report_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_spreadsheets: {
        Row: {
          client_id: string | null
          columns: Json | null
          created_at: string | null
          created_by: string | null
          custom_types: Json | null
          description: string | null
          filters: Json | null
          google_sheet_id: string | null
          google_sheet_name: string | null
          id: string
          name: string
          rows: Json | null
          sync_config: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          columns?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_types?: Json | null
          description?: string | null
          filters?: Json | null
          google_sheet_id?: string | null
          google_sheet_name?: string | null
          id?: string
          name: string
          rows?: Json | null
          sync_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          columns?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_types?: Json | null
          description?: string | null
          filters?: Json | null
          google_sheet_id?: string | null
          google_sheet_name?: string | null
          id?: string
          name?: string
          rows?: Json | null
          sync_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_spreadsheets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_data: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          field_metadata: Json | null
          id: string
          linked_client_id: string | null
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: Json
          field_metadata?: Json | null
          id?: string
          linked_client_id?: string | null
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          field_metadata?: Json | null
          id?: string
          linked_client_id?: string | null
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_data_linked_client_id_fkey"
            columns: ["linked_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_table_data_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_table_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          table_id: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          table_id: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_table_permissions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "custom_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tables: {
        Row: {
          columns: Json
          created_at: string
          created_by: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          created_by: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          columns?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_types: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          display_field: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          options: Json | null
          source_table: string | null
          source_type: string
          type_mode: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          display_field?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          options?: Json | null
          source_table?: string | null
          source_type?: string
          type_mode?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          display_field?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          options?: Json | null
          source_table?: string | null
          source_type?: string
          type_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deadline_templates: {
        Row: {
          category: string
          created_at: string | null
          deadline_days: number
          description: string | null
          id: string
          is_system: boolean | null
          reminder_days: number[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          deadline_days: number
          description?: string | null
          id?: string
          is_system?: boolean | null
          reminder_days?: number[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          deadline_days?: number
          description?: string | null
          id?: string
          is_system?: boolean | null
          reminder_days?: number[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          is_archived: boolean | null
          name: string
          project_id: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          project_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      email_auto_rules: {
        Row: {
          client_id: string | null
          created_at: string | null
          folder_id: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_type: string
          rule_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          folder_id: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_type: string
          rule_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          folder_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_type?: string
          rule_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_auto_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_auto_rules_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email: string
          email_log_id: string | null
          id: string
          sent_at: string | null
          status: string | null
          variables: Json | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email: string
          email_log_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          variables?: Json | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email?: string
          email_log_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          failed_count: number | null
          id: string
          name: string
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          failed_count?: number | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          failed_count?: number | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          email_log_id: string | null
          id: string
          ip_address: string | null
          location: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folder_items: {
        Row: {
          added_at: string | null
          client_id: string | null
          email_date: string | null
          email_from: string | null
          email_id: string
          email_snippet: string | null
          email_subject: string | null
          folder_id: string
          id: string
          is_important: boolean | null
          is_starred: boolean | null
          notes: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          client_id?: string | null
          email_date?: string | null
          email_from?: string | null
          email_id: string
          email_snippet?: string | null
          email_subject?: string | null
          folder_id: string
          id?: string
          is_important?: boolean | null
          is_starred?: boolean | null
          notes?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          client_id?: string | null
          email_date?: string | null
          email_from?: string | null
          email_id?: string
          email_snippet?: string | null
          email_subject?: string | null
          folder_id?: string
          id?: string
          is_important?: boolean | null
          is_starred?: boolean | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_folder_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folders: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          click_count: number | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          first_clicked_at: string | null
          from_email: string
          html_content: string | null
          id: string
          metadata: Json | null
          open_count: number | null
          opened_at: string | null
          reminder_id: string | null
          resend_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          bounced_at?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          first_clicked_at?: string | null
          from_email: string
          html_content?: string | null
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          reminder_id?: string | null
          resend_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          bounced_at?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          first_clicked_at?: string | null
          from_email?: string
          html_content?: string | null
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          reminder_id?: string | null
          resend_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body_html: string | null
          body_preview: string | null
          cc_emails: string[] | null
          client_id: string | null
          created_at: string
          from_email: string | null
          from_name: string | null
          gmail_message_id: string
          google_account_id: string | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          received_at: string | null
          subject: string | null
          thread_id: string | null
          to_emails: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_preview?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          gmail_message_id: string
          google_account_id?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_preview?: string | null
          cc_emails?: string[] | null
          client_id?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          gmail_message_id?: string
          google_account_id?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_google_account_id_fkey"
            columns: ["google_account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_metadata: {
        Row: {
          created_at: string | null
          email_id: string
          id: string
          is_flagged: boolean | null
          is_pinned: boolean | null
          labels: string[] | null
          linked_client_id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_id: string
          id?: string
          is_flagged?: boolean | null
          is_pinned?: boolean | null
          labels?: string[] | null
          linked_client_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_id?: string
          id?: string
          is_flagged?: boolean | null
          is_pinned?: boolean | null
          labels?: string[] | null
          linked_client_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_metadata_linked_client_id_fkey"
            columns: ["linked_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          html_content: string
          id: string
          max_retries: number | null
          metadata: Json | null
          priority: number | null
          processed_at: string | null
          reminder_id: string | null
          retry_count: number | null
          scheduled_at: string
          send_after: string | null
          status: string | null
          subject: string
          template_id: string | null
          timezone: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          html_content: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          processed_at?: string | null
          reminder_id?: string | null
          retry_count?: number | null
          scheduled_at: string
          send_after?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          timezone?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          html_content?: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          processed_at?: string | null
          reminder_id?: string | null
          retry_count?: number | null
          scheduled_at?: string
          send_after?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          timezone?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rate_limit_config: {
        Row: {
          created_at: string | null
          daily_limit: number
          hourly_limit: number
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit: number
          hourly_limit: number
          id?: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit?: number
          hourly_limit?: number
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          created_at: string | null
          email_count: number | null
          id: string
          limit_type: string
          period_end: string
          period_start: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_count?: number | null
          id?: string
          limit_type: string
          period_end: string
          period_start: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_count?: number | null
          id?: string
          limit_type?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_signatures: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_company_wide: boolean | null
          is_default: boolean | null
          name: string
          text_content: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_company_wide?: boolean | null
          is_default?: boolean | null
          name: string
          text_content?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_company_wide?: boolean | null
          is_default?: boolean | null
          name?: string
          text_content?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          is_default: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_default?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          email: string
          id: string
          ip_address: string | null
          reason: string | null
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          email: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          profile_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          has_vat: boolean
          id: string
          is_recurring: boolean
          notes: string | null
          receipt_number: string | null
          recurring_day: number | null
          supplier_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          expense_date?: string
          has_vat?: boolean
          id?: string
          is_recurring?: boolean
          notes?: string | null
          receipt_number?: string | null
          recurring_day?: number | null
          supplier_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          has_vat?: boolean
          id?: string
          is_recurring?: boolean
          notes?: string | null
          receipt_number?: string | null
          recurring_day?: number | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          name_he: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_he: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_he?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          file_count: number | null
          icon: string | null
          id: string
          is_shared: boolean | null
          name: string
          parent_id: string | null
          path: string
          total_size: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          file_count?: number | null
          icon?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          parent_id?: string | null
          path: string
          total_size?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          file_count?: number | null
          icon?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          parent_id?: string | null
          path?: string
          total_size?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      file_metadata: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          download_count: number | null
          extension: string | null
          folder_id: string | null
          id: string
          is_shared: boolean | null
          is_starred: boolean | null
          last_accessed: string | null
          metadata: Json | null
          mime_type: string | null
          name: string
          path: string
          size: number
          tags: string[] | null
          thumbnail: string | null
          type: string
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          download_count?: number | null
          extension?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          is_starred?: boolean | null
          last_accessed?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          path: string
          size?: number
          tags?: string[] | null
          thumbnail?: string | null
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          download_count?: number | null
          extension?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          is_starred?: boolean | null
          last_accessed?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          path?: string
          size?: number
          tags?: string[] | null
          thumbnail?: string | null
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      file_public_links: {
        Row: {
          access_count: number | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          file_id: string
          id: string
          is_active: boolean | null
          link_token: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_id: string
          id?: string
          is_active?: boolean | null
          link_token?: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_id?: string
          id?: string
          is_active?: boolean | null
          link_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_public_links_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      file_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          file_id: string
          id: string
          permissions: string | null
          shared_by: string | null
          shared_with: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          file_id: string
          id?: string
          permissions?: string | null
          shared_by?: string | null
          shared_with: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          file_id?: string
          id?: string
          permissions?: string | null
          shared_by?: string | null
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          changes: string | null
          created_at: string | null
          file_id: string
          id: string
          path: string
          size: number
          uploaded_by: string | null
          version: number
        }
        Insert: {
          changes?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          path: string
          size: number
          uploaded_by?: string | null
          version: number
        }
        Update: {
          changes?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          path?: string
          size?: number
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          folder_id: string | null
          google_drive_id: string | null
          id: string
          is_archived: boolean | null
          is_starred: boolean | null
          metadata: Json | null
          mime_type: string | null
          project_id: string | null
          source: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder_id?: string | null
          google_drive_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          source?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder_id?: string | null
          google_drive_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          source?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "file_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_alerts: {
        Row: {
          channel: string
          created_at: string
          id: string
          invoice_id: string | null
          message: string | null
          sent_at: string | null
          status: string
          triggered_at: string
          type: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string
          triggered_at?: string
          type: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string
          triggered_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_alerts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      google_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_accounts: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_direction: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_direction?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_direction?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_settings: {
        Row: {
          auto_sync_enabled: boolean | null
          auto_sync_interval: number | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          selected_calendars: Json | null
          sync_direction: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          auto_sync_interval?: number | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          selected_calendars?: Json | null
          sync_direction?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          auto_sync_interval?: number | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          selected_calendars?: Json | null
          sync_direction?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_synced_events: {
        Row: {
          account_id: string
          created_at: string
          google_event_id: string
          id: string
          last_synced_at: string
          meeting_id: string | null
          sync_direction: string
        }
        Insert: {
          account_id: string
          created_at?: string
          google_event_id: string
          id?: string
          last_synced_at?: string
          meeting_id?: string | null
          sync_direction: string
        }
        Update: {
          account_id?: string
          created_at?: string
          google_event_id?: string
          id?: string
          last_synced_at?: string
          meeting_id?: string | null
          sync_direction?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_synced_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "google_calendar_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_synced_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      google_contacts_sync: {
        Row: {
          client_id: string | null
          created_at: string
          google_account_id: string | null
          google_contact_id: string
          id: string
          last_synced_at: string | null
          sync_status: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          google_account_id?: string | null
          google_contact_id: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          google_account_id?: string | null
          google_contact_id?: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_contacts_sync_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_contacts_sync_google_account_id_fkey"
            columns: ["google_account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      google_drive_files: {
        Row: {
          client_id: string | null
          created_at: string
          drive_file_id: string
          file_name: string
          file_size: number | null
          google_account_id: string | null
          id: string
          is_synced: boolean | null
          last_synced_at: string | null
          mime_type: string | null
          parent_folder_id: string | null
          project_id: string | null
          thumbnail_link: string | null
          updated_at: string
          user_id: string
          web_view_link: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          drive_file_id: string
          file_name: string
          file_size?: number | null
          google_account_id?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          mime_type?: string | null
          parent_folder_id?: string | null
          project_id?: string | null
          thumbnail_link?: string | null
          updated_at?: string
          user_id: string
          web_view_link?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          drive_file_id?: string
          file_name?: string
          file_size?: number | null
          google_account_id?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          mime_type?: string | null
          parent_folder_id?: string | null
          project_id?: string | null
          thumbnail_link?: string | null
          updated_at?: string
          user_id?: string
          web_view_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_drive_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_drive_files_google_account_id_fkey"
            columns: ["google_account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_drive_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          green_invoice_id: string | null
          id: string
          invoice_number: string
          issue_date: string
          paid_amount: number | null
          paid_date: string | null
          payment_schedule_id: string | null
          pdf_storage_url: string | null
          project_id: string | null
          remaining_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          green_invoice_id?: string | null
          id?: string
          invoice_number: string
          issue_date: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_schedule_id?: string | null
          pdf_storage_url?: string | null
          project_id?: string | null
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          green_invoice_id?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_schedule_id?: string | null
          pdf_storage_url?: string | null
          project_id?: string | null
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: string[] | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          google_event_id: string | null
          id: string
          location: string | null
          meeting_type: string | null
          notes: string | null
          project_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_logs: {
        Row: {
          error: string | null
          executed_at: string | null
          executed_by: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          mode: string | null
          name: string
          rollback_sql: string | null
          sql_content: string | null
          status: string | null
          success: boolean | null
        }
        Insert: {
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          mode?: string | null
          name: string
          rollback_sql?: string | null
          sql_content?: string | null
          status?: string | null
          success?: boolean | null
        }
        Update: {
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          mode?: string | null
          name?: string
          rollback_sql?: string | null
          sql_content?: string | null
          status?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          invoice_id: string | null
          next_reminder_date: string | null
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_number: number
          payment_reference: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          invoice_id?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number: number
          payment_reference?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_id?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number?: number
          payment_reference?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
          reference_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date: string
          payment_method?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          module: string
          name: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          module: string
          name: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          module?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          custom_data: Json | null
          department: string | null
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          custom_data?: Json | null
          department?: string | null
          email: string
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          custom_data?: Json | null
          department?: string | null
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          project_id: string
          title: string
          visible_to_client: boolean | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          title: string
          visible_to_client?: boolean | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          title?: string
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to: string | null
          budget: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          custom_data: Json | null
          description: string | null
          end_date: string | null
          field_metadata: Json | null
          id: string
          name: string
          priority: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          description?: string | null
          end_date?: string | null
          field_metadata?: Json | null
          id?: string
          name: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          description?: string | null
          end_date?: string | null
          field_metadata?: Json | null
          id?: string
          name?: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_optional: boolean | null
          item_order: number | null
          notes: string | null
          quantity: number | null
          quote_id: string
          unit: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_optional?: boolean | null
          item_order?: number | null
          notes?: string | null
          quantity?: number | null
          quote_id: string
          unit?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_optional?: boolean | null
          item_order?: number | null
          notes?: string | null
          quantity?: number | null
          quote_id?: string
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          quote_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          label: string
          snapshot: Json
          template_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string
          snapshot?: Json
          template_id: string
          version_number?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string
          snapshot?: Json
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_templates: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          default_payment_terms: string | null
          default_terms: string | null
          description: string | null
          design_settings: Json | null
          html_content: string | null
          id: string
          important_notes: string[] | null
          is_active: boolean | null
          items: Json | null
          name: string
          notes: string | null
          payment_schedule: Json | null
          pricing_tiers: Json | null
          project_details: Json | null
          show_vat: boolean | null
          stages: Json | null
          template_content: string | null
          terms: string | null
          text_boxes: Json | null
          timeline: Json | null
          updated_at: string | null
          upgrades: Json | null
          validity_days: number | null
          vat_rate: number | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_payment_terms?: string | null
          default_terms?: string | null
          description?: string | null
          design_settings?: Json | null
          html_content?: string | null
          id?: string
          important_notes?: string[] | null
          is_active?: boolean | null
          items?: Json | null
          name: string
          notes?: string | null
          payment_schedule?: Json | null
          pricing_tiers?: Json | null
          project_details?: Json | null
          show_vat?: boolean | null
          stages?: Json | null
          template_content?: string | null
          terms?: string | null
          text_boxes?: Json | null
          timeline?: Json | null
          updated_at?: string | null
          upgrades?: Json | null
          validity_days?: number | null
          vat_rate?: number | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_payment_terms?: string | null
          default_terms?: string | null
          description?: string | null
          design_settings?: Json | null
          html_content?: string | null
          id?: string
          important_notes?: string[] | null
          is_active?: boolean | null
          items?: Json | null
          name?: string
          notes?: string | null
          payment_schedule?: Json | null
          pricing_tiers?: Json | null
          project_details?: Json | null
          show_vat?: boolean | null
          stages?: Json | null
          template_content?: string | null
          terms?: string | null
          text_boxes?: Json | null
          timeline?: Json | null
          updated_at?: string | null
          upgrades?: Json | null
          validity_days?: number | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_id: string
          contract_type: string | null
          converted_to_contract_id: string | null
          converted_to_invoice_id: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          issue_date: string
          items: Json | null
          notes: string | null
          paid_amount: number | null
          payment_schedule: Json | null
          payment_status: string | null
          payment_terms: string | null
          project_id: string | null
          quote_number: string
          quote_template_id: string | null
          remaining_amount: number | null
          sent_at: string | null
          signature_data: string | null
          signed_by: string | null
          signed_date: string | null
          signed_pdf_url: string | null
          status: string | null
          subtotal: number
          terms_and_conditions: string | null
          title: string
          total_amount: number
          updated_at: string | null
          valid_until: string | null
          vat_amount: number | null
          vat_rate: number | null
          viewed_at: string | null
        }
        Insert: {
          client_id: string
          contract_type?: string | null
          converted_to_contract_id?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          issue_date?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_schedule?: Json | null
          payment_status?: string | null
          payment_terms?: string | null
          project_id?: string | null
          quote_number: string
          quote_template_id?: string | null
          remaining_amount?: number | null
          sent_at?: string | null
          signature_data?: string | null
          signed_by?: string | null
          signed_date?: string | null
          signed_pdf_url?: string | null
          status?: string | null
          subtotal?: number
          terms_and_conditions?: string | null
          title: string
          total_amount?: number
          updated_at?: string | null
          valid_until?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Update: {
          client_id?: string
          contract_type?: string | null
          converted_to_contract_id?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          issue_date?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_schedule?: Json | null
          payment_status?: string | null
          payment_terms?: string | null
          project_id?: string | null
          quote_number?: string
          quote_template_id?: string | null
          remaining_amount?: number | null
          sent_at?: string | null
          signature_data?: string | null
          signed_by?: string | null
          signed_date?: string | null
          signed_pdf_url?: string | null
          status?: string | null
          subtotal?: number
          terms_and_conditions?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          valid_until?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotes_converted_to_contract"
            columns: ["converted_to_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          client_id: string | null
          created_at: string
          custom_ringtone_url: string | null
          email_template_id: string | null
          email_variables: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_dismissed: boolean | null
          is_recurring: boolean | null
          is_sent: boolean | null
          message: string | null
          recipient_email: string | null
          recipient_emails: string[] | null
          recipient_phone: string | null
          recipient_phones: string[] | null
          recurring_count: number | null
          recurring_interval: string | null
          remind_at: string
          reminder_type: string
          reminder_types: string[] | null
          ringtone: string | null
          send_sms: boolean | null
          send_whatsapp: boolean | null
          times_sent: number | null
          title: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          custom_ringtone_url?: string | null
          email_template_id?: string | null
          email_variables?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_recurring?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          recipient_email?: string | null
          recipient_emails?: string[] | null
          recipient_phone?: string | null
          recipient_phones?: string[] | null
          recurring_count?: number | null
          recurring_interval?: string | null
          remind_at: string
          reminder_type?: string
          reminder_types?: string[] | null
          ringtone?: string | null
          send_sms?: boolean | null
          send_whatsapp?: boolean | null
          times_sent?: number | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          custom_ringtone_url?: string | null
          email_template_id?: string | null
          email_variables?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_recurring?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          recipient_email?: string | null
          recipient_emails?: string[] | null
          recipient_phone?: string | null
          recipient_phones?: string[] | null
          recurring_count?: number | null
          recurring_interval?: string | null
          remind_at?: string
          reminder_type?: string
          reminder_types?: string[] | null
          ringtone?: string | null
          send_sms?: boolean | null
          send_whatsapp?: boolean | null
          times_sent?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          document_id: string
          document_type: string
          id: string
          ip_address: string | null
          is_valid: boolean | null
          signature_data: string
          signed_at: string | null
          signer_email: string | null
          signer_name: string
          signer_phone: string | null
          user_agent: string | null
        }
        Insert: {
          document_id: string
          document_type: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          signature_data: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
          signer_phone?: string | null
          user_agent?: string | null
        }
        Update: {
          document_id?: string
          document_type?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          signature_data?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_phone?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      stage_template_stages: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          stage_icon: string | null
          stage_name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          stage_icon?: string | null
          stage_name: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          stage_icon?: string | null
          stage_name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_template_stages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "stage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_template_tasks: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          template_id: string
          template_stage_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          template_id: string
          template_stage_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          template_id?: string
          template_stage_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "stage_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_template_tasks_template_stage_id_fkey"
            columns: ["template_stage_id"]
            isOneToOne: false
            referencedRelation: "stage_template_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_templates: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_multi_stage: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_multi_stage?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_multi_stage?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      table_custom_columns: {
        Row: {
          allow_multiple: boolean | null
          column_group: string | null
          column_key: string
          column_name: string
          column_options: Json | null
          column_order: number | null
          column_type: string
          created_at: string
          created_by: string
          data_type_id: string | null
          default_value: string | null
          formula: string | null
          id: string
          is_required: boolean | null
          max_rating: number | null
          table_name: string
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean | null
          column_group?: string | null
          column_key: string
          column_name: string
          column_options?: Json | null
          column_order?: number | null
          column_type?: string
          created_at?: string
          created_by: string
          data_type_id?: string | null
          default_value?: string | null
          formula?: string | null
          id?: string
          is_required?: boolean | null
          max_rating?: number | null
          table_name: string
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean | null
          column_group?: string | null
          column_key?: string
          column_name?: string
          column_options?: Json | null
          column_order?: number | null
          column_type?: string
          created_at?: string
          created_by?: string
          data_type_id?: string | null
          default_value?: string | null
          formula?: string | null
          id?: string
          is_required?: boolean | null
          max_rating?: number | null
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_custom_columns_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_consultants: {
        Row: {
          consultant_id: string
          created_at: string | null
          id: string
          keyword: string
          keyword_context: string | null
          notes: string | null
          task_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          id?: string
          keyword: string
          keyword_context?: string | null
          notes?: string | null
          task_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          id?: string
          keyword?: string
          keyword_context?: string | null
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          client_id: string | null
          created_at: string
          custom_data: Json | null
          description: string | null
          duration_minutes: number | null
          employee_id: string | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          is_running: boolean | null
          project_id: string | null
          start_time: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          custom_data?: Json | null
          description?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          is_running?: boolean | null
          project_id?: string | null
          start_time: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          custom_data?: Json | null
          description?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          is_running?: boolean | null
          project_id?: string | null
          start_time?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          billable: boolean | null
          client_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          project_name: string | null
          start_time: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billable?: boolean | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          project_name?: string | null
          start_time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billable?: boolean | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          project_name?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          animation_speed: string | null
          border_radius: string | null
          border_width: string | null
          button_style: string | null
          card_style: string | null
          channels: Json | null
          created_at: string | null
          custom_accent_color: string | null
          custom_border_color: string | null
          custom_error_color: string | null
          custom_primary_color: string | null
          custom_secondary_color: string | null
          custom_success_color: string | null
          custom_warning_color: string | null
          date_format: string | null
          font_family: string | null
          font_size: number | null
          header_style: string | null
          heading_font: string | null
          id: string
          input_style: string | null
          language: string | null
          letter_spacing: string | null
          line_height: string | null
          notification_email: string | null
          notification_phone: string | null
          notification_types: Json | null
          notification_whatsapp: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_frequency: string | null
          shadow_intensity: string | null
          sidebar_collapsed: boolean | null
          sidebar_pinned: boolean | null
          sidebar_style: string | null
          sidebar_theme: Json | null
          sidebar_width: number | null
          table_density: string | null
          table_style: string | null
          theme_preset: string | null
          time_format: string | null
          timezone: string | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
          view_preferences: Json | null
          virtual_scroll_threshold: number | null
          week_start: string | null
        }
        Insert: {
          animation_speed?: string | null
          border_radius?: string | null
          border_width?: string | null
          button_style?: string | null
          card_style?: string | null
          channels?: Json | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_border_color?: string | null
          custom_error_color?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          custom_success_color?: string | null
          custom_warning_color?: string | null
          date_format?: string | null
          font_family?: string | null
          font_size?: number | null
          header_style?: string | null
          heading_font?: string | null
          id?: string
          input_style?: string | null
          language?: string | null
          letter_spacing?: string | null
          line_height?: string | null
          notification_email?: string | null
          notification_phone?: string | null
          notification_types?: Json | null
          notification_whatsapp?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          shadow_intensity?: string | null
          sidebar_collapsed?: boolean | null
          sidebar_pinned?: boolean | null
          sidebar_style?: string | null
          sidebar_theme?: Json | null
          sidebar_width?: number | null
          table_density?: string | null
          table_style?: string | null
          theme_preset?: string | null
          time_format?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
          view_preferences?: Json | null
          virtual_scroll_threshold?: number | null
          week_start?: string | null
        }
        Update: {
          animation_speed?: string | null
          border_radius?: string | null
          border_width?: string | null
          button_style?: string | null
          card_style?: string | null
          channels?: Json | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_border_color?: string | null
          custom_error_color?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          custom_success_color?: string | null
          custom_warning_color?: string | null
          date_format?: string | null
          font_family?: string | null
          font_size?: number | null
          header_style?: string | null
          heading_font?: string | null
          id?: string
          input_style?: string | null
          language?: string | null
          letter_spacing?: string | null
          line_height?: string | null
          notification_email?: string | null
          notification_phone?: string | null
          notification_types?: Json | null
          notification_whatsapp?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          shadow_intensity?: string | null
          sidebar_collapsed?: boolean | null
          sidebar_pinned?: boolean | null
          sidebar_style?: string | null
          sidebar_theme?: Json | null
          sidebar_width?: number | null
          table_density?: string | null
          table_style?: string | null
          theme_preset?: string | null
          time_format?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
          view_preferences?: Json | null
          virtual_scroll_threshold?: number | null
          week_start?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          category: string | null
          created_at: string | null
          current_value: number
          id: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string | null
          week_start: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start?: string
        }
        Relationships: []
      }
      whatsapp_log: {
        Row: {
          client_id: string | null
          id: string
          message: string | null
          phone_number: string
          sent_at: string | null
          sent_by: string | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          id?: string
          message?: string | null
          phone_number: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          id?: string
          message?: string | null
          phone_number?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          client_id: string
          created_at: string | null
          direction: string
          id: string
          message: string
          phone_number: string
          sent_by: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          direction: string
          id?: string
          message: string
          phone_number: string
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          message?: string
          phone_number?: string
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          actions_executed: Json | null
          completed_at: string | null
          error_message: string | null
          id: string
          started_at: string | null
          status: string | null
          trigger_data: Json | null
          workflow_id: string | null
        }
        Insert: {
          actions_executed?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          workflow_id?: string | null
        }
        Update: {
          actions_executed?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          workflow_id?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          actions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          run_count: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      all_team_members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          hourly_rate: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          source: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_auth_hooks_v2: {
        Args: never
        Returns: {
          func_name: string
          func_schema: string
        }[]
      }
      check_auth_identities: {
        Args: never
        Returns: {
          has_identity: boolean
          identity_created: string
          identity_email: string
          identity_last_signin: string
          identity_provider: string
          user_email: string
        }[]
      }
      check_auth_status: {
        Args: never
        Returns: {
          email_confirmed: boolean
          has_password: boolean
          in_auth_users: boolean
          is_banned: boolean
          last_sign_in: string
          profile_email: string
        }[]
      }
      check_auth_status_v2: {
        Args: never
        Returns: {
          email_confirmed: boolean
          has_password: boolean
          in_auth_users: boolean
          is_banned: boolean
          last_sign_in: string
          profile_email: string
        }[]
      }
      check_auth_triggers: {
        Args: never
        Returns: {
          trigger_def: string
          trigger_name: string
        }[]
      }
      check_auth_triggers_v3: {
        Args: never
        Returns: {
          event_type: string
          function_name: string
          table_name: string
          trigger_name: string
        }[]
      }
      check_email_rate_limit: {
        Args: { p_user_id: string; p_user_role?: string }
        Returns: Json
      }
      check_mfa_status: {
        Args: never
        Returns: {
          factor_type: string
          has_mfa: boolean
          user_email: string
        }[]
      }
      check_overdue_payments: { Args: never; Returns: number }
      check_pw_format_v4: {
        Args: never
        Returns: {
          is_sso: boolean
          pw_length: number
          pw_prefix: string
          role_name: string
          user_created: string
          user_email: string
        }[]
      }
      check_user_metadata_v2: {
        Args: never
        Returns: {
          aud: string
          confirmation_token: string
          instance_id: string
          last_sign_in: string
          raw_app_metadata: string
          recovery_token: string
          user_email: string
        }[]
      }
      check_user_nulls: {
        Args: never
        Returns: {
          has_confirmation_token: boolean
          has_email_change: string
          has_email_change_token: string
          has_phone: string
          has_phone_change: string
          has_reauthentication_token: boolean
          has_recovery_token: boolean
          identity_data: string
          last_sign_in: string
          raw_user_meta: string
          user_email: string
        }[]
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      convert_quote_to_contract: {
        Args: {
          p_end_date?: string
          p_quote_id: string
          p_signed_date?: string
          p_start_date: string
        }
        Returns: string
      }
      create_employee_user: {
        Args: {
          p_department?: string
          p_email: string
          p_full_name: string
          p_hourly_rate?: number
          p_phone?: string
          p_position?: string
          p_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      create_invoice_from_schedule: {
        Args: { p_payment_schedule_id: string }
        Returns: string
      }
      create_payment_schedule: {
        Args: {
          p_contract_id: string
          p_first_payment_date: string
          p_num_payments: number
          p_payment_amounts?: number[]
        }
        Returns: undefined
      }
      debug_query: { Args: { query_text: string }; Returns: Json }
      execute_safe_migration: {
        Args: { p_migration_name: string; p_migration_sql: string }
        Returns: Json
      }
      execute_safe_migration_v2: {
        Args: { p_migration_name: string; p_migration_sql: string }
        Returns: Json
      }
      generate_contract_number: { Args: never; Returns: string }
      get_client_id: { Args: { _user_id: string }; Returns: string }
      get_contract_summary: { Args: { p_contract_id: string }; Returns: Json }
      get_email_folder_stats: {
        Args: { p_user_id: string }
        Returns: {
          email_count: number
          folder_id: string
          folder_name: string
          starred_count: number
          unread_count: number
        }[]
      }
      get_file_statistics: { Args: { p_user_id?: string }; Returns: Json }
      get_migration_history: {
        Args: never
        Returns: {
          error: string
          executed_at: string
          id: string
          name: string
          result_message: string
          sql_content: string
          success: boolean
        }[]
      }
      get_next_version_number: {
        Args: { p_template_id: string }
        Returns: number
      }
      get_popular_tags: {
        Args: { p_limit?: number }
        Returns: {
          count: number
          tag: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { p_file_id: string }
        Returns: undefined
      }
      increment_email_rate_limit: {
        Args: { p_count?: number; p_user_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { p_file_id: string }; Returns: undefined }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_client: { Args: { _user_id: string }; Returns: boolean }
      is_email_unsubscribed: { Args: { p_email: string }; Returns: boolean }
      move_file_to_folder: {
        Args: { p_file_id: string; p_folder_id: string }
        Returns: boolean
      }
      quick_health_check: { Args: never; Returns: Json }
      run_system_diagnostic: { Args: never; Returns: Json }
      run_system_health_check: { Args: never; Returns: Json }
      search_files: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_folder_id?: string
          p_limit?: number
          p_max_size?: number
          p_min_size?: number
          p_offset?: number
          p_query?: string
          p_starred_only?: boolean
          p_tags?: string[]
          p_type?: string
          p_user_id?: string
        }
        Returns: {
          category: string
          client_id: string
          created_at: string
          download_count: number
          extension: string
          folder_id: string
          id: string
          is_shared: boolean
          is_starred: boolean
          mime_type: string
          name: string
          path: string
          size: number
          tags: string[]
          thumbnail: string
          type: string
          updated_at: string
          uploaded_by: string
          view_count: number
        }[]
      }
      toggle_file_star: { Args: { p_file_id: string }; Returns: boolean }
      toggle_file_tag: {
        Args: { p_file_id: string; p_tag: string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "client"
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
      app_role: ["admin", "manager", "employee", "client"],
    },
  },
} as const
