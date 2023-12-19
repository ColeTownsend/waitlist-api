export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: number
          token: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id: number
          token?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      memberships: {
        Row: {
          code: string | null
          created_at: string
          id: number
          invited_email: string | null
          organization_id: number
          role: number
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: never
          invited_email?: string | null
          organization_id: number
          role: number
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: never
          invited_email?: string | null
          organization_id?: number
          role?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: number
          logo_url: string | null
          name: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: never
          logo_url?: string | null
          name: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: never
          logo_url?: string | null
          name?: string
          uuid?: string
        }
        Relationships: []
      }
      organizations_subscriptions: {
        Row: {
          customer_id: string
          organization_id: number
          subscription_id: string | null
        }
        Insert: {
          customer_id: string
          organization_id: number
          subscription_id?: string | null
        }
        Update: {
          customer_id?: string
          organization_id?: number
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string | null
          currency: string | null
          id: string
          interval: string | null
          interval_count: number | null
          period_ends_at: string | null
          period_starts_at: string | null
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
        }
        Insert: {
          cancel_at_period_end: boolean
          created_at?: string | null
          currency?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          currency?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          onboarded: boolean
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist_referrals: {
        Row: {
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          id: string
          organization_id: number
          referred_signup_id: string | null
          referrer_user_id: string
          waitlist_id: string
        }
        Insert: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          organization_id: number
          referred_signup_id?: string | null
          referrer_user_id: string
          waitlist_id: string
        }
        Update: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: number
          referred_signup_id?: string | null
          referrer_user_id?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_referrals_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_referrals_referred_signup_id_fkey"
            columns: ["referred_signup_id"]
            referencedRelation: "waitlist_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            referencedRelation: "waitlist_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_referrals_waitlist_id_fkey"
            columns: ["waitlist_id"]
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist_settings: {
        Row: {
          id: string
          organization_id: number
          settings: Json
          waitlist_id: string
        }
        Insert: {
          id?: string
          organization_id: number
          settings?: Json
          waitlist_id: string
        }
        Update: {
          id?: string
          organization_id?: number
          settings?: Json
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_settings_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_settings_waitlist_id_fkey"
            columns: ["waitlist_id"]
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist_signups: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean
          confirmed_at: string | null
          email: string
          id: string
          joined_at: string
          organization_id: number
          points: number
          unique_share_code: string
          waitlist_id: string
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          email: string
          id?: string
          joined_at?: string
          organization_id: number
          points?: number
          unique_share_code?: string
          waitlist_id: string
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          email?: string
          id?: string
          joined_at?: string
          organization_id?: number
          points?: number
          unique_share_code?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_signups_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_signups_waitlist_id_fkey"
            columns: ["waitlist_id"]
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite_to_organization: {
        Args: {
          invite_code: string
          invite_user_id: string
        }
        Returns: Json
      }
      can_roll_api_token: {
        Args: {
          organization_id: number
        }
        Returns: boolean
      }
      can_update_user_role: {
        Args: {
          organization_id: number
          membership_id: number
        }
        Returns: boolean
      }
      confirm_user_referral: {
        Args: {
          p_email: string
          p_waitlist_id: string
        }
        Returns: undefined
      }
      confirm_user_referral_with_token: {
        Args: {
          p_token: string
          p_waitlist_id: string
        }
        Returns: undefined
      }
      create_new_organization: {
        Args: {
          org_name: string
          user_id: string
          create_user?: boolean
        }
        Returns: string
      }
      create_new_waitlist: {
        Args: {
          waitlist_name: string
          org_id: number
          description?: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: number
        }[]
      }
      create_waitlist_signup: {
        Args: {
          p_waitlist_id: string
          p_email: string
          p_automatic_confirmation: boolean
          p_referral_code?: string
        }
        Returns: {
          id: string
          email: string
          unique_share_code: string
          organization_id: number
          waitlist_id: string
          joined_at: string
          confirmed: boolean
          confirmation_token: string
          confirmed_at: string
        }[]
      }
      current_user_is_member_of_organization: {
        Args: {
          organization_id: number
        }
        Returns: boolean
      }
      delete_claim: {
        Args: {
          uid: string
          claim: string
        }
        Returns: string
      }
      get_claim: {
        Args: {
          uid: string
          claim: string
        }
        Returns: Json
      }
      get_claims: {
        Args: {
          uid: string
        }
        Returns: Json
      }
      get_my_claim: {
        Args: {
          claim: string
        }
        Returns: Json
      }
      get_my_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_organizations_for_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      get_role_for_authenticated_user: {
        Args: {
          org_id: number
        }
        Returns: number
      }
      get_role_for_user: {
        Args: {
          membership_id: number
        }
        Returns: number
      }
      is_claims_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      random_alphanumeric_string: {
        Args: {
          length: number
        }
        Returns: string
      }
      set_claim: {
        Args: {
          uid: string
          claim: string
          value: Json
        }
        Returns: string
      }
      short_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      transfer_organization: {
        Args: {
          org_id: number
          target_user_membership_id: number
        }
        Returns: undefined
      }
    }
    Enums: {
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

