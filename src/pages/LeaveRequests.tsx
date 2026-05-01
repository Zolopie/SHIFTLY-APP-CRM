import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface LeaveRequest {
  id: string;
  staff_id: string;
  request_type: 'leave' | 'unavailability';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  staff?: { full_name: string };
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

export default function LeaveRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('staff');

  // Form states
  const [requestType, setRequestType] = useState<'leave' | 'unavailability'>('leave');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  useEffect(() => {
    fetchRequests();
    fetchStaff();
    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (data) setCurrentUserRole(data.role);
  };

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('leave_requests').select(`
      *,
      staff:staff_id (full_name)
    `);

    if (currentUserRole === 'staff') {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staff')
      .select('id, full_name, role')
      .eq('user_id', user.id);
    if (data) setStaff(data);
  };

  const submitRequest = async () => {
    if (!user || !startDate || !endDate) return;

    const { error } = await supabase.from('leave_requests').insert({
      user_id: user.id,
      staff_id: selectedStaffId || (await getStaffId()),
      request_type: requestType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      reason,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Leave request submitted successfully' });
      setIsDialogOpen(false);
      resetForm();
      fetchRequests();
    }
  };

  const adminSubmitRequest = async () => {
    if (!user || !startDate || !endDate || !selectedStaffId) return;

    const { error } = await supabase.from('leave_requests').insert({
      user_id: user.id,
      staff_id: selectedStaffId,
      request_type: requestType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      reason,
      submitted_by: user.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Leave request submitted on behalf of employee' });
      setIsAdminDialogOpen(false);
      resetForm();
      fetchRequests();
    }
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'denied') => {
    if (!user) return;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Request ${status}` });
      fetchRequests();
    }
  };

  const getStaffId = async (): Promise<string> => {
    const { data } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', user!.id)
      .single();
    return data?.id || '';
  };

  const resetForm = () => {
    setRequestType('leave');
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setSelectedStaffId('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave & Unavailability Requests</h1>
        <div className="space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Leave/Unavailability Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={requestType} onValueChange={(value: 'leave' | 'unavailability') => setRequestType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="unavailability">Unavailability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <Button onClick={submitRequest} className="w-full">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>

          {(currentUserRole === 'admin' || currentUserRole === 'manager') && (
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add for Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Request on Behalf of Employee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Employee</Label>
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={requestType} onValueChange={(value: 'leave' | 'unavailability') => setRequestType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leave">Leave</SelectItem>
                        <SelectItem value="unavailability">Unavailability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                  <Button onClick={adminSubmitRequest} className="w-full">Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {(currentUserRole === 'admin' || currentUserRole === 'manager') && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.staff?.full_name || 'Unknown'}</TableCell>
                  <TableCell className="capitalize">{request.request_type}</TableCell>
                  <TableCell>{format(new Date(request.start_date), 'PPP')}</TableCell>
                  <TableCell>{format(new Date(request.end_date), 'PPP')}</TableCell>
                  <TableCell>{request.reason || '-'}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  {(currentUserRole === 'admin' || currentUserRole === 'manager') && request.status === 'pending' && (
                    <TableCell>
                      <div className="space-x-2">
                        <Button size="sm" onClick={() => updateRequestStatus(request.id, 'approved')}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateRequestStatus(request.id, 'denied')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}