/**
 * Auto-generated TypeScript definitions from Supabase
 * Generated from your database schema
 */

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
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          avatar_url: string | null
          country: string | null
          city: string | null
          company_name: string | null
          business_type: string | null
          website: string | null
          role: string
          status: string
          email_verified: boolean
          phone_verified: boolean
          preferred_currency: string
          preferred_gateway: string | null
          payment_method: string | null
          metadata: Json | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          country?: string | null
          city?: string | null
          company_name?: string | null
          business_type?: string | null
          website?: string | null
          role?: string
          status?: string
          email_verified?: boolean
          phone_verified?: boolean
          preferred_currency?: string
          preferred_gateway?: string | null
          payment_method?: string | null
          metadata?: Json | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          country?: string | null
          city?: string | null
          company_name?: string | null
          business_type?: string | null
          website?: string | null
          role?: string
          status?: string
          email_verified?: boolean
          phone_verified?: boolean
          preferred_currency?: string
          preferred_gateway?: string | null
          payment_method?: string | null
          metadata?: Json | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_phone: string | null
          amount: number
          currency: string
          gateway: string
          method: string
          reference: string
          transaction_id: string | null
          status: string
          subscription_id: string | null
          plan_id: string | null
          user_country: string | null
          user_ip: string | null
          gateway_response: Json | null
          description: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_phone?: string | null
          amount: number
          currency: string
          gateway: string
          method: string
          reference: string
          transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          plan_id?: string | null
          user_country?: string | null
          user_ip?: string | null
          gateway_response?: Json | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_phone?: string | null
          amount?: number
          currency?: string
          gateway?: string
          method?: string
          reference?: string
          transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          plan_id?: string | null
          user_country?: string | null
          user_ip?: string | null
          gateway_response?: Json | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          currency: string
          billing_cycle: string
          amount: number
          gateway: string
          gateway_subscription_id: string | null
          gateway_customer_id: string | null
          start_date: string
          end_date: string | null
          next_billing_date: string | null
          last_payment_date: string | null
          payment_count: number
          failed_attempts: number
          metadata: Json | null
          created_at: string
          updated_at: string
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status?: string
          currency?: string
          billing_cycle: string
          amount: number
          gateway: string
          gateway_subscription_id?: string | null
          gateway_customer_id?: string | null
          start_date: string
          end_date?: string | null
          next_billing_date?: string | null
          last_payment_date?: string | null
          payment_count?: number
          failed_attempts?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          currency?: string
          billing_cycle?: string
          amount?: number
          gateway?: string
          gateway_subscription_id?: string | null
          gateway_customer_id?: string | null
          start_date?: string
          end_date?: string | null
          next_billing_date?: string | null
          last_payment_date?: string | null
          payment_count?: number
          failed_attempts?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          payment_id: string
          subscription_id: string | null
          user_id: string
          invoice_number: string
          amount: number
          currency: string
          status: string
          description: string | null
          items: Json | null
          issue_date: string
          due_date: string | null
          paid_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          subscription_id?: string | null
          user_id: string
          invoice_number: string
          amount: number
          currency: string
          status?: string
          description?: string | null
          items?: Json | null
          issue_date?: string
          due_date?: string | null
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          subscription_id?: string | null
          user_id?: string
          invoice_number?: string
          amount?: number
          currency?: string
          status?: string
          description?: string | null
          items?: Json | null
          issue_date?: string
          due_date?: string | null
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_gateway_logs: {
        Row: {
          id: string
          payment_id: string
          gateway: string
          action: string
          request_data: Json | null
          response_data: Json | null
          status_code: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          gateway: string
          action: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          gateway?: string
          action?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          error_message?: string | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          email_payment_receipt: boolean
          email_subscription_reminder: boolean
          email_invoice: boolean
          email_marketing: boolean
          sms_payment_alert: boolean
          sms_subscription_reminder: boolean
          auto_renew_subscription: boolean
          save_payment_method: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_payment_receipt?: boolean
          email_subscription_reminder?: boolean
          email_invoice?: boolean
          email_marketing?: boolean
          sms_payment_alert?: boolean
          sms_subscription_reminder?: boolean
          auto_renew_subscription?: boolean
          save_payment_method?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_payment_receipt?: boolean
          email_subscription_reminder?: boolean
          email_invoice?: boolean
          email_marketing?: boolean
          sms_payment_alert?: boolean
          sms_subscription_reminder?: boolean
          auto_renew_subscription?: boolean
          save_payment_method?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          email: string
          name: string | null
          country: string | null
          status: string
          position: number | null
          created_at: string
          converted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          country?: string | null
          status?: string
          position?: number | null
          created_at?: string
          converted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          country?: string | null
          status?: string
          position?: number | null
          created_at?: string
          converted_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}