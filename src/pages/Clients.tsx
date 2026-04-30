import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  contract_terms: string | null;
  created_at: string;
}

const emptyClient: Partial<Client> = {
  company_name: '', contact_name: '', email: '', phone: '', address: '', service_type: '', contract_terms: '',
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Client>>(emptyClient);
  const [isEdit, setIsEdit] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSave = async () => {
    if (!editing.company_name) { toast({ title: 'Error', description: 'Company name required', variant: 'destructive' }); return; }
    if (isEdit && editing.id) {
      await supabase.from('clients').update({
        company_name: editing.company_name,
        contact_name: editing.contact_name,
        email: editing.email,
        phone: editing.phone,
        address: editing.address,
        service_type: editing.service_type,
        contract_terms: editing.contract_terms,
      }).eq('id', editing.id);
      toast({ title: 'Client updated' });
    } else {
      await supabase.from('clients').insert({
        company_name: editing.company_name!,
        contact_name: editing.contact_name || '',
        email: editing.email || '',
        phone: editing.phone || '',
        address: editing.address || '',
        service_type: editing.service_type || '',
        contract_terms: editing.contract_terms || null,
        user_id: user?.id!,
      });
      toast({ title: 'Client added' });
    }
    setDialogOpen(false); setEditing(emptyClient); setIsEdit(false); fetchClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    toast({ title: 'Client deleted' }); fetchClients();
  };

  const filtered = clients.filter((c) => c.company_name.toLowerCase().includes(search.toLowerCase()) || c.contact_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Clients & Sites</h1><p className="text-muted-foreground">{clients.length} clients</p></div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(emptyClient); setIsEdit(false); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Company Name *</Label><Input value={editing.company_name || ''} onChange={(e) => setEditing({ ...editing, company_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Contact Name</Label><Input value={editing.contact_name || ''} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Service Type</Label><Input value={editing.service_type || ''} onChange={(e) => setEditing({ ...editing, service_type: e.target.value })} placeholder="e.g. Security, Cleaning" /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contract Terms</Label><Input value={editing.contract_terms || ''} onChange={(e) => setEditing({ ...editing, contract_terms: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{isEdit ? 'Update' : 'Add Client'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No clients. Add your first client.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Service</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{c.company_name}</div></TableCell>
                    <TableCell>{c.contact_name}</TableCell><TableCell>{c.email}</TableCell><TableCell>{c.phone}</TableCell><TableCell>{c.service_type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setIsEdit(true); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
