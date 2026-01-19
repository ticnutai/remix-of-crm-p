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
      client_stage_tasks: {
        Row: {
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          sort_order: number
          stage_id: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          stage_id: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          stage_id?: string
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
          id: string
          is_completed: boolean | null
          sort_order: number
          stage_icon: string | null
          stage_id: string
          stage_name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          data_type_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number
          stage_icon?: string | null
          stage_id: string
          stage_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          data_type_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number
          stage_icon?: string | null
          stage_id?: string
          stage_name?: string
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
          budget_range: string | null
          company: string | null
          created_at: string
          created_by: string | null
          custom_data: Json | null
          email: string | null
          field_metadata: Json | null
          id: string
          is_sample: boolean | null
          linkedin: string | null
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
          tags: string[] | null
          updated_at: string
          user_id: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          budget_range?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          email?: string | null
          field_metadata?: Json | null
          id?: string
          is_sample?: boolean | null
          linkedin?: string | null
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
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          budget_range?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json | null
          email?: string | null
          field_metadata?: Json | null
          id?: string
          is_sample?: boolean | null
          linkedin?: string | null
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
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
          pdf_storage_url: string | null
          project_id: string | null
          remaining_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
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
          pdf_storage_url?: string | null
          project_id?: string | null
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
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
          id: string
          name: string
          sql_content: string | null
          success: boolean | null
        }
        Insert: {
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          name: string
          sql_content?: string | null
          success?: boolean | null
        }
        Update: {
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          name?: string
          sql_content?: string | null
          success?: boolean | null
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
      quotes: {
        Row: {
          client_id: string
          converted_to_invoice_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          issue_date: string
          items: Json | null
          notes: string | null
          paid_amount: number | null
          payment_status: string | null
          project_id: string | null
          quote_number: string
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
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          issue_date?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          project_id?: string | null
          quote_number: string
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
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          issue_date?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          project_id?: string | null
          quote_number?: string
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
        ]
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
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          font_family: string | null
          font_size: number | null
          header_style: string | null
          heading_font: string | null
          id: string
          input_style: string | null
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
          sidebar_pinned: boolean | null
          sidebar_style: string | null
          sidebar_width: number | null
          table_density: string | null
          table_style: string | null
          theme_preset: string | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
          virtual_scroll_threshold: number | null
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
          font_family?: string | null
          font_size?: number | null
          header_style?: string | null
          heading_font?: string | null
          id?: string
          input_style?: string | null
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
          sidebar_pinned?: boolean | null
          sidebar_style?: string | null
          sidebar_width?: number | null
          table_density?: string | null
          table_style?: string | null
          theme_preset?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
          virtual_scroll_threshold?: number | null
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
          font_family?: string | null
          font_size?: number | null
          header_style?: string | null
          heading_font?: string | null
          id?: string
          input_style?: string | null
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
          sidebar_pinned?: boolean | null
          sidebar_style?: string | null
          sidebar_width?: number | null
          table_density?: string | null
          table_style?: string | null
          theme_preset?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
          virtual_scroll_threshold?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_safe_migration: {
        Args: { p_migration_name: string; p_migration_sql: string }
        Returns: Json
      }
      get_client_id: { Args: { _user_id: string }; Returns: string }
      get_migration_history: {
        Args: never
        Returns: {
          error: string
          executed_at: string
          id: string
          name: string
          success: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_client: { Args: { _user_id: string }; Returns: boolean }
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
