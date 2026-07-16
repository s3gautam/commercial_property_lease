export type UserRole = "tenant" | "landlord" | "broker" | "admin";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface TenantProfile {
  id: string;
  userId: string;
  companyName: string | null;
  businessType: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = "draft" | "listed" | "leased" | "archived";

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  areaSqft: number;
  monthlyRent: number;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

export type LeaseStatus = "draft" | "pending_signature" | "signed" | "terminated";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}
