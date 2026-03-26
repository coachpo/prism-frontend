export interface Profile {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  is_editable: boolean;
  version: number;
  created_at: string;
  deleted_at: string | null;
  updated_at: string;
}

export interface ProfileCreate {
  name: string;
  description?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  description?: string | null;
}

export interface ProfileActivateRequest {
  expected_active_profile_id: number;
}
