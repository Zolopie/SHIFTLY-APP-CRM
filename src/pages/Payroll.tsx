import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Play, CheckCircle, Download, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface PayRun {
  id: string; period_start: string; period_end: string; status: string;
  total_gross: number; total_tax: number; total_super: number; total_net: number;
  notes: string | null; created_at: string;
}
interface Payslip {
  id: string; pay_run_id: string; staff_id: string; hours_worked: number;
  hourly_rate: number; overtime_hours: number; overtime_rate: number;
  gross_pay: number; tax_amount: number; super_amount: number; net_pay: number; status: string;
}
interface StaffMember { id: string; full_name: string; hourly_rate: number | null; }

const escapePdfText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r/g, '').replace(/\n/g, '\\n');

const buildPdfBlob = (lines: string[]) => {
  const contentLines = lines.map((line, index) => index === 0
    ? `BT /F1 12 Tf 72 760 Td (${escapePdfText(line)}) Tj\n`
    : `0 -18 Td (${escapePdfText(line)}) Tj\n`
  ).join('') + 'ET\n';

  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(contentLines);
  const contentLength = streamBytes.length;

  const objects = [
    '%PDF-1.1\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentLines}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];


  const offsets: number[] = [];
  let currentOffset = 0;
  for (const obj of objects) {
    offsets.push(currentOffset);
    currentOffset += encoder.encode(obj).length;
  }

  const xref = ['xref\n0 6\n0000000000 65535 f \n'];
  offsets.slice(1).forEach((offset) => {
    xref.push(`${offset.toString().padStart(10, '0')} 00000 n \n`);
  });

  const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref ${currentOffset}\n%%EOF`;
  const fileParts = [...objects, xref.join(''), trailer];
  return new Blob(fileParts, { type: 'application/pdf' });
};

const TAX_RATE = 0.325; // 32.5% marginal rate simplified
const SUPER_RATE = 0.115; // 11.5% super
const OVERTIME_MULTIPLIER = 1.5;

export default function Payroll() {
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRun, setViewRun] = useState<PayRun | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [includeTax, setIncludeTax] = useState(true);
  const [loading, setLoading] = useState(true);

  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [individualStartDate, setIndividualStartDate] = useState<string>('');
  const [individualEndDate, setIndividualEndDate] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    const [prRes, psRes, stRes] = await Promise.all([
      supabase.from('pay_runs').select('*').order('created_at', { ascending: false }),
      supabase.from('payslips').select('*'),
      supabase.from('staff').select('id, full_name, hourly_rate').eq('status', 'active'),
    ]);
    if (prRes.data) setPayRuns(prRes.data);
    if (psRes.data) setPayslips(psRes.data);
    if (stRes.data) setStaff(stRes.data);
    setLoading(false);
  };
const fmt = (n: number) =>
  '$' + Number(n).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  useEffect(() => { fetchData(); }, []);

  const staffMap = useMemo(() => {
    const m: Record<string, StaffMember> = {};
    staff.forEach(s => { m[s.id] = s; });
    return m;
  }, [staff]);

  const calculateStaffPayroll = (staffId: string, startDate?: string, endDate?: string) => {
    let staffSlips = payslips.filter(p => p.staff_id === staffId);

    // If date range is provided, filter payslips by pay run dates
    if (startDate && endDate) {
      const payRunIds = payRuns
        .filter(run => run.period_start >= startDate && run.period_end <= endDate)
        .map(run => run.id);
      staffSlips = staffSlips.filter(slip => payRunIds.includes(slip.pay_run_id));
    }

    let hours = 0;
    let gross = 0;
    let net = 0;

    staffSlips.forEach(s => {
      hours += Number(s.hours_worked) + Number(s.overtime_hours || 0);
      gross += Number(s.gross_pay);
      net += Number(s.net_pay);
    });

    return {
      hours: hours.toFixed(2),
      gross: gross.toFixed(2),
      net: net.toFixed(2),
    };
  };

  const handleCreatePayRun = async () => {
    if (!periodStart || !periodEnd) { toast({ title: 'Select period dates', variant: 'destructive' }); return; }

    // Fetch shifts in the period to calculate hours
    const { data: shifts } = await supabase.from('shifts').select('*')
      .gte('date', periodStart).lte('date', periodEnd);

    // Group hours by staff
    const staffHours: Record<string, number> = {};
    (shifts || []).forEach(s => {
      const start = new Date(`2000-01-01T${s.start_time}`);
      const end = new Date(`2000-01-01T${s.end_time}`);
      let hours = (end.getTime() - start.getTime()) / 3600000;
      if (hours < 0) hours += 24;
      staffHours[s.staff_id] = (staffHours[s.staff_id] || 0) + hours;
    });

    // Create pay run
    const { data: payRun, error: prError } = await supabase.from('pay_runs').insert({
      user_id: user!.id, period_start: periodStart, period_end: periodEnd, status: 'draft',
    }).select().single();

    if (prError || !payRun) { toast({ title: 'Error', description: prError?.message, variant: 'destructive' }); return; }

    // Create payslips for each staff with hours
    const taxRate = includeTax ? TAX_RATE : 0;
    let totalGross = 0, totalTax = 0, totalSuper = 0, totalNet = 0;
    const slips: any[] = [];

    for (const s of staff) {
      const totalHrs = staffHours[s.id] || 0;
      if (totalHrs === 0) continue;
      const rate = s.hourly_rate || 30;
      const normalHrs = Math.min(totalHrs, 38);
      const otHrs = Math.max(0, totalHrs - 38);
      const otRate = rate * OVERTIME_MULTIPLIER;
      const gross = normalHrs * rate + otHrs * otRate;
      const tax = gross * taxRate;
      const superAmt = gross * SUPER_RATE;
      const net = gross - tax;

      totalGross += gross; totalTax += tax; totalSuper += superAmt; totalNet += net;

      slips.push({
        user_id: user!.id, pay_run_id: payRun.id, staff_id: s.id,
        hours_worked: normalHrs, hourly_rate: rate, overtime_hours: otHrs,
        overtime_rate: otRate, gross_pay: Math.round(gross * 100) / 100,
        tax_amount: Math.round(tax * 100) / 100, super_amount: Math.round(superAmt * 100) / 100,
        net_pay: Math.round(net * 100) / 100, status: 'draft',
      });
    }

    if (slips.length > 0) {
      await supabase.from('payslips').insert(slips);
    }

    await supabase.from('pay_runs').update({
      total_gross: Math.round(totalGross * 100) / 100,
      total_tax: Math.round(totalTax * 100) / 100,
      total_super: Math.round(totalSuper * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
    }).eq('id', payRun.id);

    toast({ title: 'Pay run created', description: `${slips.length} payslips generated` });
    setDialogOpen(false);
    setPeriodStart(''); setPeriodEnd('');
    fetchData();
  };

  const handleMarkPaid = async (run: PayRun) => {
    await supabase.from('pay_runs').update({ status: 'completed' }).eq('id', run.id);
    await supabase.from('payslips').update({ status: 'paid' }).eq('pay_run_id', run.id);
    toast({ title: 'Pay run marked as completed' });
    fetchData();
  };

  const handleDeleteRun = async (id: string) => {
    if (!confirm('Delete this pay run and all payslips?')) return;
    await supabase.from('pay_runs').delete().eq('id', id);
    toast({ title: 'Pay run deleted' });
    fetchData();
  };

  const handlePayStaff = async (slip: Payslip) => {
    if (slip.status === 'paid') {
      toast({ title: 'Already paid', description: 'This payslip is already marked as paid.' });
      return;
    }

    const { error } = await supabase.from('payslips').update({ status: 'paid' }).eq('id', slip.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Paid to bank', description: `${staffMap[slip.staff_id]?.full_name || 'Staff'} has been paid.` });
    fetchData();
  };

  const downloadPayslipPdf = (slip: Payslip) => {
    const owner = staffMap[slip.staff_id];
    const lines = [
      `Weekly Payslip for ${owner?.full_name || 'Unknown'}`,
      `Pay period: ${payRuns.find((run) => run.id === slip.pay_run_id)?.period_start || ''} to ${payRuns.find((run) => run.id === slip.pay_run_id)?.period_end || ''}`,
      `Hours worked: ${slip.hours_worked}h`,
      `Hourly rate: ${fmt(slip.hourly_rate)}`,
      `Overtime hours: ${slip.overtime_hours}h`,
      `Gross pay: ${fmt(slip.gross_pay)}`,
      `Tax: ${fmt(slip.tax_amount)}`,
      `Super: ${fmt(slip.super_amount)}`,
      `Net pay: ${fmt(slip.net_pay)}`,
      `Status: ${slip.status}`,
    ];
    const blob = buildPdfBlob(lines);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `payslip-${owner?.full_name?.replace(/\s+/g, '_') || 'staff'}-${slip.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (run: PayRun) => {
    const runSlips = payslips.filter(p => p.pay_run_id === run.id);
    const rows = [['Staff', 'Hours', 'Rate', 'OT Hours', 'OT Rate', 'Gross', 'Tax', 'Super', 'Net'].join(',')];
    runSlips.forEach(s => {
      rows.push([staffMap[s.staff_id]?.full_name || 'Unknown', s.hours_worked, s.hourly_rate, s.overtime_hours, s.overtime_rate, s.gross_pay, s.tax_amount, s.super_amount, s.net_pay].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payrun-${run.period_start}-${run.period_end}.csv`; a.click();
  };

  const downloadIndividualPayslipPdf = () => {
    if (!selectedStaffId || !individualStartDate || !individualEndDate) return;

    const staffMember = staffMap[selectedStaffId];
    const payroll = calculateStaffPayroll(selectedStaffId, individualStartDate, individualEndDate);

    const lines = [
      `Individual Payslip - ${staffMember?.full_name || 'Unknown'}`,
      `Pay Period: ${individualStartDate} to ${individualEndDate}`,
      `Total Hours Worked: ${payroll.hours} hours`,
      `Gross Pay: $${payroll.gross}`,
      `Net Pay: $${payroll.net}`,
      `Generated on: ${new Date().toLocaleDateString()}`,
    ];

    const blob = buildPdfBlob(lines);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `individual-payslip-${staffMember?.full_name?.replace(/\s+/g, '_') || 'staff'}-${individualStartDate}-to-${individualEndDate}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
const runSlips = viewRun
  ? payslips.filter(p => p.pay_run_id === viewRun.id)
  : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Payroll</h1><p className="text-muted-foreground">Manage pay runs, tax, super and payslips</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><DollarSign className="mr-2 h-4 w-4" />Run Payroll</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Pay Run</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Period Start</Label><Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>Period End</Label><Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></div>
              <div className="flex items-center justify-between rounded-2xl border border-input p-3">
                <div>
                  <p className="text-sm font-medium">Include tax</p>
                  <p className="text-xs text-muted-foreground">Toggle whether this pay run calculates PAYG tax.</p>
                </div>
                <Switch checked={includeTax} onCheckedChange={(checked) => setIncludeTax(Boolean(checked))} />
              </div>
              <p className="text-sm text-muted-foreground">Calculates hours from rostered shifts. Tax: {(includeTax ? (TAX_RATE*100).toFixed(0) + '%' : 'Off')} | Super: {(SUPER_RATE*100).toFixed(1)}% | OT: {OVERTIME_MULTIPLIER}x after 38hrs</p>
              <Button onClick={handleCreatePayRun} className="w-full">Generate Pay Run</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pay Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{payRuns.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Gross</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(payRuns.reduce((a, r) => a + Number(r.total_gross), 0))}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Tax</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{fmt(payRuns.reduce((a, r) => a + Number(r.total_tax), 0))}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Super</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{fmt(payRuns.reduce((a, r) => a + Number(r.total_super), 0))}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Select Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={individualStartDate}
                  onChange={e => setIndividualStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={individualEndDate}
                  onChange={e => setIndividualEndDate(e.target.value)}
                />
              </div>
            </div>

            {selectedStaffId && individualStartDate && individualEndDate && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Hours Worked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {calculateStaffPayroll(selectedStaffId, individualStartDate, individualEndDate).hours} hours
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Gross Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${calculateStaffPayroll(selectedStaffId, individualStartDate, individualEndDate).gross}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Net Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${calculateStaffPayroll(selectedStaffId, individualStartDate, individualEndDate).net}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={downloadIndividualPayslipPdf}
                disabled={!selectedStaffId || !individualStartDate || !individualEndDate}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Payslip PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewRun ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payslips — {viewRun.period_start} to {viewRun.period_end}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setViewRun(null)}>Back</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead><TableHead>Hours</TableHead><TableHead>Rate</TableHead>
                  <TableHead>OT Hrs</TableHead><TableHead>Gross</TableHead><TableHead>Tax</TableHead>
                  <TableHead>Super</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runSlips.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link to={`/staff/${s.staff_id}`} className="text-blue-500 hover:underline">
                        {staffMap[s.staff_id]?.full_name || 'Unknown'}
                      </Link>
                    </TableCell>
                    <TableCell>{s.hours_worked}h</TableCell>
                    <TableCell>{fmt(s.hourly_rate)}</TableCell>
                    <TableCell>{Number(s.overtime_hours) > 0 ? `${s.overtime_hours}h` : '—'}</TableCell>
                    <TableCell>{fmt(s.gross_pay)}</TableCell>
                    <TableCell className="text-warning">{fmt(s.tax_amount)}</TableCell>
                    <TableCell className="text-success">{fmt(s.super_amount)}</TableCell>
                    <TableCell className="font-bold">{fmt(s.net_pay)}</TableCell>
                    <TableCell><Badge variant={s.status === 'paid' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => downloadPayslipPdf(s)}>PDF</Button>
                      <Button variant="secondary" size="sm" onClick={() => handlePayStaff(s)} disabled={s.status === 'paid'}>{s.status === 'paid' ? 'Paid' : 'Pay'}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Pay Runs</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : payRuns.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No pay runs yet. Create your first payroll above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Tax</TableHead>
                    <TableHead>Super</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payRuns.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.period_start} → {r.period_end}</TableCell>
                      <TableCell>{fmt(r.total_gross)}</TableCell>
                      <TableCell className="text-warning">{fmt(r.total_tax)}</TableCell>
                      <TableCell className="text-success">{fmt(r.total_super)}</TableCell>
                      <TableCell className="font-bold">{fmt(r.total_net)}</TableCell>
                      <TableCell><Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewRun(r)}><Eye className="h-4 w-4" /></Button>
                          {r.status === 'draft' && <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(r)}><CheckCircle className="h-4 w-4 text-success" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => exportCSV(r)}><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRun(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
