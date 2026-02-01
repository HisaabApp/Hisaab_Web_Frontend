import apiClient from './client';
import type {
  OrganizationResponse,
  OrganizationsResponse,
  BranchResponse,
  BranchesResponse,
  MemberResponse,
  MembersResponse,
  MessageResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateBranchRequest,
  UpdateBranchRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest
} from './organization.types';

// Organization endpoints
export const organizationService = {
  // Get all organizations for current user
  getUserOrganizations: async (): Promise<OrganizationsResponse> => {
    const response = await apiClient.get('/organizations');
    return response.data;
  },

  // Get single organization
  getOrganization: async (orgId: string): Promise<OrganizationResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}`);
    return response.data;
  },

  // Create new organization
  createOrganization: async (data: CreateOrganizationRequest): Promise<OrganizationResponse> => {
    const response = await apiClient.post('/organizations', data);
    return response.data;
  },

  // Update organization
  updateOrganization: async (orgId: string, data: UpdateOrganizationRequest): Promise<OrganizationResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}`, data);
    return response.data;
  },

  // Delete organization
  deleteOrganization: async (orgId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete(`/organizations/${orgId}`);
    return response.data;
  }
};

// Branch endpoints
export const branchService = {
  // Get all branches for an organization
  getBranches: async (orgId: string): Promise<BranchesResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/branches`);
    return response.data;
  },

  // Get single branch
  getBranch: async (orgId: string, branchId: string): Promise<BranchResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/branches/${branchId}`);
    return response.data;
  },

  // Create new branch
  createBranch: async (orgId: string, data: CreateBranchRequest): Promise<BranchResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/branches`, data);
    return response.data;
  },

  // Update branch
  updateBranch: async (orgId: string, branchId: string, data: UpdateBranchRequest): Promise<BranchResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}/branches/${branchId}`, data);
    return response.data;
  },

  // Delete branch
  deleteBranch: async (orgId: string, branchId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete(`/organizations/${orgId}/branches/${branchId}`);
    return response.data;
  }
};

// Member endpoints
export const memberService = {
  // Get all members for an organization
  getMembers: async (orgId: string): Promise<MembersResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/members`);
    return response.data;
  },

  // Get members for a specific branch
  getBranchMembers: async (orgId: string, branchId: string): Promise<MembersResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/branches/${branchId}/members`);
    return response.data;
  },

  // Invite member to organization
  inviteMember: async (orgId: string, data: {
    email?: string;
    phone?: string;
    role: string;
    branchId?: string;
  }): Promise<MemberResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/members/invite`, data);
    return response.data;
  },

  // Add member to organization/branch
  addMember: async (orgId: string, branchId: string, data: AddMemberRequest): Promise<MemberResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/branches/${branchId}/members`, data);
    return response.data;
  },

  // Update member role
  updateMember: async (orgId: string, memberId: string, data: {
    role?: string;
    branchId?: string | null;
  }): Promise<MemberResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}/members/${memberId}`, data);
    return response.data;
  },

  // Update member role (legacy)
  updateMemberRole: async (orgId: string, memberId: string, data: UpdateMemberRoleRequest): Promise<MemberResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}/members/${memberId}`, data);
    return response.data;
  },

  // Remove member from organization
  removeMember: async (orgId: string, memberId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete(`/organizations/${orgId}/members/${memberId}`);
    return response.data;
  }
};

// Export all services as a single object
export const organizationApi = {
  organization: organizationService,
  branch: branchService,
  member: memberService
};

export default organizationApi;
