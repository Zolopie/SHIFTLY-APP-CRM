import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronLeft, ChevronRight, Edit, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Shift {
  id: string;
  staff_id: string;
  staff_name?: string;
  site_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface LeaveRequest {
  id: string;
  staff_id: string;
  request_type: 'leave' | 'unavailability';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  staff?: { full_name: string };
}

interface StaffOption {
  id: string;
  full_name: string;
}

interface EditShift extends Shift {
  site_id: string;
}

const possibleShiftNotes = ['Routine patrol', 'VIP site check', 'Supply delivery', 'Site handover', 'Weekend support'];
const possibleStartTimes = ['06:00', '07:00', '08:00', '09:00', '14:00'];

export default function Rostering() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShift, setNewShift] = useState({ staff_id: '', site_id: '', date: '', start_time: '07:00', end_time: '15:00', notes: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editShift, setEditShift] = useState<EditShift | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyStaffId, setCopyStaffId] = useState('');
  const [copyWeeks, setCopyWeeks] = useState(1);
  const updateLeaveRequestStatus = async (id: string, status: 'approved' | 'denied') => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request) return;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Request ${status}` });
      if (status === 'approved') {
        // Auto remove shifts during leave period
        const { error: shiftError } = await supabase
          .from('shifts')
          .delete()
          .eq('staff_id', request.staff_id)
          .gte('date', request.start_date)
          .lte('date', request.end_date);
        if (shiftError) {
          toast({ title: 'Warning', description: 'Leave approved but failed to remove shifts automatically', variant: 'destructive' });
        } else {
          toast({ title: 'Auto-scheduled', description: 'Shifts during leave period have been removed' });
        }
      }
      fetchData();
    }
  };

  const fetchData = async () => {
    const [shiftsRes, staffRes, sitesRes, leaveRes] = await Promise.all([
      supabase.from('shifts').select('*').order('date'),
      supabase.from('staff').select('id, full_name').eq('status', 'active'),
      supabase.from('clients').select('id, company_name, contact_name'),
      supabase.from('leave_requests').select(`
        *,
        staff:staff_id (full_name)
      `).eq('status', 'approved'),
    ]);
    if (shiftsRes.data) setShifts(shiftsRes.data);
    if (staffRes.data) setStaffOptions(staffRes.data);
    if (sitesRes.data) setSiteOptions(sitesRes.data);
    if (leaveRes.data) setLeaveRequests(leaveRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const staffMap = useMemo(() => {
    const map: Record<string, string> = {};
    staffOptions.forEach((s) => { map[s.id] = s.full_name; });
    return map;
  }, [staffOptions]);

  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatDay = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const getRandomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

  const handleGenerateRandomShifts = async () => {
    if (!staffOptions.length) {
      toast({ title: 'Add staff first', description: 'Create staff members before generating shifts.', variant: 'destructive' });
      return;
    }

    const dates = weekDates.map(formatDate);
    const generated = staffOptions.slice(0, Math.min(6, staffOptions.length)).map((staff) => {
      const start = getRandomItem(possibleStartTimes);
      const [hour, minute] = start.split(':').map(Number);
      const duration = getRandomItem([7, 8, 9, 10]);
      const endHour = (hour + duration) % 24;
      const end = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return {
        staff_id: staff.id,
        site_name: getRandomItem(possibleShiftSites),
        date: getRandomItem(dates),
        start_time: start,
        end_time: end,
        notes: getRandomItem(possibleShiftNotes),
        status: 'scheduled',
        user_id: user?.id,
      };
    });

    const { error } = await supabase.from('shifts').insert(generated);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Random shifts generated' });
    fetchData();
  };

  const handleCopyShifts = async () => {
    if (!copyStaffId) {
      toast({ title: 'Select staff', description: 'Choose a staff member to copy shifts for.', variant: 'destructive' });
      return;
    }

    const currentWeekDates = weekDates.map(formatDate);
    const staffShifts = shifts.filter((shift) => shift.staff_id === copyStaffId && currentWeekDates.includes(shift.date));

    if (!staffShifts.length) {
      toast({ title: 'No shifts found', description: 'This staff member has no shifts in the current week.', variant: 'destructive' });
      return;
    }

    const copies = [];
    for (let weekIndex = 1; weekIndex <= copyWeeks; weekIndex += 1) {
      staffShifts.forEach((shift) => {
        const sourceDate = new Date(shift.date);
        const targetDate = new Date(sourceDate);
        targetDate.setDate(sourceDate.getDate() + weekIndex * 7);
        copies.push({
          staff_id: shift.staff_id,
          site_name: shift.site_name,
          date: formatDate(targetDate),
          start_time: shift.start_time,
          end_time: shift.end_time,
          notes: shift.notes,
          status: shift.status,
          user_id: user?.id,
        });
      });
    }

    if (!copies.length) {
      toast({ title: 'Nothing to copy', description: 'No shifts copied for the requested range.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('shifts').insert(copies);
    if (error) {
      toast({ title: 'Error copying shifts', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Shifts copied', description: `Copied shifts for ${copyWeeks} week(s) ahead.`, variant: 'success' });
    setCopyDialogOpen(false);
    setCopyStaffId('');
    setCopyWeeks(1);
    fetchData();
  };

  const handleAddShift = async () => {
    if (!newShift.staff_id || !newShift.date || !newShift.site_id) {
      toast({ title: 'Error', description: 'Staff, date and site are required', variant: 'destructive' });
      return;
    }
    const site = siteOptions.find(s => s.id === newShift.site_id);
    if (!site) {
      toast({ title: 'Error', description: 'Selected site not found', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('shifts').insert({
      staff_id: newShift.staff_id,
      site_name: site.company_name,
      date: newShift.date,
      start_time: newShift.start_time,
      end_time: newShift.end_time,
      notes: newShift.notes,
      user_id: user?.id,
      status: 'scheduled',
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Shift added' });
      setDialogOpen(false);
      setNewShift({ staff_id: '', site_id: '', date: '', start_time: '07:00', end_time: '15:00', notes: '' });
      fetchData();
    }
  };

  const handleEditShift = async () => {
    if (!editShift) return;
    const site = siteOptions.find(s => s.id === editShift.site_id);
    if (!site) {
      toast({ title: 'Error', description: 'Selected site not found', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('shifts').update({
      staff_id: editShift.staff_id,
      site_name: site.company_name,
      date: editShift.date,
      start_time: editShift.start_time,
      end_time: editShift.end_time,
      notes: editShift.notes,
    }).eq('id', editShift.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Shift updated' });
      setEditDialogOpen(false);
      setEditShift(null);
      fetchData();
    }
  };

  const openEditDialog = (shift: Shift) => {
    const site = siteOptions.find(s => s.company_name === shift.site_name);
    setEditShift({ ...shift, site_id: site?.id || '' });
    setEditDialogOpen(true);
  };

  const handleDeleteShift = async (id: string) => {
    await supabase.from('shifts').delete().eq('id', id);
    toast({ title: 'Shift deleted' });
    fetchData();
  };

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const getShiftsForDate = (date: string) => shifts.filter((s) => s.date === date);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rostering</h1>
          <p className="text-muted-foreground">Manage shift schedules and leave requests</p>
        </div>
      </div>
      <Tabs defaultValue="shifts" className="w-full">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {weekDates[0].toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })} – {weekDates[6].toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={newShift.staff_id} onValueChange={(v) => setNewShift({ ...newShift, staff_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staffOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site</Label>
                  <Select value={newShift.site_id} onValueChange={(v) => setNewShift({ ...newShift, site_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      {siteOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newShift.date} onChange={(e) => setNewShift({ ...newShift, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={newShift.notes || ''} onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })} />
                </div>
                <Button onClick={handleAddShift} className="w-full">Add Shift</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Shift</DialogTitle></DialogHeader>
              {editShift && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <Select value={editShift.staff_id} onValueChange={(v) => setEditShift({ ...editShift, staff_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>
                        {staffOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Select value={editShift.site_id} onValueChange={(v) => setEditShift({ ...editShift, site_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {siteOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={editShift.date} onChange={(e) => setEditShift({ ...editShift, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" value={editShift.start_time} onChange={(e) => setEditShift({ ...editShift, start_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" value={editShift.end_time} onChange={(e) => setEditShift({ ...editShift, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={editShift.notes || ''} onChange={(e) => setEditShift({ ...editShift, notes: e.target.value })} />
                  </div>
                  <Button onClick={handleEditShift} className="w-full">Update Shift</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Copy Shifts</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Copy Weekly Shifts</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={copyStaffId} onValueChange={(v) => setCopyStaffId(v)}>
                    <SelectTrigger><SelectValue placeholder="Select staff with shifts" /></SelectTrigger>
                    <SelectContent>
                      {staffOptions
                        .filter((s) => shifts.some((shift) => shift.staff_id === s.id && weekDates.map(formatDate).includes(shift.date)))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Copy over weeks</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={copyWeeks}
                    onChange={(e) => setCopyWeeks(Number(e.target.value) || 1)}
                  />
                </div>
                <Button onClick={handleCopyShifts} className="w-full">Copy to future weeks</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const dayShifts = getShiftsForDate(dateStr);
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <Card key={dateStr} className={`min-h-[200px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="p-3 pb-1">
                <CardTitle className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatDay(date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {dayShifts.map((shift) => (
                  <div key={shift.id} className="group relative rounded-md bg-primary/10 p-2 text-xs cursor-pointer hover:bg-primary/20 transition-colors">
                    <div className="font-medium truncate">{staffMap[shift.staff_id] || 'Unknown'}</div>
                    <div className="text-muted-foreground">{shift.start_time}–{shift.end_time}</div>
                    <div className="text-muted-foreground truncate">{shift.site_name}</div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={() => openEditDialog(shift)}
                        className="text-primary text-xs transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-destructive text-xs transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {dayShifts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No shifts</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{request.staff?.full_name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{request.request_type}</div>
                      <div className="text-sm">{request.start_date} to {request.end_date}</div>
                      {request.reason && <div className="text-sm italic">{request.reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={request.status === 'approved' ? 'default' : request.status === 'denied' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                      {request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => updateLeaveRequestStatus(request.id, 'approved')}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateLeaveRequestStatus(request.id, 'denied')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <p className="text-center text-muted-foreground">No leave requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
