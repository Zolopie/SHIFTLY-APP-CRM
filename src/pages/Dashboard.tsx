import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ProfileMenu from "@/components/ProfileMenu";
import { BrandLogo } from '@/components/BrandLogo';
const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payRuns, setPayRuns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [stRes, shRes, atRes, prRes, clRes, invRes] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('shifts').select('*'),
        supabase.from('attendance_records').select('*'),
        supabase.from('pay_runs').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('invoices').select('*'),
      ]);
      if (stRes.data) setStaff(stRes.data);
      if (shRes.data) setShifts(shRes.data);
      if (atRes.data) setAttendance(atRes.data);
      if (prRes.data) setPayRuns(prRes.data);
      if (clRes.data) setClients(clRes.data);
      if (invRes.data) setInvoices(invRes.data);
    };
    fetch();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === today);
  const onShift = attendance.filter(a => a.status === 'on_shift');
  const upcomingShifts = shifts.filter((s) => {
    const shiftDate = new Date(s.date);
    const todayDate = new Date(today);
    const diff = (shiftDate.getTime() - todayDate.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  });
  const totalPayroll = payRuns.reduce((a, r) => a + Number(r.total_gross), 0);

  // Weekly hours from shifts
  const weeklyHours = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    return days.map((day, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayShifts = shifts.filter(s => s.date === dateStr);
      let hours = 0;
      dayShifts.forEach(s => {
        const start = new Date(`2000-01-01T${s.start_time}`);
        const end = new Date(`2000-01-01T${s.end_time}`);
        let h = (end.getTime() - start.getTime()) / 3600000;
        if (h < 0) h += 24;
        hours += h;
      });
      return { day, hours: Math.round(hours * 10) / 10 };
    });
  }, [shifts]);

  const roleCounts: Record<string, number> = {};
  staff.forEach(s => { roleCounts[s.role] = (roleCounts[s.role] || 0) + 1; });
  const roleDistribution = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-slate-100 to-white p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <BrandLogo />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Shiftly</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Advanced Rostering and Payroll System</h1>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => navigate('/clients')}
                className="group cursor-pointer rounded-2xl bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-slate-900/80 active:scale-95"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Active clients</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{clients.length}</p>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 dark:text-slate-600" />
                </div>
              </button>
              <button
                onClick={() => navigate('/rostering')}
                className="group cursor-pointer rounded-2xl bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-slate-900/80 active:scale-95"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upcoming shifts</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{upcomingShifts.length}</p>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 dark:text-slate-600" />
                </div>
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className="group cursor-pointer rounded-2xl bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-slate-900/80 active:scale-95"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Open invoices</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{invoices.length}</p>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 dark:text-slate-600" />
                </div>
              </button>
            </div>
          </div>
        </div>
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Overview of your workforce operations</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate('/staff')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{staff.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{staff.filter(s => s.status === 'active').length} active</p>
            </CardContent>
          </Card>
        </button>
        <button
          onClick={() => navigate('/clients')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{clients.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Managed accounts</p>
            </CardContent>
          </Card>
        </button>
        <button
          onClick={() => navigate('/rostering')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Shifts Today</CardTitle>
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{todayShifts.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{shifts.length} total rostered</p>
            </CardContent>
          </Card>
        </button>
        <button
          onClick={() => navigate('/attendance')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">On Shift Now</CardTitle>
              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{onShift.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">via attendance tracking</p>
            </CardContent>
          </Card>
        </button>
        <button
          onClick={() => navigate('/invoices')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{invoices.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CRM finance pipeline</p>
            </CardContent>
          </Card>
        </button>
        <button
          onClick={() => navigate('/payroll')}
          className="group animate-slide-in cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Card className="h-full bg-white shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">${totalPayroll.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{payRuns.length} pay runs</p>
            </CardContent>
          </Card>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white shadow-sm dark:bg-slate-900/50">
          <CardHeader><CardTitle className="text-slate-900 dark:text-slate-50">Weekly Hours</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyHours}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="hours" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm dark:bg-slate-900/50">
          <CardHeader><CardTitle className="text-slate-900 dark:text-slate-50">Staff by Role</CardTitle></CardHeader>
          <CardContent>
            {roleDistribution.length === 0 ? <p className="text-center py-8 text-slate-500 dark:text-slate-400">Add staff to see distribution</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
