'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Pencil, Trash2, UserPlus, Shield, 
  Loader2, ArrowLeft, Mail, Phone, Check, X, ChevronDown, Clock, RefreshCw, Send, Copy, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi } from '@/lib/api/organization.service';
import { invitationService, Invitation } from '@/lib/api/invitation.service';
import { MemberRole, OrganizationMember, Branch } from '@/lib/api/organization.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/PageHeader';

interface OrganizationWithDetails {
  id: string;
  name: string;
  branches: Branch[];
  _count: { members: number; branches: number };
}

interface MemberWithUser extends OrganizationMember {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    logo?: string;
  };
  branch?: Branch;
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberWithUser | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<Invitation | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithUser | null>(null);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('STAFF');
  const [inviteBranchId, setInviteBranchId] = useState<string>('all');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false);
  
  // Edit states
  const [editRole, setEditRole] = useState<MemberRole>('STAFF');
  const [editBranchId, setEditBranchId] = useState<string>('all');

  useEffect(() => {
    loadOrganizationAndMembers();
  }, []);

  const loadOrganizationAndMembers = async () => {
    try {
      setIsLoading(true);
      
      // First get user's organizations
      const orgsResponse = await organizationApi.organization.getUserOrganizations();
      
      if (orgsResponse.success && orgsResponse.data && orgsResponse.data.length > 0) {
        const membership = orgsResponse.data[0] as any;
        const org = membership.organization;
        setOrganization(org);
        
        // Then get members for this organization
        const membersResponse = await organizationApi.member.getMembers(org.id);
        
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data as any);
        }
        
        // Also get pending invitations
        const invitesResponse = await invitationService.getOrganizationInvitations(org.id, 'PENDING');
        
        if (invitesResponse.success && invitesResponse.data) {
          setPendingInvitations(invitesResponse.data);
        }
      }
    } catch (error: any) {
      console.error('Error loading team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!organization || (!inviteEmail.trim() && !invitePhone.trim())) return;

    try {
      setIsInviting(true);
      
      const response = await organizationApi.member.inviteMember(organization.id, {
        email: inviteEmail.trim() || undefined,
        phone: invitePhone.trim() || undefined,
        role: inviteRole,
        branchId: inviteBranchId !== 'all' ? inviteBranchId : undefined
      });

      if (response.success) {
        // Check if response contains an invite link
        const data = response.data as any;
        if (data?.inviteLink) {
          setInviteLink(data.inviteLink);
          setShowInviteLinkDialog(true);
        }
        
        toast({
          title: 'Invitation Sent',
          description: `Team member has been invited as ${inviteRole}${invitePhone.trim() ? ' (SMS notification sent)' : ''}`
        });
        setShowInviteDialog(false);
        resetInviteForm();
        loadOrganizationAndMembers();
      }
    } catch (error: any) {
      console.error('Invite error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to invite member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!organization || !editingMember) return;

    try {
      setIsUpdating(true);
      
      const response = await organizationApi.member.updateMember(
        organization.id,
        editingMember.id,
        {
          role: editRole,
          branchId: editBranchId !== 'all' ? editBranchId : null
        }
      );

      if (response.success) {
        toast({
          title: 'Member Updated',
          description: `Role updated to ${editRole}`
        });
        setEditingMember(null);
        loadOrganizationAndMembers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update member',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!organization || !deletingMember) return;

    try {
      const response = await organizationApi.member.removeMember(
        organization.id,
        deletingMember.id
      );

      if (response.success) {
        toast({
          title: 'Member Removed',
          description: `${deletingMember.user.name} has been removed from the team`
        });
        setDeletingMember(null);
        loadOrganizationAndMembers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInvitePhone('');
    setInviteRole('STAFF');
    setInviteBranchId('all');
    setInviteMessage('');
    // Note: Don't reset inviteLink here as it's used by the invite link dialog
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Link Copied!',
        description: 'Invitation link copied to clipboard'
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive'
      });
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancellingInvite) return;
    
    try {
      const response = await invitationService.cancelInvitation(cancellingInvite.id);
      if (response.success) {
        toast({
          title: 'Invitation Cancelled',
          description: 'The invitation has been cancelled'
        });
        setPendingInvitations(prev => prev.filter(i => i.id !== cancellingInvite.id));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to cancel invitation',
        variant: 'destructive'
      });
    } finally {
      setCancellingInvite(null);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const response = await invitationService.resendInvitation(invitation.id);
      if (response.success) {
        toast({
          title: 'Invitation Resent',
          description: 'The invitation has been resent'
        });
        loadOrganizationAndMembers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to resend invitation',
        variant: 'destructive'
      });
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return '<1h left';
  };

  const openEditDialog = (member: MemberWithUser) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditBranchId(member.branchId || 'all');
  };

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500 hover:bg-purple-600';
      case 'MANAGER': return 'bg-blue-500 hover:bg-blue-600';
      case 'STAFF': return 'bg-green-500 hover:bg-green-600';
      case 'VIEWER': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getRoleDescription = (role: MemberRole) => {
    switch (role) {
      case 'OWNER': return 'Full access to all features and settings';
      case 'MANAGER': return 'Can manage branches, team, and view all data';
      case 'STAFF': return 'Can add/edit customers, expenses, and view reports';
      case 'VIEWER': return 'Read-only access to data';
      default: return '';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const currentUserMembership = members.find(m => m.userId === user?.id);
  const isOwner = currentUserMembership?.role === 'OWNER';
  const isManager = currentUserMembership?.role === 'OWNER' || currentUserMembership?.role === 'MANAGER';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/organization">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Team Management"
          description="Manage team members and their access levels"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {members.filter(m => m.role === 'OWNER' || m.role === 'MANAGER').length}
            </div>
            <p className="text-sm text-muted-foreground">Managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pendingInvitations.length}</div>
            <p className="text-sm text-muted-foreground">Pending Invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{organization?.branches?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Branches</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Members and Invitations */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Send className="h-4 w-4" />
            Pending Invites ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People who have access to your organization
              </CardDescription>
            </div>
            
            {isManager && (
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="member@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-phone">Or Phone Number</Label>
                      <Input
                        id="invite-phone"
                        placeholder="+91 98765 43210"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isOwner && (
                            <SelectItem value="MANAGER">
                              <div className="flex flex-col items-start">
                                <span>Manager</span>
                                <span className="text-xs text-muted-foreground">Can manage team and settings</span>
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="STAFF">
                            <div className="flex flex-col items-start">
                              <span>Staff</span>
                              <span className="text-xs text-muted-foreground">Can add/edit data</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="VIEWER">
                            <div className="flex flex-col items-start">
                              <span>Viewer</span>
                              <span className="text-xs text-muted-foreground">Read-only access</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Access</Label>
                      <Select value={inviteBranchId} onValueChange={setInviteBranchId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {organization?.branches?.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select a specific branch or allow access to all branches
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInviteMember} 
                      disabled={(!inviteEmail.trim() && !invitePhone.trim()) || isInviting}
                    >
                      {isInviting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.user.logo} />
                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{member.user.name}</h4>
                      {member.userId === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {member.user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </span>
                      )}
                      {member.user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.user.phone}
                        </span>
                      )}
                    </div>
                    {member.branch && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Branch: {member.branch.name}
                      </div>
                    )}
                    {!member.branchId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Access: All Branches
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                  
                  {isManager && member.userId !== user?.id && member.role !== 'OWNER' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(member)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeletingMember(member)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Pending Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Invitations waiting to be accepted
                  </CardDescription>
                </div>
                {isManager && (
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No pending invitations</p>
                  <p className="text-sm">Invite team members to collaborate with you</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingInvitations.map((invite) => (
                    <div 
                      key={invite.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{invite.email || invite.phone}</h4>
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                              Pending
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Invited by {invite.invitedBy?.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeRemaining(invite.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(invite.role as MemberRole)}>
                          {invite.role}
                        </Badge>
                        
                        {isManager && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                // Copy invite link
                                const invLink = (invite as any).inviteLink;
                                if (invLink) {
                                  navigator.clipboard.writeText(invLink);
                                  toast({
                                    title: 'Link Copied!',
                                    description: 'Invitation link copied to clipboard'
                                  });
                                } else {
                                  // Generate link from token
                                  const link = `${window.location.origin}/invite/${invite.token}`;
                                  navigator.clipboard.writeText(link);
                                  toast({
                                    title: 'Link Copied!',
                                    description: 'Invitation link copied to clipboard'
                                  });
                                }
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Invite Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendInvitation(invite)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setCancellingInvite(invite)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Permissions Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(['OWNER', 'MANAGER', 'STAFF', 'VIEWER'] as MemberRole[]).map((role) => (
              <div key={role} className="space-y-2">
                <Badge className={getRoleBadgeColor(role)}>{role}</Badge>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(role)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog open={!!cancellingInvite} onOpenChange={(open) => !open && setCancellingInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to {cancellingInvite?.email || cancellingInvite?.phone}? 
              They will no longer be able to join your organization using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelInvitation}
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update {editingMember?.user.name}'s role and access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isOwner && <SelectItem value="MANAGER">Manager</SelectItem>}
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch Access</Label>
              <Select value={editBranchId} onValueChange={setEditBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {organization?.branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMember} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.user.name} from your organization? 
              They will lose access to all data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Link Dialog */}
      <Dialog 
        open={showInviteLinkDialog} 
        onOpenChange={(open) => {
          setShowInviteLinkDialog(open);
          if (!open) setInviteLink(null); // Clean up when dialog closes
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Shareable Invitation Link
            </DialogTitle>
            <DialogDescription>
              Share this link with the invitee. They can use it to accept the invitation directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteLink || ''}
                className="flex-1 text-sm font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> This link expires in 7 days. The invitee will need to 
                log in or create an account to accept.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowInviteLinkDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
