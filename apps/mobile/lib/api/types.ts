// Mirrors apps/web/lib/api/types.ts — the backend's actual JSON response
// shape (snake_case, per services/backend/app/schemas/*). See that file's
// comment for why this isn't sourced from packages/types instead.

export interface ApiUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: "tenant" | "landlord" | "broker" | "admin";
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiAuthResponse {
  user: ApiUser;
  tokens: ApiTokens;
}

export interface ApiProperty {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  area_sqft: number;
  monthly_rent: number;
  status: "draft" | "listed" | "leased" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ApiTenantProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  business_type: string | null;
  created_at: string;
  updated_at: string;
}
