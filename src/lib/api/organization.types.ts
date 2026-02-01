// Organization types
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  branch?: Branch;
}

// API request types
export interface CreateOrganizationRequest {
  name: string;
  initialBranchName?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
}

export interface AddMemberRequest {
  email?: string;
  phone?: string;
  role: MemberRole;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

// API response types
export interface OrganizationResponse {
  success: boolean;
  data: Organization;
}

export interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
}

export interface BranchResponse {
  success: boolean;
  data: Branch;
}

export interface BranchesResponse {
  success: boolean;
  data: Branch[];
}

export interface MemberResponse {
  success: boolean;
  data: OrganizationMember;
}

export interface MembersResponse {
  success: boolean;
  data: OrganizationMember[];
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
