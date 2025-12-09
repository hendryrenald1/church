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
      };
    };
  };
}
