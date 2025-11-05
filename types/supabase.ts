export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          phone: string | null;
          role: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          phone?: string | null;
          role?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          phone?: string | null;
          role?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          quarter: string;
          section: string;
          year: number;
          description: string | null;
          max_team_size: number | null;
          class_code: string;
          archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          quarter: string;
          section: string;
          year: number;
          description?: string | null;
          max_team_size?: number | null;
          class_code: string;
          archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quarter?: string;
          section?: string;
          year?: number;
          description?: string | null;
          max_team_size?: number | null;
          class_code?: string;
          archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      class_roles: {
        Row: {
          class_id: string;
          user_id: string;
          role: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          user_id: string;
          role: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          user_id?: string;
          role?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_roles_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_roles_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          creator_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          name: string;
          creator_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          name?: string;
          creator_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          joined_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          joined_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
          joined_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      surveys: {
        Row: {
          id: string;
          class_id: string;
          created_by: string | null;
          sent_date: string | null;
          questions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          created_by?: string | null;
          sent_date?: string | null;
          questions: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          created_by?: string | null;
          sent_date?: string | null;
          questions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "surveys_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "surveys_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          survey_id: string;
          user_id: string;
          team_id: string;
          answers: Json;
          timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          user_id: string;
          team_id: string;
          answers: Json;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          user_id?: string;
          team_id?: string;
          answers?: Json;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_survey_id_fkey";
            columns: ["survey_id"];
            isOneToOne: false;
            referencedRelation: "surveys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_agreements: {
        Row: {
          id: string;
          team_id: string;
          content: string;
          created_by: string | null;
          created_date: string;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          content: string;
          created_by?: string | null;
          created_date?: string;
          locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          content?: string;
          created_by?: string | null;
          created_date?: string;
          locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_agreements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_agreements_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      agreement_signatures: {
        Row: {
          agreement_id: string;
          user_id: string;
          signed_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          agreement_id: string;
          user_id: string;
          signed_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          agreement_id?: string;
          user_id?: string;
          signed_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agreement_signatures_agreement_id_fkey";
            columns: ["agreement_id"];
            isOneToOne: false;
            referencedRelation: "team_agreements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agreement_signatures_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      icebreaker_questions: {
        Row: {
          id: string;
          question_text: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_text: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_text?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      icebreaker_responses: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          question_id: string;
          answer: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          question_id: string;
          answer: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string;
          question_id?: string;
          answer?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "icebreaker_responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "icebreaker_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "icebreaker_responses_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "icebreaker_responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      departure_requests: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          reason: string | null;
          status: string;
          requested_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          reason?: string | null;
          status?: string;
          requested_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          reason?: string | null;
          status?: string;
          requested_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departure_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "departure_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_contexts: {
        Row: {
          user_id: string;
          last_active_class_id: string | null;
          last_active_role: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          last_active_class_id?: string | null;
          last_active_role?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          last_active_class_id?: string | null;
          last_active_role?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_contexts_last_active_class_id_fkey";
            columns: ["last_active_class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_contexts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<TableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][TableName] extends {
  Row: infer R;
} ? R : never;

export type TablesWith<TableName extends keyof PublicSchema["Tables"], R extends Record<string, any>> = 
  Tables<TableName> & R;

// Specific types for student dashboard queries
export type EnrolledClass = TablesWith<
  "class_roles",
  {
    classes: Pick<Tables<"classes">, "id" | "name" | "quarter" | "year" | "section" | "archived"> | null;
    teams: Pick<Tables<"teams">, "id" | "name">[] | null;
  }
>;

export type Enums<EnumName extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][EnumName] extends {
  Values: infer V;
} ? V : never; 
