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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agenda_items: {
        Row: {
          bill_id: string | null
          created_at: string | null
          description: string | null
          detection_confidence: number | null
          detection_method: string | null
          end_time: number | null
          id: string
          item_number: number
          item_type: string
          metadata: Json | null
          start_time: number | null
          status: string | null
          title: string
          trigger_phrase: string | null
          updated_at: string | null
          video_id: string | null
          vote_result: string | null
        }
        Insert: {
          bill_id?: string | null
          created_at?: string | null
          description?: string | null
          detection_confidence?: number | null
          detection_method?: string | null
          end_time?: number | null
          id?: string
          item_number: number
          item_type: string
          metadata?: Json | null
          start_time?: number | null
          status?: string | null
          title: string
          trigger_phrase?: string | null
          updated_at?: string | null
          video_id?: string | null
          vote_result?: string | null
        }
        Update: {
          bill_id?: string | null
          created_at?: string | null
          description?: string | null
          detection_confidence?: number | null
          detection_method?: string | null
          end_time?: number | null
          id?: string
          item_number?: number
          item_type?: string
          metadata?: Json | null
          start_time?: number | null
          status?: string | null
          title?: string
          trigger_phrase?: string | null
          updated_at?: string | null
          video_id?: string | null
          vote_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "agenda_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_transcriptions"
            referencedColumns: ["video_id"]
          },
        ]
      }
      alert_notifications: {
        Row: {
          alert_id: string | null
          bill_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          meeting_id: string | null
          message: string
          notification_type: string
          read_at: string | null
          segment_id: string | null
          sent_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_id?: string | null
          bill_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          meeting_id?: string | null
          message: string
          notification_type: string
          read_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_id?: string | null
          bill_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          meeting_id?: string | null
          message?: string
          notification_type?: string
          read_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "user_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "alert_notifications_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_cosponsors: {
        Row: {
          added_date: string | null
          bill_id: string | null
          created_at: string | null
          id: string
          legislator_id: string | null
        }
        Insert: {
          added_date?: string | null
          bill_id?: string | null
          created_at?: string | null
          id?: string
          legislator_id?: string | null
        }
        Update: {
          added_date?: string | null
          bill_id?: string | null
          created_at?: string | null
          id?: string
          legislator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_cosponsors_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_cosponsors_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "bill_cosponsors_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "bill_cosponsors_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_issues: {
        Row: {
          bill_id: string | null
          created_at: string | null
          id: string
          is_primary_issue: boolean | null
          issue_id: string | null
          relevance_score: number | null
        }
        Insert: {
          bill_id?: string | null
          created_at?: string | null
          id?: string
          is_primary_issue?: boolean | null
          issue_id?: string | null
          relevance_score?: number | null
        }
        Update: {
          bill_id?: string | null
          created_at?: string | null
          id?: string
          is_primary_issue?: boolean | null
          issue_id?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_issues_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_issues_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "bill_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_number: string
          created_at: string | null
          current_stage: string | null
          description: string | null
          document_url: string | null
          effective_date: string | null
          final_vote_abstain: number | null
          final_vote_no: number | null
          final_vote_yes: number | null
          fiscal_note_url: string | null
          full_text: string | null
          id: string
          introduced_date: string | null
          last_action_date: string | null
          legislative_body_id: string | null
          metadata: Json | null
          passed_date: string | null
          primary_sponsor_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bill_number: string
          created_at?: string | null
          current_stage?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          final_vote_abstain?: number | null
          final_vote_no?: number | null
          final_vote_yes?: number | null
          fiscal_note_url?: string | null
          full_text?: string | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          legislative_body_id?: string | null
          metadata?: Json | null
          passed_date?: string | null
          primary_sponsor_id?: string | null
          status: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bill_number?: string
          created_at?: string | null
          current_stage?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          final_vote_abstain?: number | null
          final_vote_no?: number | null
          final_vote_yes?: number | null
          fiscal_note_url?: string | null
          full_text?: string | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          legislative_body_id?: string | null
          metadata?: Json | null
          passed_date?: string | null
          primary_sponsor_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_legislative_body_id_fkey"
            columns: ["legislative_body_id"]
            isOneToOne: false
            referencedRelation: "legislative_bodies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_primary_sponsor_id_fkey"
            columns: ["primary_sponsor_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "bills_primary_sponsor_id_fkey"
            columns: ["primary_sponsor_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_statistics: {
        Row: {
          average_sentiment: number | null
          created_at: string | null
          id: string
          issue_id: string | null
          last_calculated_at: string | null
          meetings_discussed_count: number | null
          period_end: string
          period_start: string
          period_type: string
          related_bills_count: number | null
          sentiment_trend: string | null
          top_legislators: Json | null
          total_mentions: number | null
          total_speaking_time_seconds: number | null
          unique_legislators_count: number | null
        }
        Insert: {
          average_sentiment?: number | null
          created_at?: string | null
          id?: string
          issue_id?: string | null
          last_calculated_at?: string | null
          meetings_discussed_count?: number | null
          period_end: string
          period_start: string
          period_type: string
          related_bills_count?: number | null
          sentiment_trend?: string | null
          top_legislators?: Json | null
          total_mentions?: number | null
          total_speaking_time_seconds?: number | null
          unique_legislators_count?: number | null
        }
        Update: {
          average_sentiment?: number | null
          created_at?: string | null
          id?: string
          issue_id?: string | null
          last_calculated_at?: string | null
          meetings_discussed_count?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          related_bills_count?: number | null
          sentiment_trend?: string | null
          top_legislators?: Json | null
          total_mentions?: number | null
          total_speaking_time_seconds?: number | null
          unique_legislators_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_statistics_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          ai_confidence: number | null
          approved_at: string | null
          approved_by: string | null
          category_level: number | null
          color_hex: string | null
          created_at: string | null
          description: string | null
          first_detected_at: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean | null
          is_approved: boolean | null
          jurisdiction_id: string | null
          keywords: string[] | null
          legislator_count: number | null
          mention_count: number | null
          metadata: Json | null
          name: string
          parent_issue_id: string | null
          segment_count: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category_level?: number | null
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          first_detected_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          is_approved?: boolean | null
          jurisdiction_id?: string | null
          keywords?: string[] | null
          legislator_count?: number | null
          mention_count?: number | null
          metadata?: Json | null
          name: string
          parent_issue_id?: string | null
          segment_count?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category_level?: number | null
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          first_detected_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          is_approved?: boolean | null
          jurisdiction_id?: string | null
          keywords?: string[] | null
          legislator_count?: number | null
          mention_count?: number | null
          metadata?: Json | null
          name?: string
          parent_issue_id?: string | null
          segment_count?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_parent_issue_id_fkey"
            columns: ["parent_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          jurisdiction_type: string
          metadata: Json | null
          name: string
          state: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_type: string
          metadata?: Json | null
          name: string
          state?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_type?: string
          metadata?: Json | null
          name?: string
          state?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      key_quotes: {
        Row: {
          ai_model_version: string | null
          context_after: string | null
          context_before: string | null
          created_at: string | null
          detection_confidence: number | null
          id: string
          impact_level: string
          is_approved: boolean | null
          is_featured: boolean | null
          legislator_id: string | null
          metadata: Json | null
          primary_issue_id: string | null
          quote_text: string
          quote_type: string | null
          segment_id: number | null
          sentiment_intensity: number | null
          sentiment_score: number | null
        }
        Insert: {
          ai_model_version?: string | null
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          detection_confidence?: number | null
          id?: string
          impact_level: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          legislator_id?: string | null
          metadata?: Json | null
          primary_issue_id?: string | null
          quote_text: string
          quote_type?: string | null
          segment_id?: number | null
          sentiment_intensity?: number | null
          sentiment_score?: number | null
        }
        Update: {
          ai_model_version?: string | null
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          detection_confidence?: number | null
          id?: string
          impact_level?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          legislator_id?: string | null
          metadata?: Json | null
          primary_issue_id?: string | null
          quote_text?: string
          quote_type?: string | null
          segment_id?: number | null
          sentiment_intensity?: number | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_quotes_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "key_quotes_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_quotes_primary_issue_id_fkey"
            columns: ["primary_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_quotes_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "transcription_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      legislative_actions: {
        Row: {
          action_description: string
          action_type: string
          bill_id: string | null
          created_at: string | null
          id: string
          meeting_id: string | null
          metadata: Json | null
          moved_by_id: string | null
          notes: string | null
          occurred_at: string | null
          seconded_by_id: string | null
          video_timestamp_seconds: number | null
          vote_absent: number | null
          vote_abstain: number | null
          vote_no: number | null
          vote_result: string | null
          vote_yes: number | null
        }
        Insert: {
          action_description: string
          action_type: string
          bill_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          moved_by_id?: string | null
          notes?: string | null
          occurred_at?: string | null
          seconded_by_id?: string | null
          video_timestamp_seconds?: number | null
          vote_absent?: number | null
          vote_abstain?: number | null
          vote_no?: number | null
          vote_result?: string | null
          vote_yes?: number | null
        }
        Update: {
          action_description?: string
          action_type?: string
          bill_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          moved_by_id?: string | null
          notes?: string | null
          occurred_at?: string | null
          seconded_by_id?: string | null
          video_timestamp_seconds?: number | null
          vote_absent?: number | null
          vote_abstain?: number | null
          vote_no?: number | null
          vote_result?: string | null
          vote_yes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legislative_actions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislative_actions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "legislative_actions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislative_actions_moved_by_id_fkey"
            columns: ["moved_by_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "legislative_actions_moved_by_id_fkey"
            columns: ["moved_by_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislative_actions_seconded_by_id_fkey"
            columns: ["seconded_by_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "legislative_actions_seconded_by_id_fkey"
            columns: ["seconded_by_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      legislative_bodies: {
        Row: {
          body_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          jurisdiction_id: string | null
          meeting_schedule: Json | null
          name: string
          updated_at: string | null
          video_source_url: string | null
          website_url: string | null
        }
        Insert: {
          body_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_id?: string | null
          meeting_schedule?: Json | null
          name: string
          updated_at?: string | null
          video_source_url?: string | null
          website_url?: string | null
        }
        Update: {
          body_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_id?: string | null
          meeting_schedule?: Json | null
          name?: string
          updated_at?: string | null
          video_source_url?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislative_bodies_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      legislator_issue_metrics: {
        Row: {
          average_relevance_score: number | null
          average_sentiment_score: number | null
          created_at: string | null
          id: string
          issue_id: string
          last_calculated_at: string | null
          legislator_id: string
          negative_mentions: number | null
          neutral_mentions: number | null
          period_end: string
          period_start: string
          period_type: string
          positive_mentions: number | null
          sentiment_confidence: number | null
          total_mentions: number | null
          total_speaking_time_seconds: number | null
        }
        Insert: {
          average_relevance_score?: number | null
          average_sentiment_score?: number | null
          created_at?: string | null
          id?: string
          issue_id: string
          last_calculated_at?: string | null
          legislator_id: string
          negative_mentions?: number | null
          neutral_mentions?: number | null
          period_end: string
          period_start: string
          period_type: string
          positive_mentions?: number | null
          sentiment_confidence?: number | null
          total_mentions?: number | null
          total_speaking_time_seconds?: number | null
        }
        Update: {
          average_relevance_score?: number | null
          average_sentiment_score?: number | null
          created_at?: string | null
          id?: string
          issue_id?: string
          last_calculated_at?: string | null
          legislator_id?: string
          negative_mentions?: number | null
          neutral_mentions?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          positive_mentions?: number | null
          sentiment_confidence?: number | null
          total_mentions?: number | null
          total_speaking_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legislator_issue_metrics_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislator_issue_metrics_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "legislator_issue_metrics_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      legislator_positions: {
        Row: {
          agenda_item_id: string | null
          ai_confidence: number | null
          ai_model_version: string | null
          bill_id: string | null
          created_at: string | null
          final_position: boolean | null
          first_expressed_at: string | null
          id: string
          legislator_id: string | null
          metadata: Json | null
          position: string
          position_strength: number | null
          source: string
          supporting_segments: number[] | null
          updated_at: string | null
        }
        Insert: {
          agenda_item_id?: string | null
          ai_confidence?: number | null
          ai_model_version?: string | null
          bill_id?: string | null
          created_at?: string | null
          final_position?: boolean | null
          first_expressed_at?: string | null
          id?: string
          legislator_id?: string | null
          metadata?: Json | null
          position: string
          position_strength?: number | null
          source: string
          supporting_segments?: number[] | null
          updated_at?: string | null
        }
        Update: {
          agenda_item_id?: string | null
          ai_confidence?: number | null
          ai_model_version?: string | null
          bill_id?: string | null
          created_at?: string | null
          final_position?: boolean | null
          first_expressed_at?: string | null
          id?: string
          legislator_id?: string | null
          metadata?: Json | null
          position?: string
          position_strength?: number | null
          source?: string
          supporting_segments?: number[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislator_positions_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislator_positions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislator_positions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "legislator_positions_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "legislator_positions_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      legislator_statistics: {
        Row: {
          average_segment_length_seconds: number | null
          average_sentiment: number | null
          bills_cosponsored: number | null
          bills_sponsored: number | null
          created_at: string | null
          id: string
          last_calculated_at: string | null
          legislator_id: string | null
          meetings_attended: number | null
          meetings_missed: number | null
          motions_made: number | null
          period_end: string
          period_start: string
          period_type: string
          top_issues: Json | null
          total_segments: number | null
          total_speaking_time_seconds: number | null
          votes_abstain: number | null
          votes_cast: number | null
          votes_no: number | null
          votes_yes: number | null
        }
        Insert: {
          average_segment_length_seconds?: number | null
          average_sentiment?: number | null
          bills_cosponsored?: number | null
          bills_sponsored?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          legislator_id?: string | null
          meetings_attended?: number | null
          meetings_missed?: number | null
          motions_made?: number | null
          period_end: string
          period_start: string
          period_type: string
          top_issues?: Json | null
          total_segments?: number | null
          total_speaking_time_seconds?: number | null
          votes_abstain?: number | null
          votes_cast?: number | null
          votes_no?: number | null
          votes_yes?: number | null
        }
        Update: {
          average_segment_length_seconds?: number | null
          average_sentiment?: number | null
          bills_cosponsored?: number | null
          bills_sponsored?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          legislator_id?: string | null
          meetings_attended?: number | null
          meetings_missed?: number | null
          motions_made?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          top_issues?: Json | null
          total_segments?: number | null
          total_speaking_time_seconds?: number | null
          votes_abstain?: number | null
          votes_cast?: number | null
          votes_no?: number | null
          votes_yes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legislator_statistics_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "legislator_statistics_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      legislators: {
        Row: {
          bio: string | null
          committees: string[] | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string
          district: string | null
          education: string | null
          email: string | null
          face_profile_id: string | null
          first_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          last_name: string
          legislative_body_id: string | null
          metadata: Json | null
          occupation: string | null
          office_address: string | null
          party_affiliation: string | null
          phone: string | null
          photo_url: string | null
          race_ethnicity: string | null
          social_media: Json | null
          term_end: string | null
          term_start: string | null
          title: string | null
          updated_at: string | null
          voice_profile_id: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          committees?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name: string
          district?: string | null
          education?: string | null
          email?: string | null
          face_profile_id?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          legislative_body_id?: string | null
          metadata?: Json | null
          occupation?: string | null
          office_address?: string | null
          party_affiliation?: string | null
          phone?: string | null
          photo_url?: string | null
          race_ethnicity?: string | null
          social_media?: Json | null
          term_end?: string | null
          term_start?: string | null
          title?: string | null
          updated_at?: string | null
          voice_profile_id?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          committees?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string
          district?: string | null
          education?: string | null
          email?: string | null
          face_profile_id?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          legislative_body_id?: string | null
          metadata?: Json | null
          occupation?: string | null
          office_address?: string | null
          party_affiliation?: string | null
          phone?: string | null
          photo_url?: string | null
          race_ethnicity?: string | null
          social_media?: Json | null
          term_end?: string | null
          term_start?: string | null
          title?: string | null
          updated_at?: string | null
          voice_profile_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislators_legislative_body_id_fkey"
            columns: ["legislative_body_id"]
            isOneToOne: false
            referencedRelation: "legislative_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          arrival_time: string | null
          attendance_status: string
          created_at: string | null
          departure_time: string | null
          id: string
          legislator_id: string | null
          meeting_id: string | null
          notes: string | null
        }
        Insert: {
          arrival_time?: string | null
          attendance_status: string
          created_at?: string | null
          departure_time?: string | null
          id?: string
          legislator_id?: string | null
          meeting_id?: string | null
          notes?: string | null
        }
        Update: {
          arrival_time?: string | null
          attendance_status?: string
          created_at?: string | null
          departure_time?: string | null
          id?: string
          legislator_id?: string | null
          meeting_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "meeting_attendees_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_documents: {
        Row: {
          created_at: string | null
          document_type: string
          extracted_text: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          last_checked_at: string | null
          meeting_date: string
          meeting_id: string | null
          metadata: Json | null
          page_count: number | null
          scraped_at: string | null
          source_url: string
          text_extraction_error: string | null
          text_extraction_status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          extracted_text?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          last_checked_at?: string | null
          meeting_date: string
          meeting_id?: string | null
          metadata?: Json | null
          page_count?: number | null
          scraped_at?: string | null
          source_url: string
          text_extraction_error?: string | null
          text_extraction_status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          extracted_text?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          last_checked_at?: string | null
          meeting_date?: string
          meeting_id?: string | null
          metadata?: Json | null
          page_count?: number | null
          scraped_at?: string | null
          source_url?: string
          text_extraction_error?: string | null
          text_extraction_status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_documents_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          ai_model_version: string | null
          created_at: string | null
          decisions: Json | null
          generated_at: string | null
          id: string
          is_approved: boolean | null
          key_points: Json | null
          summary_text: string
          updated_at: string | null
          video_id: string
          votes_overview: Json | null
        }
        Insert: {
          ai_model_version?: string | null
          created_at?: string | null
          decisions?: Json | null
          generated_at?: string | null
          id?: string
          is_approved?: boolean | null
          key_points?: Json | null
          summary_text: string
          updated_at?: string | null
          video_id: string
          votes_overview?: Json | null
        }
        Update: {
          ai_model_version?: string | null
          created_at?: string | null
          decisions?: Json | null
          generated_at?: string | null
          id?: string
          is_approved?: boolean | null
          key_points?: Json | null
          summary_text?: string
          updated_at?: string | null
          video_id?: string
          votes_overview?: Json | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          agenda_url: string | null
          analysis_status: string | null
          attendance_count: number | null
          created_at: string | null
          description: string | null
          id: string
          is_virtual: boolean | null
          legislative_body_id: string | null
          location: string | null
          meeting_type: string
          metadata: Json | null
          minutes_url: string | null
          processing_status: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          title: string
          transcription_status: string | null
          updated_at: string | null
          video_duration_seconds: number | null
          video_id: string | null
          video_platform: string | null
          video_url: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          agenda_url?: string | null
          analysis_status?: string | null
          attendance_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_virtual?: boolean | null
          legislative_body_id?: string | null
          location?: string | null
          meeting_type: string
          metadata?: Json | null
          minutes_url?: string | null
          processing_status?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          title: string
          transcription_status?: string | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          agenda_url?: string | null
          analysis_status?: string | null
          attendance_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_virtual?: boolean | null
          legislative_body_id?: string | null
          location?: string | null
          meeting_type?: string
          metadata?: Json | null
          minutes_url?: string | null
          processing_status?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          title?: string
          transcription_status?: string | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_legislative_body_id_fkey"
            columns: ["legislative_body_id"]
            isOneToOne: false
            referencedRelation: "legislative_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_completion_at: string | null
          id: string
          items_processed: number | null
          items_total: number | null
          job_type: string
          meeting_id: string | null
          parameters: Json | null
          progress_percentage: number | null
          result_summary: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion_at?: string | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          job_type: string
          meeting_id?: string | null
          parameters?: Json | null
          progress_percentage?: number | null
          result_summary?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion_at?: string | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          job_type?: string
          meeting_id?: string | null
          parameters?: Json | null
          progress_percentage?: number | null
          result_summary?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_issues: {
        Row: {
          ai_model_version: string | null
          created_at: string | null
          id: string
          is_manually_verified: boolean | null
          issue_id: string | null
          key_phrases: string[] | null
          manually_added: boolean | null
          relevance_score: number
          segment_id: number | null
          sentiment_confidence: number | null
          sentiment_label: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score: number | null
          verification_timestamp: string | null
          verified_by: string | null
        }
        Insert: {
          ai_model_version?: string | null
          created_at?: string | null
          id?: string
          is_manually_verified?: boolean | null
          issue_id?: string | null
          key_phrases?: string[] | null
          manually_added?: boolean | null
          relevance_score: number
          segment_id?: number | null
          sentiment_confidence?: number | null
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          verification_timestamp?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_model_version?: string | null
          created_at?: string | null
          id?: string
          is_manually_verified?: boolean | null
          issue_id?: string | null
          key_phrases?: string[] | null
          manually_added?: boolean | null
          relevance_score?: number
          segment_id?: number | null
          sentiment_confidence?: number | null
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          verification_timestamp?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segment_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_issues_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "transcription_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          legislator_id: string
          pattern_type: string
          pattern_value: string
          updated_at: string | null
          usage_count: number | null
          video_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          legislator_id: string
          pattern_type: string
          pattern_value: string
          updated_at?: string | null
          usage_count?: number | null
          video_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          legislator_id?: string
          pattern_type?: string
          pattern_value?: string
          updated_at?: string | null
          usage_count?: number | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_patterns_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "speaker_patterns_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_segments: {
        Row: {
          agenda_item_id: string | null
          created_at: string | null
          end_time: number
          id: number
          occurred_at: string | null
          source: string
          speaker_id: string | null
          speaker_name: string | null
          start_time: number
          text: string
          video_id: string
        }
        Insert: {
          agenda_item_id?: string | null
          created_at?: string | null
          end_time: number
          id?: number
          occurred_at?: string | null
          source?: string
          speaker_id?: string | null
          speaker_name?: string | null
          start_time: number
          text: string
          video_id: string
        }
        Update: {
          agenda_item_id?: string | null
          created_at?: string | null
          end_time?: number
          id?: number
          occurred_at?: string | null
          source?: string
          speaker_id?: string | null
          speaker_name?: string | null
          start_time?: number
          text?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcription_segments_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcription_segments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_transcriptions"
            referencedColumns: ["video_id"]
          },
        ]
      }
      uploaded_meeting_segments: {
        Row: {
          end_time_seconds: number
          id: string
          search_vector: unknown
          segment_index: number
          speaker_id: string | null
          speaker_name: string | null
          start_time_seconds: number
          text: string
          uploaded_meeting_id: string
        }
        Insert: {
          end_time_seconds: number
          id?: string
          search_vector?: unknown
          segment_index: number
          speaker_id?: string | null
          speaker_name?: string | null
          start_time_seconds: number
          text: string
          uploaded_meeting_id: string
        }
        Update: {
          end_time_seconds?: number
          id?: string
          search_vector?: unknown
          segment_index?: number
          speaker_id?: string | null
          speaker_name?: string | null
          start_time_seconds?: number
          text?: string
          uploaded_meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_meeting_segments_uploaded_meeting_id_fkey"
            columns: ["uploaded_meeting_id"]
            isOneToOne: false
            referencedRelation: "uploaded_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_meetings: {
        Row: {
          description: string | null
          full_transcript: string | null
          id: string
          is_active: boolean | null
          processed_at: string | null
          search_vector: unknown
          title: string | null
          transcription_error: string | null
          transcription_status: string | null
          uploaded_at: string | null
          uploaded_by_user_id: string | null
          video_duration_seconds: number | null
          video_filename: string
          video_language: string | null
          video_size_bytes: number
          youtube_video_id: string | null
        }
        Insert: {
          description?: string | null
          full_transcript?: string | null
          id?: string
          is_active?: boolean | null
          processed_at?: string | null
          search_vector?: unknown
          title?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
          video_duration_seconds?: number | null
          video_filename: string
          video_language?: string | null
          video_size_bytes: number
          youtube_video_id?: string | null
        }
        Update: {
          description?: string | null
          full_transcript?: string | null
          id?: string
          is_active?: boolean | null
          processed_at?: string | null
          search_vector?: unknown
          title?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
          video_duration_seconds?: number | null
          video_filename?: string
          video_language?: string | null
          video_size_bytes?: number
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_name: string
          alert_type: string
          bill_id: string | null
          created_at: string | null
          delivery_method: string
          frequency: string | null
          id: string
          is_active: boolean | null
          issue_id: string | null
          keywords: string[] | null
          last_triggered_at: string | null
          legislator_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_name: string
          alert_type: string
          bill_id?: string | null
          created_at?: string | null
          delivery_method: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          issue_id?: string | null
          keywords?: string[] | null
          last_triggered_at?: string | null
          legislator_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_name?: string
          alert_type?: string
          bill_id?: string | null
          created_at?: string | null
          delivery_method?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          issue_id?: string | null
          keywords?: string[] | null
          last_triggered_at?: string | null
          legislator_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alerts_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "user_alerts_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alerts_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "user_alerts_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          bill_id: string | null
          bookmark_type: string
          created_at: string | null
          id: string
          issue_id: string | null
          legislator_id: string | null
          meeting_id: string | null
          notes: string | null
          segment_id: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          bill_id?: string | null
          bookmark_type: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          legislator_id?: string | null
          meeting_id?: string | null
          notes?: string | null
          segment_id?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          bill_id?: string | null
          bookmark_type?: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          legislator_id?: string | null
          meeting_id?: string | null
          notes?: string | null
          segment_id?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "user_bookmarks_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "user_bookmarks_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_jurisdiction_id: string | null
          display_preferences: Json | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          notification_preferences: Json | null
          role: string | null
          supabase_user_id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_jurisdiction_id?: string | null
          display_preferences?: Json | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          role?: string | null
          supabase_user_id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_jurisdiction_id?: string | null
          display_preferences?: Json | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          role?: string | null
          supabase_user_id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_default_jurisdiction_id_fkey"
            columns: ["default_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_transcriptions: {
        Row: {
          channel_title: string
          created_at: string | null
          diarization_enabled: boolean | null
          duration: number
          error_message: string | null
          provider: string | null
          published_at: string
          source: string
          status: string | null
          thumbnail_url: string | null
          title: string
          transcription_cost: number | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          channel_title: string
          created_at?: string | null
          diarization_enabled?: boolean | null
          duration: number
          error_message?: string | null
          provider?: string | null
          published_at: string
          source?: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          transcription_cost?: number | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          channel_title?: string
          created_at?: string | null
          diarization_enabled?: boolean | null
          duration?: number
          error_message?: string | null
          provider?: string | null
          published_at?: string
          source?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          transcription_cost?: number | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      vote_records: {
        Row: {
          created_at: string | null
          id: string
          legislative_action_id: string | null
          legislator_id: string | null
          notes: string | null
          vote: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          legislative_action_id?: string | null
          legislator_id?: string | null
          notes?: string | null
          vote: string
        }
        Update: {
          created_at?: string | null
          id?: string
          legislative_action_id?: string | null
          legislator_id?: string | null
          notes?: string | null
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_records_legislative_action_id_fkey"
            columns: ["legislative_action_id"]
            isOneToOne: false
            referencedRelation: "legislative_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_records_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislator_stance_summary"
            referencedColumns: ["legislator_id"]
          },
          {
            foreignKeyName: "vote_records_legislator_id_fkey"
            columns: ["legislator_id"]
            isOneToOne: false
            referencedRelation: "legislators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      legislator_stance_summary: {
        Row: {
          avg_deliberation_sentiment: number | null
          bill_id: string | null
          bill_number: string | null
          bill_title: string | null
          display_name: string | null
          explicit_vote: string | null
          final_position: string | null
          legislator_id: string | null
          relevant_quote_count: number | null
        }
        Relationships: []
      }
      legislator_top_issues: {
        Row: {
          avg_relevance: number | null
          avg_sentiment: number | null
          issue_id: string | null
          legislator_id: string | null
          mention_count: number | null
          negative_count: number | null
          neutral_count: number | null
          positive_count: number | null
          total_speaking_time_seconds: number | null
        }
        Relationships: [
          {
            foreignKeyName: "segment_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_legislator_statistics: {
        Args: {
          p_end_date?: string
          p_period_type?: string
          p_start_date?: string
        }
        Returns: undefined
      }
      get_legislator_issue_breakdown: {
        Args: { p_legislator_id: string; p_limit?: number }
        Returns: {
          average_sentiment_score: number
          issue_id: string
          issue_name: string
          negative_mentions: number
          neutral_mentions: number
          positive_mentions: number
          total_mentions: number
          total_speaking_time_seconds: number
        }[]
      }
      get_unique_speakers: {
        Args: never
        Returns: {
          unique_speaker_name: string
        }[]
      }
      refresh_legislator_top_issues: { Args: never; Returns: undefined }
      search_uploaded_transcripts: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          meeting_date: string
          meeting_id: string
          meeting_title: string
          relevance_rank: number
          segment_end: number
          segment_id: string
          segment_start: number
          segment_text: string
        }[]
      }
      user_role: { Args: never; Returns: string }
    }
    Enums: {
      sentiment_label: "positive" | "negative" | "neutral" | "mixed"
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
      sentiment_label: ["positive", "negative", "neutral", "mixed"],
    },
  },
} as const
