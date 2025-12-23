export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      church: {
        Row: {
          id: string;
          name: string;
          slug: string;
          primary_contact_name: string;
          primary_contact_email: string;
          status: "PENDING" | "ACTIVE" | "SUSPENDED";
          plan: "FREE" | "STANDARD" | "PREMIUM";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["church"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["church"]["Row"]>;
        Relationships: [];
      };
      app_user: {
        Row: {
          id: string;
          email: string;
          role: "SUPER_ADMIN" | "ADMIN" | "PASTOR";
          church_id: string | null;
          member_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_user"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["app_user"]["Row"]>;
        Relationships: [];
      };
      branch: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          city: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["branch"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["branch"]["Row"]>;
        Relationships: [];
      };
      member: {
        Row: {
          id: string;
          church_id: string;
          branch_id: string | null;
          first_name: string;
          last_name: string;
          gender: string | null;
          email: string | null;
          phone: string | null;
          status: "ACTIVE" | "INACTIVE";
          joined_date: string;
          date_of_birth: string | null;
          baptism_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["member"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["member"]["Row"]>;
        Relationships: [];
      };
      pastor_profile: {
        Row: {
          id: string;
          member_id: string;
          church_id: string;
          title: string;
          ordination_date: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pastor_profile"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["pastor_profile"]["Row"]>;
        Relationships: [];
      };
      pastor_branch: {
        Row: {
          id: string;
          church_id: string;
          pastor_profile_id: string;
          branch_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pastor_branch"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["pastor_branch"]["Row"]>;
        Relationships: [];
      };
      family: {
        Row: {
          id: string;
          church_id: string;
          family_name: string | null;
          wedding_anniversary: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["family"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["family"]["Row"]>;
        Relationships: [];
      };
      family_member: {
        Row: {
          id: string;
          family_id: string;
          member_id: string;
          relationship: "HEAD" | "SPOUSE" | "CHILD" | "OTHER";
          is_primary_contact: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["family_member"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["family_member"]["Row"]>;
        Relationships: [];
      };
      group: {
        Row: {
          id: string;
          church_id: string;
          branch_id: string | null;
          name: string;
          type: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["group"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["group"]["Row"]>;
        Relationships: [];
      };
      group_member: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          member_id: string;
          joined_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["group_member"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["group_member"]["Row"]>;
        Relationships: [];
      };
      group_announcement: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          title: string;
          body: string;
          created_at: string;
          created_by: string;
        };
        Insert: Partial<Database["public"]["Tables"]["group_announcement"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["group_announcement"]["Row"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          church_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string;
          activity_type: string;
          title: string;
          description: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
        Relationships: [];
      };
      cell_group: {
        Row: {
          id: string;
          church_id: string;
          branch_id: string | null;
          name: string;
          description: string | null;
          schedule_weekday: number | null;
          default_meeting_time: string | null;
          status: "ACTIVE" | "INACTIVE";
          host_address: string | null;
          allow_children: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          branch_id?: string | null;
          name: string;
          description?: string | null;
          schedule_weekday?: number | null;
          default_meeting_time?: string | null;
          status?: "ACTIVE" | "INACTIVE";
          host_address?: string | null;
          allow_children?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cell_group"]["Row"]>;
        Relationships: [];
      };
      cell_group_member: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          member_id: string;
          role: "LEADER" | "ASSISTANT" | "MEMBER";
          joined_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          group_id: string;
          member_id: string;
          role?: "LEADER" | "ASSISTANT" | "MEMBER";
          joined_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cell_group_member"]["Row"]>;
        Relationships: [];
      };
      cell_meeting: {
        Row: {
          id: string;
          church_id: string;
          group_id: string;
          meeting_date: string;
          status: "SCHEDULED" | "HELD" | "CANCELLED";
          leader_member_id: string | null;
          notes: string | null;
          visitor_count: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          finalized_at: string | null;
          finalized_by: string | null;
          combined_with_meeting_id: string | null;
          topic: string | null;
          scripture_reference: string | null;
          start_time: string | null;
          end_time: string | null;
          offering_amount: number | null;
          offering_notes: string | null;
          cancelled_reason: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          group_id: string;
          meeting_date: string;
          status?: "SCHEDULED" | "HELD" | "CANCELLED";
          leader_member_id?: string | null;
          notes?: string | null;
          visitor_count?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          combined_with_meeting_id?: string | null;
          topic?: string | null;
          scripture_reference?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          offering_amount?: number | null;
          offering_notes?: string | null;
          cancelled_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cell_meeting"]["Row"]>;
        Relationships: [];
      };
      meeting_attendance: {
        Row: {
          id: string;
          church_id: string;
          meeting_id: string;
          member_id: string;
          status: "UNKNOWN" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
          is_child: boolean;
          recorded_by: string | null;
          recorded_at: string | null;
          is_first_time: boolean | null;
          brought_visitor: boolean | null;
          visitor_count: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          meeting_id: string;
          member_id: string;
          status?: "UNKNOWN" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
          is_child?: boolean;
          recorded_by?: string | null;
          recorded_at?: string | null;
          is_first_time?: boolean | null;
          brought_visitor?: boolean | null;
          visitor_count?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["meeting_attendance"]["Row"]>;
        Relationships: [];
      };
      cell_group_visitor: {
        Row: {
          id: string;
          church_id: string;
          meeting_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          invited_by: string | null;
          follow_up_status: "PENDING" | "CONTACTED" | "CONVERTED" | "DECLINED";
          follow_up_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          meeting_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          invited_by?: string | null;
          follow_up_status?: "PENDING" | "CONTACTED" | "CONVERTED" | "DECLINED";
          follow_up_notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cell_group_visitor"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
