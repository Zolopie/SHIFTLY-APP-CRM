import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, DollarSign, ArrowRight, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BrandLogo } from '@/components/BrandLogo';
import DashboardSkeleton from "@/components/DashboardSkeleton";

const COLORS = ['hsl(217, 91%, 60%)','hsl(142, 71%, 45%)','hsl(38, 92%, 50%)','hsl(280, 65%, 60%)','hsl(0, 72%, 51%)'];

export default function Dashboard() {
  const navigate = useNavigate();

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payRuns, setPayRuns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      setLoading(false);
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

  const weeklyHours = useMemo(() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* 💎 HERO */}
      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMouse({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }}
        className="relative rounded-3xl border border-blue-200/40 bg-blue-200/30 backdrop-blur-xl p-6 shadow-lg overflow-hidden"
      >

        {/* Glow follow */}
        <div
          className="pointer-events-none absolute w-72 h-72 rounded-full blur-3xl opacity-40"
          style={{
            left: mouse.x - 140,
            top: mouse.y - 140,
            background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)'
          }}
        />

        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_4s_linear_infinite]" />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">
            <BrandLogo />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-700/80">
                Shiftly
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Advanced Rostering and Payroll System
              </h1>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">

            <button onClick={() => navigate('/clients')}
              className="group rounded-2xl bg-white/60 backdrop-blur-md border px-4 py-4 hover:bg-white/80 transition">
              <p className="text-xs text-slate-600 uppercase">Active clients</p>
              <div className="mt-2 flex justify-between">
                <p className="text-xl font-semibold">{clients.length}</p>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </button>

            <button onClick={() => navigate('/rostering')}
              className="group rounded-2xl bg-white/60 backdrop-blur-md border px-4 py-4 hover:bg-white/80 transition">
              <p className="text-xs text-slate-600 uppercase">Upcoming shifts</p>
              <div className="mt-2 flex justify-between">
                <p className="text-xl font-semibold">{upcomingShifts.length}</p>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </button>

            <button onClick={() => navigate('/invoices')}
              className="group rounded-2xl bg-white/60 backdrop-blur-md border px-4 py-4 hover:bg-white/80 transition">
              <p className="text-xs text-slate-600 uppercase">Open invoices</p>
              <div className="mt-2 flex justify-between">
                <p className="text-xl font-semibold">{invoices.length}</p>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your workforce operations</p>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[{ label:"Staff",value:staff.length,icon:Users,route:"/staff",color:"bg-blue-500"},
        { label:"Clients",value:clients.length,icon:Building2,route:"/clients",color:"bg-emerald-500"},
        { label:"Shifts",value:todayShifts.length,icon:Calendar,route:"/rostering",color:"bg-amber-500"},
        { label:"On Shift",value:onShift.length,icon:Clock,route:"/attendance",color:"bg-violet-500"},
        { label:"Invoices",value:invoices.length,icon:DollarSign,route:"/invoices",color:"bg-rose-500"},
        { label:"Payroll",value:`$${totalPayroll.toLocaleString()}`,icon:DollarSign,route:"/payroll",color:"bg-indigo-500"}]
        .map((item,i)=>(
          <button key={i} onClick={()=>navigate(item.route)}>
            <Card className="relative bg-white border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition">
              <div className={`absolute top-0 left-0 h-1 w-full ${item.color} rounded-t-2xl`} />
              <CardHeader className="flex justify-between">
                <CardTitle className="text-sm text-slate-500">{item.label}</CardTitle>
                <item.icon className="text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Weekly Hours</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Staff by Role</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roleDistribution} dataKey="value">
                  {roleDistribution.map((_,i)=>(
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}