import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ListChecks, User, ArrowRight } from 'lucide-react';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  site_assigned: string | null;
}
interface ShiftItem {
  id: string;
  staff_id: string;
  site_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}
interface AttendanceRecord {
  id: string;
  staff_id: string;
  shift_id: string | null;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
}

export default function GuardDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [guards, setGuards] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedGuard, setSelectedGuard] = useState('');
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    const [guardRes, shiftRes, attendanceRes] = await Promise.all([
      supabase.from('staff').select('id, full_name, role, site_assigned').eq('role', 'guard').eq('status', 'active'),
      supabase.from('shifts').select('*').gte('date', today).order('date', { ascending: true }),
      supabase.from('attendance_records').select('*').order('created_at', { ascending: false }),
    ]);

    if (guardRes.data) setGuards(guardRes.data);
    if (shiftRes.data) setShifts(shiftRes.data);
    if (attendanceRes.data) setAttendance(attendanceRes.data);
    if (!selectedGuard && guardRes.data?.length) {
      setSelectedGuard(guardRes.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [today]);

  const guardOptions = guards;
  const selectedGuardRecord = guardOptions.find((guard) => guard.id === selectedGuard);
  const guardShifts = shifts.filter((shift) => shift.staff_id === selectedGuard);
  const todayGuardsShifts = guardShifts.filter((shift) => shift.date === today);
  const activeAttendance = attendance.find((record) => record.staff_id === selectedGuard && record.status === 'on_shift');
  const completedAttendanceToday = attendance.filter(
    (record) => record.staff_id === selectedGuard && record.status === 'completed' && record.clock_out?.startsWith(today),
  );

  const upcomingShift = useMemo(() => {
    return guardShifts.find((shift) => shift.date >= today) ?? null;
  }, [guardShifts, today]);

  const handleClockIn = async () => {
    if (!selectedGuard) {
      toast({ title: 'Select a guard first', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('attendance_records').insert({
      user_id: user?.id,
      staff_id: selectedGuard,
      shift_id: todayGuardsShifts[0]?.id ?? null,
      clock_in: new Date().toISOString(),
      status: 'on_shift',
    });

    if (error) {
      toast({ title: 'Unable to clock in', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: `${selectedGuardRecord?.full_name ?? 'Guard'} clocked in` });
    setLoading(true);
    await fetchData();
  };

  const handleClockOut = async () => {
    if (!activeAttendance) {
      toast({ title: 'No guard currently on shift', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('attendance_records').update({
      clock_out: new Date().toISOString(),
      status: 'completed',
    }).eq('id', activeAttendance.id);

    if (error) {
      toast({ title: 'Unable to clock out', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: `${selectedGuardRecord?.full_name ?? 'Guard'} clocked out` });
    setLoading(true);
    await fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-slate-100 to-white p-5 shadow-sm dark:border-slate-800/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Mobile guard dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Guard summary</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">View assigned shifts, clock in / clock out, and live shift status from your mobile app.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Button variant="secondary" onClick={() => navigate('/attendance')}>
                Manage attendance <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/staff')}>
                Staff roster <User className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guard shift control</h1>
            <p className="text-muted-foreground">A concise guard view optimized for mobile.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedGuard} onValueChange={setSelectedGuard} className="w-full sm:w-[260px]">
              <SelectTrigger>
                <SelectValue placeholder="Select guard" />
              </SelectTrigger>
              <SelectContent>
                {guardOptions.map((guard) => (
                  <SelectItem key={guard.id} value={guard.id}>
                    {guard.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleClockIn} disabled={!selectedGuard || !!activeAttendance}>
              <Clock className="mr-2 h-4 w-4" />Clock In
            </Button>
            <Button variant="outline" onClick={handleClockOut} disabled={!activeAttendance}>
              <Clock className="mr-2 h-4 w-4" />Clock Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50"><ListChecks className="h-4 w-4" /> Assigned shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>{guardShifts.length} upcoming assignments</p>
              <p>{todayGuardsShifts.length} shifts today</p>
              <p>{activeAttendance ? 'Currently on shift' : 'Not on shift'}</p>
            </div>
            {upcomingShift ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Next assignment</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-slate-50">{upcomingShift.site_name}</p>
                <p className="text-muted-foreground">{upcomingShift.date} · {upcomingShift.start_time}–{upcomingShift.end_time}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No upcoming shift assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50"><Calendar className="h-4 w-4" /> Today&apos;s shift</CardTitle>
          </CardHeader>
          <CardContent>
            {todayGuardsShifts.length > 0 ? (
              todayGuardsShifts.map((shift) => (
                <div key={shift.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{shift.site_name}</p>
                  <p className="text-sm text-muted-foreground">{shift.start_time} – {shift.end_time}</p>
                  <Badge variant={shift.status === 'scheduled' ? 'secondary' : 'default'}>{shift.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No patrols scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50"><User className="h-4 w-4" /> Guard details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{selectedGuardRecord?.full_name ?? 'No guard selected'}</p>
              <p>{selectedGuardRecord?.site_assigned ?? 'No site assigned'}</p>
              <p>{selectedGuardRecord?.role === 'guard' ? 'Guard role' : 'Staff member'}</p>
              <p>{completedAttendanceToday.length} completed shifts today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50"><Clock className="h-4 w-4" /> Live status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">{activeAttendance ? 'Guard is currently on shift.' : 'Guard is not on shift.'}</p>
              {activeAttendance ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Clocked in at</p>
                  <p className="text-sm text-muted-foreground">{new Date(activeAttendance.clock_in || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50"><TrendingUp className="h-4 w-4" /> Shift summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>Upcoming guard shifts: {guardShifts.length}</p>
              <p>On shift now: {activeAttendance ? 1 : 0}</p>
              <p>Shift completions today: {completedAttendanceToday.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">Loading guard data...</div>}
    </div>
  );
}
