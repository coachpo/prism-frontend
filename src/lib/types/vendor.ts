export type ApiFamily = "openai" | "anthropic" | "gemini";

export interface Vendor {
  id: number;
  key: string;
  name: string;
  description: string | null;
  audit_enabled: boolean;
  audit_capture_bodies: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorCreate {
  key: string;
  name: string;
  description?: string | null;
}

export interface VendorUpdate {
  key?: string;
  name?: string;
  description?: string | null;
  audit_enabled?: boolean;
  audit_capture_bodies?: boolean;
}
