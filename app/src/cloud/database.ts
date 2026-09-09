export type Json = string | number | boolean | null | {[key:string]:Json|undefined} | Json[];
type Table<Row, Insert=Partial<Row>> = {Row:Row;Insert:Insert;Update:Partial<Insert>;Relationships:[]};
export type Database = { public: {
  Tables: {
    profiles: Table<{user_id:string;created_at:string;updated_at:string}>;
    planner_state: Table<{user_id:string;snapshot:Json;schema_version:number;revision:number;created_at:string;updated_at:string}>;
    consent_records: Table<{id:string;user_id:string;consent_version:string;acknowledged_at:string}, {user_id:string;consent_version:string}>;
    beta_feedback: Table<{id:string;user_id:string;category:string;message:string;app_version:string;origin:string;platform:string;browser:string;include_plan_details:boolean;detail_payload:Json;created_at:string}, {user_id:string;category:string;message:string;app_version:string;origin:string;platform:string;browser:string;include_plan_details:boolean;detail_payload:Json}>;
  };
  Views: {[key in never]:never};
  Functions: { beta_access: {Args:Record<string,never>;Returns:boolean}; accept_beta_invite: {Args:Record<string,never>;Returns:boolean} };
  Enums: {[key in never]:never}; CompositeTypes: {[key in never]:never};
}};
