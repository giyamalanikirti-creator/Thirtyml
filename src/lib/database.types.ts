export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      amenities: {
        Row: {
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          city_id: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          city_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_path: string | null
          is_active: boolean
          link_url: string | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_guests: {
        Row: {
          booking_id: string
          created_at: string
          full_name: string
          id: string
          is_lead: boolean
        }
        Insert: {
          booking_id: string
          created_at?: string
          full_name: string
          id?: string
          is_lead?: boolean
        }
        Update: {
          booking_id?: string
          created_at?: string
          full_name?: string
          id?: string
          is_lead?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_guests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          cancellation_reason: string | null
          cancelled_at: string | null
          club_id: string
          created_at: string
          guest_count: number
          id: string
          night_date: string
          order_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_code?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_id: string
          created_at?: string
          guest_count?: number
          id?: string
          night_date: string
          order_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_code?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_id?: string
          created_at?: string
          guest_count?: number
          id?: string
          night_date?: string
          order_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          night_date: string
          price_change_acknowledged_at: string | null
          price_when_added: number
          product_id: string
          quantity: number
          saved_for_later: boolean
          table_id: string | null
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          night_date: string
          price_change_acknowledged_at?: string | null
          price_when_added: number
          product_id: string
          quantity?: number
          saved_for_later?: boolean
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          night_date?: string
          price_change_acknowledged_at?: string | null
          price_when_added?: number
          product_id?: string
          quantity?: number
          saved_for_later?: boolean
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          anonymous_token: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_token?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_token?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          at: string
          guests_admitted: number
          id: string
          staff_id: string
          ticket_id: string
        }
        Insert: {
          at?: string
          guests_admitted: number
          id?: string
          staff_id: string
          ticket_id: string
        }
        Update: {
          at?: string
          guests_admitted?: number
          id?: string
          staff_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lat: number
          lng: number
          name: string
          slug: string
          sort_order: number
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lat: number
          lng: number
          name: string
          slug: string
          sort_order?: number
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number
          lng?: number
          name?: string
          slug?: string
          sort_order?: number
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_amenities: {
        Row: {
          amenity_id: string
          club_id: string
        }
        Insert: {
          amenity_id: string
          club_id: string
        }
        Update: {
          amenity_id?: string
          club_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_amenities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_claims: {
        Row: {
          admin_note: string | null
          claimant_id: string
          club_id: string
          created_at: string
          id: string
          proof: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          claimant_id: string
          club_id: string
          created_at?: string
          id?: string
          proof?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          claimant_id?: string
          club_id?: string
          created_at?: string
          id?: string
          proof?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_claims_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_genres: {
        Row: {
          club_id: string
          genre_id: string
        }
        Insert: {
          club_id: string
          genre_id: string
        }
        Update: {
          club_id?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_genres_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      club_hours: {
        Row: {
          closes_at: string | null
          club_id: string
          day_of_week: number
          id: string
          is_closed: boolean
          opens_at: string | null
        }
        Insert: {
          closes_at?: string | null
          club_id: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
        }
        Update: {
          closes_at?: string | null
          club_id?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_hours_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string
          id: string
          invited_by: string | null
          removed_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          removed_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          removed_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_photos: {
        Row: {
          alt: string | null
          club_id: string
          created_at: string
          id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt?: string | null
          club_id: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt?: string | null
          club_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_photos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          area_id: string | null
          avg_rating: number | null
          booking_cutoff_minutes: number
          cancellation_policy: NonNullable<Json>
          city_id: string
          commission_bps: number | null
          convenience_fee_override: Json | null
          created_at: string
          description: string | null
          dress_code: string | null
          house_rules: string | null
          id: string
          instagram_url: string | null
          is_claimed: boolean
          is_featured: boolean
          lat: number | null
          lng: number | null
          min_age: number
          name: string
          phone: string | null
          rating_count: number
          requires_guest_names: boolean
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          area_id?: string | null
          avg_rating?: number | null
          booking_cutoff_minutes?: number
          cancellation_policy?: NonNullable<Json>
          city_id: string
          commission_bps?: number | null
          convenience_fee_override?: Json | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          house_rules?: string | null
          id?: string
          instagram_url?: string | null
          is_claimed?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          min_age?: number
          name: string
          phone?: string | null
          rating_count?: number
          requires_guest_names?: boolean
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          area_id?: string | null
          avg_rating?: number | null
          booking_cutoff_minutes?: number
          cancellation_policy?: NonNullable<Json>
          city_id?: string
          commission_bps?: number | null
          convenience_fee_override?: Json | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          house_rules?: string | null
          id?: string
          instagram_url?: string | null
          is_claimed?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          min_age?: number
          name?: string
          phone?: string | null
          rating_count?: number
          requires_guest_names?: boolean
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          club_id: string | null
          collection_id: string
          event_id: string | null
          id: string
          sort_order: number
        }
        Insert: {
          club_id?: string | null
          collection_id: string
          event_id?: string | null
          id?: string
          sort_order?: number
        }
        Update: {
          club_id?: string | null
          collection_id?: string
          event_id?: string | null
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          city_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_applied: number
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_applied: number
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          auto_apply: boolean
          city_id: string | null
          club_id: string | null
          code: string
          created_at: string
          created_by: string | null
          days_of_week: number[] | null
          description: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          first_booking_only: boolean
          funded_by: string
          id: string
          is_active: boolean
          max_discount: number | null
          min_cart_value: number
          new_users_only: boolean
          per_user_limit: number
          product_type: string | null
          total_limit: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          auto_apply?: boolean
          city_id?: string | null
          club_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          description?: string | null
          discount_type: string
          discount_value: number
          event_id?: string | null
          first_booking_only?: boolean
          funded_by?: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_cart_value?: number
          new_users_only?: boolean
          per_user_limit?: number
          product_type?: string | null
          total_limit?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          auto_apply?: boolean
          city_id?: string | null
          club_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          first_booking_only?: boolean
          funded_by?: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_cart_value?: number
          new_users_only?: boolean
          per_user_limit?: number
          product_type?: string | null
          total_limit?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_lineup: {
        Row: {
          artist_name: string
          event_id: string
          genre: string | null
          id: string
          sort_order: number
        }
        Insert: {
          artist_name: string
          event_id: string
          genre?: string | null
          id?: string
          sort_order?: number
        }
        Update: {
          artist_name?: string
          event_id?: string
          genre?: string | null
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_lineup_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_featured: boolean
          name: string
          poster_path: string | null
          slug: string
          starts_at: string
          status: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          name: string
          poster_path?: string | null
          slug: string
          starts_at: string
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          poster_path?: string | null
          slug?: string
          starts_at?: string
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          club_id: string | null
          created_at: string
          event_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          enabled: boolean
          key: string
          note: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          key: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          key?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      floor_plans: {
        Row: {
          background_path: string | null
          club_id: string
          created_at: string
          height: number
          id: string
          name: string
          width: number
        }
        Insert: {
          background_path?: string | null
          club_id: string
          created_at?: string
          height?: number
          id?: string
          name?: string
          width?: number
        }
        Update: {
          background_path?: string | null
          club_id?: string
          created_at?: string
          height?: number
          id?: string
          name?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_holds: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          night_date: string
          order_id: string
          product_id: string
          quantity: number
          table_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          night_date: string
          order_id: string
          product_id: string
          quantity: number
          table_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          night_date?: string
          order_id?: string
          product_id?: string
          quantity?: number
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_holds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          financial_year: string
          last_number: number
        }
        Insert: {
          financial_year: string
          last_number?: number
        }
        Update: {
          financial_year?: string
          last_number?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          club_gstin: string | null
          created_at: string
          financial_year: string
          id: string
          invoice_number: string
          order_id: string
          pdf_path: string | null
          seller_gstin: string | null
          totals: NonNullable<Json>
        }
        Insert: {
          club_gstin?: string | null
          created_at?: string
          financial_year: string
          id?: string
          invoice_number: string
          order_id: string
          pdf_path?: string | null
          seller_gstin?: string | null
          totals: NonNullable<Json>
        }
        Update: {
          club_gstin?: string | null
          created_at?: string
          financial_year?: string
          id?: string
          invoice_number?: string
          order_id?: string
          pdf_path?: string | null
          seller_gstin?: string | null
          totals?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nights: {
        Row: {
          club_id: string
          created_at: string
          id: string
          is_open: boolean
          note: string | null
          on_date: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          is_open?: boolean
          note?: string | null
          on_date: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          is_open?: boolean
          note?: string | null
          on_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "nights_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          prefs: NonNullable<Json>
          updated_at: string
          user_id: string
        }
        Insert: {
          prefs?: NonNullable<Json>
          updated_at?: string
          user_id: string
        }
        Update: {
          prefs?: NonNullable<Json>
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          attempts: number
          body: string | null
          category: string
          channel: string
          club_id: string | null
          created_at: string
          error: string | null
          failed_at: string | null
          id: string
          payload: NonNullable<Json>
          read_at: string | null
          send_after: string
          sent_at: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          body?: string | null
          category: string
          channel: string
          club_id?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          payload?: NonNullable<Json>
          read_at?: string | null
          send_after?: string
          sent_at?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          body?: string | null
          category?: string
          channel?: string
          club_id?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          payload?: NonNullable<Json>
          read_at?: string | null
          send_after?: string
          sent_at?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          club_id: string
          created_at: string
          id: string
          night_date: string
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity: number
          table_id: string | null
          unit_price: number
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          night_date: string
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity: number
          table_id?: string | null
          unit_price: number
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          night_date?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_type?: string
          quantity?: number
          table_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          convenience_fee: number
          coupon_id: string | null
          created_at: string
          discount: number
          hold_expires_at: string | null
          id: string
          idempotency_key: string
          lead_guest_email: string | null
          lead_guest_name: string | null
          lead_guest_phone: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
          wallet_used: number
        }
        Insert: {
          convenience_fee?: number
          coupon_id?: string | null
          created_at?: string
          discount?: number
          hold_expires_at?: string | null
          id?: string
          idempotency_key: string
          lead_guest_email?: string | null
          lead_guest_name?: string | null
          lead_guest_phone?: string | null
          status?: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id: string
          wallet_used?: number
        }
        Update: {
          convenience_fee?: number
          coupon_id?: string | null
          created_at?: string
          discount?: number
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string
          lead_guest_email?: string | null
          lead_guest_name?: string | null
          lead_guest_phone?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
          wallet_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          admin_note: string | null
          applicant_id: string | null
          city: string
          club_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          applicant_id?: string | null
          city: string
          club_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          applicant_id?: string | null
          city?: string
          club_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          order_id: string
          raw_payload: Json | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          order_id: string
          raw_payload?: Json | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          order_id?: string
          raw_payload?: Json | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          bank_last4: string | null
          club_id: string
          created_at: string
          gstin: string | null
          id: string
          pan_last4: string | null
          razorpay_linked_account_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bank_last4?: string | null
          club_id: string
          created_at?: string
          gstin?: string | null
          id?: string
          pan_last4?: string | null
          razorpay_linked_account_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bank_last4?: string | null
          club_id?: string
          created_at?: string
          gstin?: string | null
          id?: string
          pan_last4?: string | null
          razorpay_linked_account_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          club_id: string
          commission: number
          created_at: string
          gross: number
          hold_reason: string | null
          id: string
          net: number
          night_date: string
          processed_at: string | null
          razorpay_transfer_id: string | null
          refunds_deducted: number
          scheduled_for: string | null
          status: string
          updated_at: string
        }
        Insert: {
          club_id: string
          commission?: number
          created_at?: string
          gross?: number
          hold_reason?: string | null
          id?: string
          net?: number
          night_date: string
          processed_at?: string | null
          razorpay_transfer_id?: string | null
          refunds_deducted?: number
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          commission?: number
          created_at?: string
          gross?: number
          hold_reason?: string | null
          id?: string
          net?: number
          night_date?: string
          processed_at?: string | null
          razorpay_transfer_id?: string | null
          refunds_deducted?: number
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: NonNullable<Json>
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: NonNullable<Json>
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: NonNullable<Json>
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          id: string
          night_date: string
          product_id: string
          threshold: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          night_date: string
          product_id: string
          threshold: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          night_date?: string
          product_id?: string
          threshold?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_price: number
          old_price: number | null
          product_id: string
          reason: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price: number
          old_price?: number | null
          product_id: string
          reason?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          on_date: string
          price: number
          product_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          on_date: string
          price: number
          product_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          on_date?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rules: {
        Row: {
          created_at: string
          created_by: string | null
          days_of_week: number[]
          id: string
          is_active: boolean
          price: number
          product_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          capacity_per_night: number
          club_id: string
          cover_redeemable: boolean
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          is_active: boolean
          max_per_order: number
          min_age: number | null
          name: string
          price_updated_at: string
          sales_end_at: string | null
          sales_start_at: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          base_price: number
          capacity_per_night?: number
          club_id: string
          cover_redeemable?: boolean
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_per_order?: number
          min_age?: number | null
          name: string
          price_updated_at?: string
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          capacity_per_night?: number
          club_id?: string
          cover_redeemable?: boolean
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_per_order?: number
          min_age?: number | null
          name?: string
          price_updated_at?: string
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          email_verified_at: string | null
          full_name: string | null
          gender: string | null
          home_city_id: string | null
          id: string
          phone: string | null
          phone_verified_at: string | null
          referral_code: string | null
          referred_by: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          home_city_id?: string | null
          id: string
          phone?: string | null
          phone_verified_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          home_city_id?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_fk"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed: {
        Row: {
          club_id: string | null
          event_id: string | null
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          club_id?: string | null
          event_id?: string | null
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          club_id?: string | null
          event_id?: string | null
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string
          referrer_id: string
          rewarded_booking_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id: string
          referrer_id: string
          rewarded_booking_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string
          referrer_id?: string
          rewarded_booking_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_rewarded_booking_id_fkey"
            columns: ["rewarded_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          initiated_by: string | null
          method: string
          order_id: string
          payment_id: string | null
          razorpay_refund_id: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          method?: string
          order_id: string
          payment_id?: string | null
          razorpay_refund_id?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          method?: string
          order_id?: string
          payment_id?: string | null
          razorpay_refund_id?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          review_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          review_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          club_id: string
          created_at: string
          id: string
          rating: number
          rating_crowd: number | null
          rating_music: number | null
          rating_service: number | null
          rating_value: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          club_id: string
          created_at?: string
          id?: string
          rating: number
          rating_crowd?: number | null
          rating_music?: number | null
          rating_service?: number | null
          rating_value?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          club_id?: string
          created_at?: string
          id?: string
          rating?: number
          rating_crowd?: number | null
          rating_music?: number | null
          rating_service?: number | null
          rating_value?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_lines: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          description: string
          id: string
          payout_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          description: string
          id?: string
          payout_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_lines_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          created_at: string
          email: string | null
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          deposit_bps: number
          floor_plan_id: string
          id: string
          min_spend: number
          name: string
          product_id: string
          shape: string
          x: number
          y: number
          zone: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          deposit_bps?: number
          floor_plan_id: string
          id?: string
          min_spend?: number
          name: string
          product_id: string
          shape?: string
          x?: number
          y?: number
          zone?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          deposit_bps?: number
          floor_plan_id?: string
          id?: string
          min_spend?: number
          name?: string
          product_id?: string
          shape?: string
          x?: number
          y?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "floor_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          created_at: string
          guests_admitted: number
          guests_total: number
          id: string
          qr_token: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          guests_admitted?: number
          guests_total?: number
          id?: string
          qr_token?: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          guests_admitted?: number
          guests_total?: number
          id?: string
          qr_token?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          created_at: string
          id: string
          night_date: string
          notified_at: string | null
          product_id: string
          quantity: number
          status: string
          user_id: string
          window_expires_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          night_date: string
          notified_at?: string | null
          product_id: string
          quantity?: number
          status?: string
          user_id: string
          window_expires_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          night_date?: string
          notified_at?: string | null
          product_id?: string
          quantity?: number
          status?: string
          user_id?: string
          window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          note: string | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          id: string
          payload: NonNullable<Json>
          processed_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          id?: string
          payload: NonNullable<Json>
          processed_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          id?: string
          payload?: NonNullable<Json>
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_due_price_rules: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      available_quantity: {
        Args: { p_date: string; p_product_id: string }
        Returns: number
      }
      current_role_is: { Args: { target: string }; Returns: boolean }
      dearmor: { Args: { "": string }; Returns: string }
      effective_price: {
        Args: { p_at?: string; p_date: string; p_product_id: string }
        Returns: number
      }
      expire_stale_holds: { Args: Record<PropertyKey, never>; Returns: number }
      gen_random_uuid: { Args: Record<PropertyKey, never>; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      is_club_member: {
        Args: { club: string; roles?: string[] }
        Returns: boolean
      }
      is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_support_agent: { Args: Record<PropertyKey, never>; Returns: boolean }
      next_invoice_number: { Args: Record<PropertyKey, never>; Returns: string }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      place_hold: {
        Args: {
          p_date: string
          p_hold_minutes?: number
          p_order_id: string
          p_product_id: string
          p_quantity: number
          p_table_id?: string
        }
        Returns: string
      }
      show_limit: { Args: Record<PropertyKey, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      wallet_balance: { Args: { uid: string }; Returns: number }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
