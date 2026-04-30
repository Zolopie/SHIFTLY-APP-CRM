import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

export default function Reports() {
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [payRuns, setPayRuns] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const [stRes, shRes, prRes, psRes, invRes, atRes] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('shifts').select('*'),
        supabase.from('pay_runs').select('*'),
        supabase.from('payslips').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('attendance_records').select('*'),
      ]);
      if (stRes.data) setStaff(stRes.data);
      if (shRes.data) setShifts(shRes.data);
      if (prRes.data) setPayRuns(prRes.data);
      if (psRes.data) setPayslips(psRes.data);
      if (invRes.data) setInvoices(invRes.data);
      if (atRes.data) setAttendance(atRes.data);
    };
    fetch();
  }, []);

  const staffMap = useMemo(() => {
    const m: Record<string, string> = {};
    staff.forEach(s => { m[s.id] = s.full_name; });
    return m;
  }, [staff]);

  // Filtered data
  const filteredShifts = shifts.filter(s => (!dateFrom || s.date >= dateFrom) && (!dateTo || s.date <= dateTo));

  // Staff hours
  const staffHours: Record<string, number> = {};
  filteredShifts.forEach(s => {
    const start = new Date(`2000-01-01T${s.start_time}`);
    const end = new Date(`2000-01-01T${s.end_time}`);
    let hours = (end.getTime() - start.getTime()) / 3600000;
    if (hours < 0) hours += 24;
    staffHours[s.staff_id] = (staffHours[s.staff_id] || 0) + hours;
  });

  const staffHoursData = Object.entries(staffHours).map(([id, hours]) => ({
    name: staffMap[id] || 'Unknown', hours: Math.round(hours * 10) / 10,
  })).sort((a, b) => b.hours - a.hours).slice(0, 15);

  // Role distribution
  const roleCounts: Record<string, number> = {};
  staff.forEach(s => { roleCounts[s.role] = (roleCounts[s.role] || 0) + 1; });
  const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

  // Payroll summary per run
  const payrollTrend = payRuns.map(r => ({
    period: r.period_start, gross: Number(r.total_gross), tax: Number(r.total_tax),
    super: Number(r.total_super), net: Number(r.total_net),
  }));

  // Invoice summary
  const invoiceByStatus: Record<string, number> = {};
  invoices.forEach(i => { invoiceByStatus[i.status] = (invoiceByStatus[i.status] || 0) + Number(i.total_amount); });
  const invoiceStatusData = Object.entries(invoiceByStatus).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const fmt = (n: number) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const totalHours = Object.values(staffHours).reduce((a, b) => a + b, 0);
  const totalPayroll = payRuns.reduce((a, r) => a + Number(r.total_gross), 0);
  const totalInvoiced = invoices.reduce((a, i) => a + Number(i.total_amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-muted-foreground">Analytics and operational reports</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Staff</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{staff.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Shifts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shifts.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Payroll</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(totalPayroll)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Invoiced</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(totalInvoiced)}</div></CardContent></Card>
      </div>

      <div className="flex gap-3 items-end">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[180px]" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[180px]" /></div>
        <Button variant="outline" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </div>

      <Tabs defaultValue="workforce">
        <TabsList>
          <TabsTrigger value="workforce"><Users className="h-4 w-4 mr-1" />Workforce</TabsTrigger>
          <TabsTrigger value="payroll"><DollarSign className="h-4 w-4 mr-1" />Payroll</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-1" />Invoices</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="h-4 w-4 mr-1" />Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="workforce" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Hours by Staff</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(staffHoursData, 'staff-hours.csv')}><Download className="h-4 w-4 mr-1" />CSV</Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffHoursData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="hours" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Staff by Role</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll Trend</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCSV(payrollTrend, 'payroll-trend.csv')}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {payrollTrend.length === 0 ? <p className="text-center py-8 text-muted-foreground">No payroll data yet</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={payrollTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="gross" fill="hsl(217, 91%, 60%)" name="Gross" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tax" fill="hsl(38, 92%, 50%)" name="Tax" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" fill="hsl(142, 71%, 45%)" name="Net" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payslip Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCSV(payslips.map(p => ({ staff: staffMap[p.staff_id] || 'Unknown', hours: p.hours_worked, gross: p.gross_pay, tax: p.tax_amount, super: p.super_amount, net: p.net_pay })), 'payslips.csv')}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Hours</TableHead><TableHead>Gross</TableHead><TableHead>Tax</TableHead><TableHead>Super</TableHead><TableHead>Net</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payslips.slice(0, 20).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{staffMap[p.staff_id] || 'Unknown'}</TableCell>
                      <TableCell>{p.hours_worked}h</TableCell>
                      <TableCell>{fmt(p.gross_pay)}</TableCell>
                      <TableCell className="text-warning">{fmt(p.tax_amount)}</TableCell>
                      <TableCell className="text-success">{fmt(p.super_amount)}</TableCell>
                      <TableCell className="font-bold">{fmt(p.net_pay)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue by Status</CardTitle></CardHeader>
              <CardContent>
                {invoiceStatusData.length === 0 ? <p className="text-center py-8 text-muted-foreground">No invoice data yet</p> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${fmt(value)}`}>
                        {invoiceStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoice List</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(invoices.map(i => ({ number: i.invoice_number, date: i.issue_date, due: i.due_date, total: i.total_amount, status: i.status })), 'invoices.csv')}>
                  <Download className="h-4 w-4 mr-1" />CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.slice(0, 10).map(i => (
                      <TableRow key={i.id}><TableCell>{i.invoice_number}</TableCell><TableCell>{i.issue_date}</TableCell><TableCell className="font-bold">{fmt(i.total_amount)}</TableCell><TableCell>{i.status}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance Records</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCSV(attendance.map(a => ({ staff: staffMap[a.staff_id] || 'Unknown', clock_in: a.clock_in, clock_out: a.clock_out, status: a.status })), 'attendance.csv')}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? <p className="text-center py-8 text-muted-foreground">No attendance data yet</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendance.slice(0, 20).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{staffMap[a.staff_id] || 'Unknown'}</TableCell>
                        <TableCell>{a.clock_in ? new Date(a.clock_in).toLocaleString('en-AU') : '—'}</TableCell>
                        <TableCell>{a.clock_out ? new Date(a.clock_out).toLocaleString('en-AU') : '—'}</TableCell>
                        <TableCell>{a.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
