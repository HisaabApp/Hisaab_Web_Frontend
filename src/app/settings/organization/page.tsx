'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, Users, MapPin, Phone, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { organizationApi } from '@/lib/api/organization.service';
import { Branch, Organization, MemberRole } from '@/lib/api/organization.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePlanLimit } from '@/hooks/usePlanLimit';
import { usePlanLimitModal } from '@/contexts/PlanLimitContext';
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
import PageHeader from '@/components/PageHeader';

interface OrganizationMembership {
  membershipId: string;
  role: MemberRole;
  permissions: any;
  branch: Branch | null;
  organization: Organization & { 
    branches: Branch[];
    _count: { members: number; branches: number };
  };
  joinedAt: string;
}

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const { setSelectedBranch, setAvailableBranches, setSelectedOrganization, refreshBranches } = useBranch();
  const { toast } = useToast();
  const { canAddBranch } = usePlanLimit();
  const { showUpgradeModal } = usePlanLimitModal();
  
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<OrganizationMembership | null>(null);
  
  // Form states
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Organization creation states
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await organizationApi.organization.getUserOrganizations();
      
      if (response.success && response.data) {
        setMemberships(response.data as any);
        if (response.data.length > 0) {
          setSelectedMembership(response.data[0] as any);
        }
      }
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an organization name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsCreatingOrg(true);
      const response = await organizationApi.organization.createOrganization({
        name: orgName.trim()
      });

      if (response.success) {
        toast({
          title: 'Organization Created',
          description: `${orgName} has been created successfully`
        });
        setOrgName('');
        loadOrganizations();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!selectedMembership || !branchName.trim()) return;

    // Check plan limit before creating
    const limitCheck = await canAddBranch(selectedMembership.organization.id);
    if (!limitCheck.allowed) {
      // Close the branch dialog before showing upgrade modal
      setIsBranchDialogOpen(false);
      // Small delay to allow dialog to close before showing upgrade modal
      setTimeout(() => {
        showUpgradeModal({ 
          limitType: 'branches',
          message: limitCheck.message 
        });
      }, 100);
      return;
    }

    try {
      setIsCreatingBranch(true);
      const response = await organizationApi.branch.createBranch(
        selectedMembership.organization.id,
        {
          name: branchName.trim(),
          address: branchAddress.trim() || undefined,
          phone: branchPhone.trim() || undefined
        }
      );

      if (response.success) {
        toast({
          title: 'Branch Created',
          description: `${branchName} has been created successfully`
        });
        setBranchName('');
        setBranchAddress('');
        setBranchPhone('');
        setIsBranchDialogOpen(false); // Close dialog on success
        loadOrganizations();
        refreshBranches(); // Update branch selector
      }
    } catch (error: any) {
      // Check if it's a plan limit error from backend
      if (error.response?.data?.upgradeRequired) {
        // Close the branch dialog before showing upgrade modal
        setIsBranchDialogOpen(false);
        setTimeout(() => {
          showUpgradeModal({ 
            limitType: 'branches',
            message: error.response?.data?.message 
          });
        }, 100);
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create branch',
          variant: 'destructive'
        });
      }
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!selectedMembership || !editingBranch || !branchName.trim()) return;

    try {
      setIsEditingBranch(true);
      const response = await organizationApi.branch.updateBranch(
        selectedMembership.organization.id,
        editingBranch.id,
        {
          name: branchName.trim(),
          address: branchAddress.trim() || undefined,
          phone: branchPhone.trim() || undefined
        }
      );

      if (response.success) {
        toast({
          title: 'Branch Updated',
          description: `${branchName} has been updated successfully`
        });
        setEditingBranch(null);
        setBranchName('');
        setBranchAddress('');
        setBranchPhone('');
        loadOrganizations();
        refreshBranches(); // Update branch selector
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update branch',
        variant: 'destructive'
      });
    } finally {
      setIsEditingBranch(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedMembership || !deletingBranch) return;

    try {
      const response = await organizationApi.branch.deleteBranch(
        selectedMembership.organization.id,
        deletingBranch.id
      );

      if (response.success) {
        toast({
          title: 'Branch Deleted',
          description: `${deletingBranch.name} has been deleted`
        });
        setDeletingBranch(null);
        loadOrganizations();
        refreshBranches(); // Update branch selector
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete branch',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchAddress(branch.address || '');
    setBranchPhone(branch.phone || '');
  };

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500';
      case 'MANAGER': return 'bg-blue-500';
      case 'STAFF': return 'bg-green-500';
      case 'VIEWER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentOrg = selectedMembership?.organization;
  const branches = currentOrg?.branches || [];
  const isOwnerOrManager = selectedMembership?.role === 'OWNER' || selectedMembership?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization, branches, and team members"
      />

      {/* No Organization - Show Creation Form */}
      {memberships.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              You need to create an organization first to manage branches and team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  placeholder="e.g., Shiv Shambhu Dairy"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && orgName.trim()) {
                      handleCreateOrganization();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleCreateOrganization} 
                disabled={!orgName.trim() || isCreatingOrg}
              >
                {isCreatingOrg ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Info */}
      {currentOrg && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>{currentOrg.name}</CardTitle>
                  <CardDescription>
                    {currentOrg._count.branches} branches • {currentOrg._count.members} members
                  </CardDescription>
                </div>
              </div>
              <Badge className={getRoleBadgeColor(selectedMembership.role)}>
                {selectedMembership.role}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Branches Section - Only show if organization exists */}
      {currentOrg && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Branches</CardTitle>
                <CardDescription>
                  Manage your business locations
                </CardDescription>
              </div>
              
              {isOwnerOrManager && (
                <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                    <DialogDescription>
                      Add a new branch/location to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch-name">Branch Name *</Label>
                      <Input
                        id="branch-name"
                        placeholder="e.g., Downtown Store"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-address">Address</Label>
                      <Input
                        id="branch-address"
                        placeholder="e.g., 123 Main St, City"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-phone">Phone</Label>
                      <Input
                        id="branch-phone"
                        placeholder="e.g., +91 98765 43210"
                        value={branchPhone}
                        onChange={(e) => setBranchPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateBranch} 
                      disabled={!branchName.trim() || isCreatingBranch}
                    >
                      {isCreatingBranch ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Branch'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No branches found. Create your first branch to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <Card key={branch.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{branch.name}</h4>
                        {branch.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {branch.address}
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {branch.phone}
                          </div>
                        )}
                      </div>
                      
                      {isOwnerOrManager && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(branch)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {branches.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeletingBranch(branch)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Team Members Link - Only show if organization exists */}
      {currentOrg && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to your organization
                </CardDescription>
              </div>
              <Link href="/settings/organization/team">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Edit Branch Dialog */}
      <Dialog open={!!editingBranch} onOpenChange={(open) => !open && setEditingBranch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-branch-name">Branch Name *</Label>
              <Input
                id="edit-branch-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch-address">Address</Label>
              <Input
                id="edit-branch-address"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch-phone">Phone</Label>
              <Input
                id="edit-branch-phone"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBranch(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateBranch} 
              disabled={!branchName.trim() || isEditingBranch}
            >
              {isEditingBranch ? (
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

      {/* Delete Branch Confirmation */}
      <AlertDialog open={!!deletingBranch} onOpenChange={(open) => !open && setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBranch?.name}"? 
              This will remove all data associated with this branch including customers and expenses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteBranch}
            >
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">How Branches Work</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Each branch represents a separate business location</li>
            <li>• Customers and expenses are assigned to specific branches</li>
            <li>• Use "All Branches" in the selector to view combined data</li>
            <li>• Team members can be given access to specific branches</li>
            <li>• Roles: <strong>Owner</strong> (full access), <strong>Manager</strong> (can manage), <strong>Staff</strong> (can edit), <strong>Viewer</strong> (read-only)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
