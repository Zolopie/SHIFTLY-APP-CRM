import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  employment_type: string;
  hourly_rate: number;
  status: string;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  tax_number: string | null;
  bank_details: string | null;
  site_assigned: string | null;
  visa_expiry: string | null;
  licences: string | null;
  created_at: string;
}

const sampleStaffMembers = [
  {
    full_name: 'Alyssa Chen',
    email: 'alyssa.chen@shiftly.com',
    phone: '0412 345 678',
    role: 'supervisor',
    employment_type: 'full_time',
    hourly_rate: 45,
    status: 'active',
    date_of_birth: '1990-05-12',
    address: '45 Kent St, Sydney',
    emergency_contact: 'James Chen',
    tax_number: '123456789',
    bank_details: 'NAB 082-000 12345678',
    site_assigned: 'Harbour Plaza',
    visa_expiry: null,
    licences: 'Security',
  },
  {
    full_name: 'Marcus Reid',
    email: 'marcus.reid@shiftly.com',
    phone: '0413 987 654',
    role: 'guard',
    employment_type: 'part_time',
    hourly_rate: 32,
    status: 'active',
    date_of_birth: '1987-11-03',
    address: '101 George St, Sydney',
    emergency_contact: 'Emma Reid',
    tax_number: '234567891',
    bank_details: 'Commonwealth 062-000 87654321',
    site_assigned: 'Central Station',
    visa_expiry: null,
    licences: 'First Aid',
  },
  {
    full_name: 'Sofia Patel',
    email: 'sofia.patel@shiftly.com',
    phone: '0414 123 987',
    role: 'cleaner',
    employment_type: 'casual',
    hourly_rate: 28,
    status: 'active',
    date_of_birth: '1995-08-19',
    address: '23 Bourke St, Melbourne',
    emergency_contact: 'Rohan Patel',
    tax_number: '345678912',
    bank_details: 'Westpac 033-000 11223344',
    site_assigned: 'Eastwood Mall',
    visa_expiry: null,
    licences: 'Cleaning',
  },
];

const emptyStaff: Partial<StaffMember> = {
  full_name: '', email: '', phone: '', role: 'staff', employment_type: 'full_time',
  hourly_rate: 30, status: 'active', date_of_birth: '', address: '',
  emergency_contact: '', tax_number: '', bank_details: '', site_assigned: '',
  visa_expiry: '', licences: '',
};

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<StaffMember>>(emptyStaff);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStaff = async () => {
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleGenerateSampleStaff = async () => {
    if (!user) return;
    const records = sampleStaffMembers.map((member) => ({
      ...member,
      user_id: user.id,
    }));
    const { error } = await supabase.from('staff').insert(records);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Sample staff added' });
    fetchStaff();
  };

  const handleSave = async () => {
    if (!editing.full_name || !editing.email) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    if (isEdit && editing.id) {
      const { error } = await supabase.from('staff').update({
        full_name: editing.full_name,
        email: editing.email,
        phone: editing.phone,
        role: editing.role,
        employment_type: editing.employment_type,
        hourly_rate: editing.hourly_rate,
        status: editing.status,
        date_of_birth: editing.date_of_birth || null,
        address: editing.address || null,
        emergency_contact: editing.emergency_contact || null,
        tax_number: editing.tax_number || null,
        bank_details: editing.bank_details || null,
        site_assigned: editing.site_assigned || null,
        visa_expiry: editing.visa_expiry || null,
        licences: editing.licences || null,
      }).eq('id', editing.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff updated' });
    } else {
      const { error } = await supabase.from('staff').insert({
        full_name: editing.full_name!,
        email: editing.email!,
        phone: editing.phone || '',
        role: editing.role || 'staff',
        employment_type: editing.employment_type || 'full_time',
        hourly_rate: editing.hourly_rate ?? 30,
        status: editing.status || 'active',
        date_of_birth: editing.date_of_birth || null,
        address: editing.address || null,
        emergency_contact: editing.emergency_contact || null,
        tax_number: editing.tax_number || null,
        bank_details: editing.bank_details || null,
        site_assigned: editing.site_assigned || null,
        visa_expiry: editing.visa_expiry || null,
        licences: editing.licences || null,
        user_id: user?.id!,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff added' });
    }

    setDialogOpen(false);
    setEditing(emptyStaff);
    setIsEdit(false);
    fetchStaff();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff deleted' });
      fetchStaff();
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('staff').update({ status: newStatus }).eq('id', member.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
      fetchStaff();
    }
  };

  const filtered = staff.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/20 text-primary';
      case 'supervisor': return 'bg-warning/20 text-warning';
      case 'guard': return 'bg-success/20 text-success';
      case 'cleaner': return 'bg-chart-4/20 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">{staff.length} team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(emptyStaff); setIsEdit(false); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
          </DialogTrigger>
          <Button variant="outline" onClick={handleGenerateSampleStaff}>
            <UserCheck className="mr-2 h-4 w-4" /> Generate Sample Staff
          </Button>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={editing.full_name || ''} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={editing.date_of_birth || ''} onChange={(e) => setEditing({ ...editing, date_of_birth: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editing.role || 'staff'} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="guard">Guard</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select value={editing.employment_type || 'full_time'} onValueChange={(v) => setEditing({ ...editing, employment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" value={editing.hourly_rate || 30} onChange={(e) => setEditing({ ...editing, hourly_rate: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Site Assigned</Label>
                  <Input value={editing.site_assigned || ''} onChange={(e) => setEditing({ ...editing, site_assigned: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input value={editing.emergency_contact || ''} onChange={(e) => setEditing({ ...editing, emergency_contact: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number (TFN)</Label>
                  <Input value={editing.tax_number || ''} onChange={(e) => setEditing({ ...editing, tax_number: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Details</Label>
                  <Input value={editing.bank_details || ''} onChange={(e) => setEditing({ ...editing, bank_details: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Visa Expiry</Label>
                  <Input type="date" value={editing.visa_expiry || ''} onChange={(e) => setEditing({ ...editing, visa_expiry: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Licences</Label>
                <Input value={editing.licences || ''} onChange={(e) => setEditing({ ...editing, licences: e.target.value })} placeholder="e.g. Security Licence SL-12345" />
              </div>
              <Button onClick={handleSave} className="w-full">{isEdit ? 'Update Staff' : 'Add Staff'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No staff found. Add your first team member.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((member) => (
                    <TableRow key={member.id} className="animate-fade-in">
                      <TableCell className="font-medium">
                        <Link to={`/staff/${member.id}`} className="text-blue-500 hover:underline">
                          {member.full_name}
                        </Link>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={roleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{member.employment_type?.replace('_', ' ')}</TableCell>
                      <TableCell>${member.hourly_rate}/hr</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(member); setIsEdit(true); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)}>
                            {member.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
