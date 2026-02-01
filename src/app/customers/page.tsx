"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Edit, PlusCircle, Search, Download, Send, Trash2,
  Clock, AlertCircle, Phone, MapPin, Users, IndianRupee,
  MessageSquare, MoreVertical, TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomerFormSheet from './CustomerFormSheet';
import { CustomerImport } from '@/components/CustomerImport';
import * as XLSX from 'xlsx';
import { format, parseISO, differenceInDays, isToday, isYesterday } from 'date-fns';
import { notificationsService } from '@/lib/api/services/notifications.service';
import { customerService } from '@/lib/api/services/customer.service';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CustomerStatus = 'active' | 'overdue' | 'new' | 'inactive';
type SortOption = 'name-asc' | 'name-desc' | 'balance-desc' | 'balance-asc' | 'recent' | 'oldest';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'
];

const getAvatarColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function CustomersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const { customers, expenses, refreshData, isLoadingCustomers } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [sendingBulk, setSendingBulk] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const customersWithDetails = useMemo(() => {
    if (!mounted) return [];
    return customers.map(customer => {
      const customerExpenses = expenses.filter(e => e.customerId === customer.id);
      const totalBilled = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPaid = customerExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
      const outstanding = totalBilled - totalPaid;
      const lastExpense = customerExpenses.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )[0];
      const lastActivity = lastExpense?.lastUpdated || customer.createdAt;
      const daysSinceActivity = differenceInDays(new Date(), parseISO(lastActivity));
      const createdDaysAgo = differenceInDays(new Date(), parseISO(customer.createdAt));
      
      let status: CustomerStatus;
      if (createdDaysAgo <= 7) status = 'new';
      else if (outstanding > 0 && daysSinceActivity > 30) status = 'overdue';
      else if (daysSinceActivity > 60) status = 'inactive';
      else status = 'active';
      
      const unpaidMonths = customerExpenses.filter(e => !e.paid).length;
      return { ...customer, outstanding, totalBilled, totalPaid, lastActivity, daysSinceActivity, status, unpaidMonths };
    });
  }, [customers, expenses, mounted]);

  const filteredCustomers = useMemo(() => {
    let result = customersWithDetails.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
    switch (sortBy) {
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'balance-desc': result.sort((a, b) => b.outstanding - a.outstanding); break;
      case 'balance-asc': result.sort((a, b) => a.outstanding - b.outstanding); break;
      case 'recent': result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()); break;
      case 'oldest': result.sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()); break;
    }
    return result;
  }, [customersWithDetails, searchTerm, sortBy, statusFilter]);

  const stats = useMemo(() => ({
    totalOutstanding: customersWithDetails.reduce((sum, c) => sum + c.outstanding, 0),
    overdueCount: customersWithDetails.filter(c => c.status === 'overdue').length,
    newCount: customersWithDetails.filter(c => c.status === 'new').length,
  }), [customersWithDetails]);

  const formatRelativeTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    const days = differenceInDays(new Date(), date);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return format(date, 'MMM d');
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">New</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      default: return null;
    }
  };

  const handleAddCustomer = () => { setEditingCustomer(null); setIsSheetOpen(true); };
  const handleEditCustomer = (customerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); setEditingCustomer(customerId); setIsSheetOpen(true);
  };

  const handleDownloadAllCustomers = () => {
    const dataToExport = filteredCustomers.map(customer => ({
      'Name': customer.name, 'Phone': customer.phone || 'N/A', 'Address': customer.address || 'N/A',
      'Outstanding': customer.outstanding, 'Status': customer.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `customers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Downloaded", description: `Exported ${dataToExport.length} customers` });
  };

  const toggleSelectionMode = () => { setSelectionMode(!selectionMode); setDeleteMode(false); setSelectedCustomers(new Set()); };
  const toggleCustomerSelection = (customerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelection = new Set(selectedCustomers);
    newSelection.has(customerId) ? newSelection.delete(customerId) : newSelection.add(customerId);
    setSelectedCustomers(newSelection);
  };
  const selectAll = () => setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
  const deselectAll = () => setSelectedCustomers(new Set());

  const handleBulkSend = async (sendToAll = false) => {
    try {
      setSendingBulk(true);
      const result = await notificationsService.sendBulkNotifications({
        customerIds: sendToAll ? undefined : Array.from(selectedCustomers), sendToAll, method: 'sms'
      });
      setBulkResult(result); setShowBulkDialog(true);
      if (result.success) { setSelectedCustomers(new Set()); setSelectionMode(false); }
    } catch (err: any) {
      setBulkResult({ success: false, message: err.response?.data?.error || 'Failed' });
      setShowBulkDialog(true);
    } finally { setSendingBulk(false); }
  };

  const toggleDeleteMode = () => { setDeleteMode(!deleteMode); setSelectionMode(false); setSelectedCustomers(new Set()); };
  const handleDeleteSingle = (customer: { id: string; name: string }, e?: React.MouseEvent) => {
    e?.stopPropagation(); setCustomerToDelete(customer); setShowDeleteDialog(true);
  };

  const confirmDeleteSingle = async () => {
    if (!customerToDelete) return;
    try {
      setDeleting(true);
      await customerService.deleteCustomer(customerToDelete.id);
      toast({ title: "Deleted", description: `${customerToDelete.name} deleted` });
      await refreshData(); setShowDeleteDialog(false); setCustomerToDelete(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) return;
    try {
      setDeleting(true);
      const result = await customerService.bulkDeleteCustomers(Array.from(selectedCustomers));
      toast({ title: "Deleted", description: `Deleted ${result.deletedCount} customer(s)` });
      await refreshData(); setSelectedCustomers(new Set()); setDeleteMode(false); setShowDeleteDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const handleSendReminder = async (customerId: string, customerName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      // Find the most recent unpaid expense for this customer
      const unpaidExpense = expenses
        .filter(exp => exp.customerId === customerId && !exp.paid)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })[0];

      if (!unpaidExpense) {
        toast({ 
          title: "No Unpaid Bills", 
          description: `${customerName} has no unpaid expenses.`,
          variant: "destructive" 
        });
        return;
      }

      const result = await notificationsService.sendPaymentNotification(unpaidExpense.id, 'sms');
      if (result.success) {
        toast({ title: "Sent", description: `Reminder sent to ${customerName}` });
      } else {
        toast({ title: "Failed", description: result.message || "Failed to send reminder", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Failed to send reminder", variant: "destructive" });
    }
  };

  if (!mounted || isLoadingCustomers) {
    return <div className="space-y-6"><PageHeader title="Customers" description="Manage customers." /><CustomersSkeleton /></div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader title="Customers" description="Manage your customer records.">
          <div className="flex flex-wrap gap-2">
            {!selectionMode && !deleteMode ? (
              <>
                <Button onClick={handleAddCustomer}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                <CustomerImport onImportComplete={refreshData} />
                <Button onClick={handleDownloadAllCustomers} variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                <Button onClick={toggleSelectionMode} variant="outline"><Send className="mr-2 h-4 w-4" /> Bulk Send</Button>
                <Button onClick={toggleDeleteMode} variant="outline" className="text-red-600 hover:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
              </>
            ) : selectionMode ? (
              <>
                <Button onClick={() => handleBulkSend(false)} disabled={selectedCustomers.size === 0 || sendingBulk}>
                  <Send className="mr-2 h-4 w-4" /> {sendingBulk ? 'Sending...' : `Send to ${selectedCustomers.size}`}
                </Button>
                <Button onClick={toggleSelectionMode} variant="ghost">Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowDeleteDialog(true)} disabled={selectedCustomers.size === 0 || deleting} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete {selectedCustomers.size}
                </Button>
                <Button onClick={toggleDeleteMode} variant="ghost">Cancel</Button>
              </>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4"><div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{customers.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-orange-600">Rs. {stats.totalOutstanding.toFixed(0)}</p><p className="text-xs text-muted-foreground">Outstanding</p></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p><p className="text-xs text-muted-foreground">Follow-up</p></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{stats.newCount}</p><p className="text-xs text-muted-foreground">New</p></div>
          </div></Card>
        </div>

        {(selectionMode || deleteMode) && (
          <Alert className={deleteMode ? 'border-red-200 bg-red-50' : ''}>
            <AlertDescription className="flex items-center justify-between">
              <span className={deleteMode ? 'text-red-700' : ''}>{selectedCustomers.size} selected</span>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={selectAll}>Select All</Button>
                <Button size="sm" variant="outline" onClick={deselectAll}>Clear</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card><CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="balance-desc">Highest Balance</SelectItem>
                <SelectItem value="balance-asc">Lowest Balance</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent></Card>

        {filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer, index) => (
              <Card key={customer.id}
                className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-in fade-in slide-in-from-bottom-4 ${
                  selectedCustomers.has(customer.id) ? (deleteMode ? 'ring-2 ring-red-500 bg-red-50' : 'ring-2 ring-primary') : ''
                }`}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                onClick={() => (deleteMode || selectionMode) ? toggleCustomerSelection(customer.id) : router.push(`/customers/${customer.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className={`h-12 w-12 ${getAvatarColor(customer.id)}`}>
                      <AvatarFallback className="text-white font-semibold">{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{customer.name}</h3>
                        {getStatusBadge(customer.status)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" /><span>{customer.phone || 'No phone'}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    {(selectionMode || deleteMode) && (
                      <Checkbox checked={selectedCustomers.has(customer.id)} onClick={(e) => e.stopPropagation()}
                        className={deleteMode ? 'border-red-500 data-[state=checked]:bg-red-500' : ''} />
                    )}
                    {!selectionMode && !deleteMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleEditCustomer(customer.id, e)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          {customer.phone && <DropdownMenuItem onClick={(e) => handleSendReminder(customer.id, customer.name, e)}><Send className="h-4 w-4 mr-2" /> Remind</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={(e) => handleDeleteSingle({ id: customer.id, name: customer.name }, e)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className={`text-lg font-bold ${customer.outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>Rs. {customer.outstanding.toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /><span>{formatRelativeTime(customer.lastActivity)}</span></div>
                      {customer.unpaidMonths > 0 && <p className="text-xs text-orange-600">{customer.unpaidMonths} unpaid</p>}
                    </div>
                  </div>
                  {!selectionMode && !deleteMode && (
                    <div className="mt-3 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="default" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/customers/${customer.id}`); }}><Eye className="mr-1 h-3 w-3" /> View</Button>
                      {customer.phone && customer.outstanding > 0 && (
                        <Tooltip><TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={(e) => handleSendReminder(customer.id, customer.name, e)}><MessageSquare className="h-3 w-3" /></Button>
                        </TooltipTrigger><TooltipContent>Send reminder</TooltipContent></Tooltip>
                      )}
                      <Button variant="outline" size="sm" onClick={(e) => handleEditCustomer(customer.id, e)}><Edit className="h-3 w-3" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12"><div className="text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{searchTerm || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}</h3>
            <p className="text-muted-foreground mb-6">{searchTerm || statusFilter !== 'all' ? 'Try adjusting filters' : 'Add your first customer'}</p>
            {!searchTerm && statusFilter === 'all' && <Button onClick={handleAddCustomer}><PlusCircle className="mr-2 h-4 w-4" /> Add Customer</Button>}
          </div></Card>
        )}

        <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>{bulkResult?.success ? '✅ Sent' : '❌ Failed'}</AlertDialogTitle>
            <AlertDialogDescription>{bulkResult?.message}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogAction>Close</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle className="text-red-600">⚠️ Delete?</AlertDialogTitle>
            <AlertDialogDescription>{deleteMode ? `Delete ${selectedCustomers.size} customer(s)?` : `Delete ${customerToDelete?.name}?`} This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={deleteMode ? handleBulkDelete : confirmDeleteSingle} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <CustomerFormSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} customerId={editingCustomer} />
      </div>
    </TooltipProvider>
  );
}
