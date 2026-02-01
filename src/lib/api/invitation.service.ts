import apiClient from './client';

export interface Invitation {
  id: string;
  organizationId: string;
  email?: string;
  phone?: string;
  role: 'MANAGER' | 'STAFF' | 'VIEWER';
  branchId?: string;
  invitedById: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedById?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
  invitedBy?: {
    id: string;
    name: string;
  };
  acceptedBy?: {
    id: string;
    name: string;
  };
}

interface InvitationResponse {
  success: boolean;
  data?: Invitation;
  message?: string;
  error?: string;
}

interface InvitationsResponse {
  success: boolean;
  data?: Invitation[];
  error?: string;
}

interface AcceptInvitationResponse {
  success: boolean;
  data?: {
    invitation: Invitation;
    membership: any;
  };
  error?: string;
}

export const invitationService = {
  /**
   * Create a new invitation
   */
  async createInvitation(data: {
    organizationId: string;
    email?: string;
    phone?: string;
    role: 'MANAGER' | 'STAFF' | 'VIEWER';
    branchId?: string;
    message?: string;
  }): Promise<InvitationResponse> {
    const response = await apiClient.post('/invitations', data);
    return response.data;
  },

  /**
   * Get current user's pending invitations
   */
  async getPendingInvitations(): Promise<InvitationsResponse> {
    const response = await apiClient.get('/invitations/pending');
    return response.data;
  },

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(orgId: string, status?: string): Promise<InvitationsResponse> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/invitations/organization/${orgId}${params}`);
    return response.data;
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string): Promise<AcceptInvitationResponse> {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string): Promise<InvitationResponse> {
    const response = await apiClient.post(`/invitations/${invitationId}/decline`);
    return response.data;
  },

  /**
   * Cancel/revoke an invitation (admin only)
   */
  async cancelInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/invitations/${invitationId}`);
    return response.data;
  },

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<InvitationResponse> {
    const response = await apiClient.post(`/invitations/${invitationId}/resend`);
    return response.data;
  },

  // ==================== TOKEN-BASED METHODS (for shareable links) ====================

  /**
   * Get invitation details by token (for shareable link preview)
   */
  async getInvitationByToken(token: string): Promise<{
    success: boolean;
    data?: {
      id: string;
      organization: { id: string; name: string };
      invitedBy: { id: string; name: string; email: string };
      role: string;
      branch?: { id: string; name: string } | null;
      expiresAt: string;
      message?: string;
    };
    error?: string;
  }> {
    const response = await apiClient.get(`/invitations/token/${token}`);
    return response.data;
  },

  /**
   * Accept invitation via shareable link token
   */
  async acceptInvitationByToken(token: string): Promise<{
    success: boolean;
    data?: {
      success: boolean;
      message: string;
      organization: { id: string; name: string };
    };
    error?: string;
  }> {
    const response = await apiClient.post(`/invitations/token/${token}/accept`);
    return response.data;
  }
};

export default invitationService;
