import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, LogIn, LogOut, Users, Edit } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  shift_id: string | null;
  staff_id: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface StaffOption { id: string; full_name: string; }
interface ShiftOption { id: string; staff_id: string; site_name: string; date: string; start_time: string; end_time: string; }

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editClockInDate, setEditClockInDate] = useState('');
  const [editClockInTime, setEditClockInTime] = useState('');
  const [editClockOutDate, setEditClockOutDate] = useState('');
  const [editClockOutTime, setEditClockOutTime] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const timeOptions = Array.from({ length: 96 }, (_, index) => {
    const minutes = index * 15;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });

  const toLocalDate = (iso: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString('en-CA');
  };

  const toLocalTime = (iso: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const combineDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  const getDuration = () => {
    const start = combineDateTime(editClockInDate, editClockInTime);
    const end = combineDateTime(editClockOutDate, editClockOutTime);
    if (!start || !end) return null;
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 0) return null;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h ${String(remainder).padStart(2, '0')}m`;
  };

  const adjustTime = (type: 'in' | 'out', amount: number) => {
    const currentTime = type === 'in' ? editClockInTime : editClockOutTime;
    const currentDate = type === 'in' ? editClockInDate : editClockOutDate;
    if (!currentTime || !currentDate) return;
    const dateTime = combineDateTime(currentDate, currentTime);
    if (!dateTime) return;
    dateTime.setMinutes(dateTime.getMinutes() + amount);
    const updatedDate = dateTime.toLocaleDateString('en-CA');
    const updatedTime = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
    if (type === 'in') {
      setEditClockInDate(updatedDate);
      setEditClockInTime(updatedTime);
    } else {
      setEditClockOutDate(updatedDate);
      setEditClockOutTime(updatedTime);
    }
  };

  const setNow = (type: 'in' | 'out') => {
    const now = new Date();
    const dateValue = now.toLocaleDateString('en-CA');
    const timeValue = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (type === 'in') {
      setEditClockInDate(dateValue);
      setEditClockInTime(timeValue);
    } else {
      setEditClockOutDate(dateValue);
      setEditClockOutTime(timeValue);
    }
  };

  const fetchData = async () => {
    const [recRes, staffRes, shiftRes] = await Promise.all([
      supabase.from('attendance_records').select('*').order('created_at', { ascending: false }),
      supabase.from('staff').select('id, full_name').eq('status', 'active'),
      supabase.from('shifts').select('id, staff_id, site_name, date, start_time, end_time').eq('date', new Date().toISOString().split('T')[0]),
    ]);
    if (recRes.data) setRecords(recRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    if (shiftRes.data) setShifts(shiftRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const staffMap = useMemo(() => {
    const m: Record<string, string> = {};
    staff.forEach(s => { m[s.id] = s.full_name; });
    return m;
  }, [staff]);

  const handleClockIn = async () => {
    if (!selectedStaff) { toast({ title: 'Select a staff member', variant: 'destructive' }); return; }
    const todayShift = shifts.find(s => s.staff_id === selectedStaff);
    const { error } = await supabase.from('attendance_records').insert({
      user_id: user!.id,
      staff_id: selectedStaff,
      shift_id: todayShift?.id || null,
      clock_in: new Date().toISOString(),
      status: 'on_shift',
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `${staffMap[selectedStaff]} clocked in` });
    setSelectedStaff('');
    fetchData();
  };

  const handleClockOut = async (record: AttendanceRecord) => {
    const { error } = await supabase.from('attendance_records').update({
      clock_out: new Date().toISOString(),
      status: 'completed',
    }).eq('id', record.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `${staffMap[record.staff_id]} clocked out` });
    fetchData();
  };

  const openEditAttendance = (record: AttendanceRecord) => {
    setEditRecord(record);
    setEditClockInDate(toLocalDate(record.clock_in));
    setEditClockInTime(toLocalTime(record.clock_in));
    setEditClockOutDate(toLocalDate(record.clock_out));
    setEditClockOutTime(toLocalTime(record.clock_out));
    setEditDialogOpen(true);
  };

  const handleEditAttendance = async () => {
    if (!editRecord) return;
    const start = combineDateTime(editClockInDate, editClockInTime);
    const end = combineDateTime(editClockOutDate, editClockOutTime);
    if (start && end && end.getTime() < start.getTime()) {
      toast({ title: 'Invalid time range', description: 'Clock out must be after clock in.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('attendance_records').update({
      clock_in: start?.toISOString() ?? null,
      clock_out: end?.toISOString() ?? null,
      status: editRecord.status,
      notes: editRecord.notes,
    }).eq('id', editRecord.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Attendance updated' });
    setEditDialogOpen(false);
    setEditRecord(null);
    fetchData();
  };

  const onShift = records.filter(r => r.status === 'on_shift');
  const completed = records.filter(r => r.status === 'completed');
  const todayCompleted = completed.filter(r => r.clock_out && new Date(r.clock_out).toDateString() === new Date().toDateString());

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  };

  const calcHours = (cin: string | null, cout: string | null) => {
    if (!cin || !cout) return '—';
    const diff = (new Date(cout).getTime() - new Date(cin).getTime()) / 3600000;
    return diff.toFixed(1) + 'h';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold">Attendance</h1><p className="text-muted-foreground">Live shift tracking and clock in/out</p></div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">On Shift</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{onShift.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{todayCompleted.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Scheduled Shifts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shifts.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Staff</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{staff.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" /> Clock In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[300px]"><SelectValue placeholder="Select staff member" /></SelectTrigger>
              <SelectContent>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleClockIn}><LogIn className="mr-2 h-4 w-4" />Clock In</Button>
          </div>
        </CardContent>
      </Card>

      {onShift.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Currently On Shift</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {onShift.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    {(staffMap[r.staff_id] || '??').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium">{staffMap[r.staff_id] || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />In: {formatTime(r.clock_in)}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleClockOut(r)}>
                  <LogOut className="mr-2 h-4 w-4" />Clock Out
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : records.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No attendance records yet. Clock in your first staff member above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 50).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{staffMap[r.staff_id] || 'Unknown'}</TableCell>
                    <TableCell>{formatTime(r.clock_in)}</TableCell>
                    <TableCell>{formatTime(r.clock_out)}</TableCell>
                    <TableCell>{calcHours(r.clock_in, r.clock_out)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'on_shift' ? 'default' : r.status === 'completed' ? 'secondary' : 'destructive'}>
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditAttendance(r)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Input value={staffMap[editRecord.staff_id] || 'Unknown'} readOnly />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-sm shadow-slate-950/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Clock In</p>
                      <p className="text-xs text-slate-500">Set the shift start time</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setNow('in')}>Now</Button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={editClockInDate} onChange={(e) => setEditClockInDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select value={editClockInTime} onValueChange={(v) => setEditClockInTime(v)}>
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => adjustTime('in', -15)}>-15 min</Button>
                      <Button variant="secondary" onClick={() => adjustTime('in', 15)}>+15 min</Button>
                      <Button variant="secondary" onClick={() => adjustTime('in', -60)}>-1 hr</Button>
                      <Button variant="secondary" onClick={() => adjustTime('in', 60)}>+1 hr</Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-sm shadow-slate-950/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Clock Out</p>
                      <p className="text-xs text-slate-500">Set the shift end time</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setNow('out')}>Now</Button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={editClockOutDate} onChange={(e) => setEditClockOutDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select value={editClockOutTime} onValueChange={(v) => setEditClockOutTime(v)}>
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => adjustTime('out', -15)}>-15 min</Button>
                      <Button variant="secondary" onClick={() => adjustTime('out', 15)}>+15 min</Button>
                      <Button variant="secondary" onClick={() => adjustTime('out', -60)}>-1 hr</Button>
                      <Button variant="secondary" onClick={() => adjustTime('out', 60)}>+1 hr</Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-sm shadow-slate-950/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Duration</p>
                    <p className="text-xs text-slate-500">Updates instantly as you edit</p>
                  </div>
                  <div className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100">
                    {getDuration() ?? 'Invalid range'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editRecord.status} onValueChange={(v) => setEditRecord({ ...editRecord, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="on_shift">On Shift</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editRecord.notes || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, notes: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleEditAttendance} disabled={getDuration() === null}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
