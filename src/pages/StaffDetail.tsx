import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email: string;
  phone: string;
  hourly_rate: number | null;
  status: string;
  bank_details: string | null;
  created_at: string;
}

interface ShiftRecord {
  id: string;
  staff_id: string | null;
  site_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface AttendanceRecord {
  id: string;
  shift_id: string | null;
  staff_id: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  created_at: string;
}

interface Payslip {
  id: string;
  pay_run_id: string;
  staff_id: string;
  hours_worked: number;
  hourly_rate: number;
  overtime_hours: number;
  gross_pay: number;
  tax_amount: number;
  net_pay: number;
  status: string;
}

interface PayRun {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
}

const formatCurrency = (value: number) => '$' + Number(value).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatTime = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
};

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBankDetails, setEditingBankDetails] = useState('');
  const [editingHourlyRate, setEditingHourlyRate] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const isAdmin = Boolean(user);

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      setLoading(true);
      const [staffRes, shiftRes, attendanceRes, payslipRes, payRunRes] = await Promise.all([
        supabase.from('staff').select('*').eq('id', id).single(),
        supabase.from('shifts').select('*').eq('staff_id', id).order('date', { ascending: false }).limit(10),
        supabase.from('attendance_records').select('*').eq('staff_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('payslips').select('*').eq('staff_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('pay_runs').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      if (staffRes.error) {
        toast({ title: 'Error loading staff', description: staffRes.error.message, variant: 'destructive' });
        navigate('/staff');
        return;
      }
      setStaff(staffRes.data);
      setEditingBankDetails(staffRes.data?.bank_details ?? '');
      setEditingHourlyRate(staffRes.data?.hourly_rate ?? 0);
      if (shiftRes.data) setShifts(shiftRes.data as ShiftRecord[]);
      if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
      if (payslipRes.data) setPayslips(payslipRes.data as Payslip[]);
      if (payRunRes.data) setPayRuns(payRunRes.data as PayRun[]);
      setLoading(false);
    };
    fetchAll();
  }, [id, navigate, toast]);

  const totalHours = useMemo(() => attendance.reduce((sum, record) => {
    if (!record.clock_in || !record.clock_out) return sum;
    return sum + (new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 3600000;
  }, 0), [attendance]);

  const shiftsCompleted = attendance.filter((record) => record.status === 'completed').length;
  const missedCount = attendance.filter((record) => record.status === 'missed').length;
  const lateCount = attendance.filter((record) => record.status === 'late').length;

  const paySummary = useMemo(() => {
    const filtered = payslips;
    const gross = filtered.reduce((sum, slip) => sum + slip.gross_pay, 0);
    const tax = filtered.reduce((sum, slip) => sum + slip.tax_amount, 0);
    const net = filtered.reduce((sum, slip) => sum + slip.net_pay, 0);
    return { gross, tax, net, count: filtered.length };
  }, [payslips]);

  const defaultPayStatus = payslips.every((slip) => slip.status === 'paid') ? 'Paid' : 'Pending';

  const handleSaveProfile = async () => {
    if (!staff) return;
    setSaveLoading(true);
    const { error } = await supabase.from('staff').update({
      hourly_rate: editingHourlyRate,
      bank_details: editingBankDetails,
    }).eq('id', staff.id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff updated' });
      setStaff({ ...staff, hourly_rate: editingHourlyRate, bank_details: editingBankDetails });
    }
    setSaveLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Staff profile access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only admins can access detailed payroll and bank details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !staff) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading staff information…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{staff.full_name}</h1>
          <p className="text-muted-foreground">{staff.role} · {staff.status}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/staff')}>Back to staff</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{staff.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{staff.full_name}</p>
                  <p className="text-sm text-muted-foreground">{staff.role}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Phone</p>
                  <p>{staff.phone || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p>{staff.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Bank details</p>
                  <p>{staff.bank_details || 'No bank details on file'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payroll Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Hourly rate</p>
                  <p>{staff.hourly_rate ? formatCurrency(staff.hourly_rate) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Pay status</p>
                  <Badge variant={defaultPayStatus === 'Paid' ? 'default' : 'warning'}>{defaultPayStatus}</Badge>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total hours</p>
                  <p>{Math.round(totalHours * 10) / 10}h</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Gross pay</p>
                  <p>{formatCurrency(paySummary.gross)}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Deductions</p>
                  <p>{formatCurrency(paySummary.tax)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Net pay</p>
                  <p className="font-semibold">{formatCurrency(paySummary.net)}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Hourly Rate</Label>
                  <Input type="number" value={editingHourlyRate} onChange={(e) => setEditingHourlyRate(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Bank Details</Label>
                  <Input value={editingBankDetails} onChange={(e) => setEditingBankDetails(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saveLoading}>
                {saveLoading ? 'Saving…' : 'Save payroll details'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Work Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Shifts completed</p>
                  <p>{shiftsCompleted}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Attendance status</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={lateCount > 0 ? 'secondary' : 'default'}>Late {lateCount}</Badge>
                    <Badge variant={missedCount > 0 ? 'destructive' : 'default'}>Missed {missedCount}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Recent pay runs</p>
                  <p>{paySummary.count}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Recent shifts</p>
                {shifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent shifts recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {shifts.slice(0, 5).map((shift) => (
                      <div key={shift.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="font-medium">{shift.date} • {shift.site_name}</p>
                        <p className="text-sm text-muted-foreground">{shift.start_time} – {shift.end_time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 6).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.created_at.split('T')[0]}</TableCell>
                        <TableCell>{formatTime(record.clock_in)}</TableCell>
                        <TableCell>{formatTime(record.clock_out)}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'paid' ? 'default' : record.status === 'completed' ? 'secondary' : 'destructive'}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
