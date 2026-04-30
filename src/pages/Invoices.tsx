import { useState, useEffect, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Eye, CheckCircle, Send, X } from 'lucide-react';

interface Invoice {
  id: string; client_id: string | null; invoice_number: string; issue_date: string;
  due_date: string; subtotal: number; gst_amount: number; total_amount: number;
  status: string; notes: string | null; created_at: string;
}
interface InvoiceLine { id: string; invoice_id: string; description: string; quantity: number; unit_price: number; line_total: number; }
interface ClientOption { id: string; company_name: string; }

const GST_RATE = 0.10;

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // New invoice form
  const [clientId, setClientId] = useState('');
  const [newLines, setNewLines] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  const fetchData = async () => {
    const [invRes, lineRes, cliRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('invoice_lines').select('*'),
      supabase.from('clients').select('id, company_name'),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (lineRes.data) setLines(lineRes.data);
    if (cliRes.data) setClients(cliRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach(c => { m[c.id] = c.company_name; });
    return m;
  }, [clients]);

  const addLine = () => setNewLines([...newLines, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setNewLines(newLines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: any) => {
    const updated = [...newLines];
    (updated[i] as any)[field] = value;
    setNewLines(updated);
  };

  const handleCreate = async () => {
    if (!clientId) { toast({ title: 'Select a client', variant: 'destructive' }); return; }
    const validLines = newLines.filter(l => l.description && l.unit_price > 0);
    if (validLines.length === 0) { toast({ title: 'Add at least one line item', variant: 'destructive' }); return; }

    const subtotal = validLines.reduce((a, l) => a + l.quantity * l.unit_price, 0);
    const gst = subtotal * GST_RATE;
    const total = subtotal + gst;
    const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { data: inv, error } = await supabase.from('invoices').insert({
      user_id: user!.id, client_id: clientId, invoice_number: invNum,
      subtotal: Math.round(subtotal * 100) / 100,
      gst_amount: Math.round(gst * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      status: 'draft',
    }).select().single();

    if (error || !inv) { toast({ title: 'Error', description: error?.message, variant: 'destructive' }); return; }

    const lineInserts = validLines.map(l => ({
      user_id: user!.id, invoice_id: inv.id, description: l.description,
      quantity: l.quantity, unit_price: l.unit_price,
      line_total: Math.round(l.quantity * l.unit_price * 100) / 100,
    }));
    await supabase.from('invoice_lines').insert(lineInserts);

    toast({ title: 'Invoice created', description: invNum });
    setDialogOpen(false);
    setClientId(''); setNewLines([{ description: '', quantity: 1, unit_price: 0 }]);
    fetchData();
  };

  const handleStatusChange = async (inv: Invoice, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', inv.id);
    toast({ title: `Invoice ${status}` });
    fetchData();
    if (viewInvoice?.id === inv.id) setViewInvoice({ ...inv, status });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    toast({ title: 'Invoice deleted' });
    fetchData();
  };

  const fmt = (n: number) => '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const invLines = viewInvoice ? lines.filter(l => l.invoice_id === viewInvoice.id) : [];

  const statusColor = (s: string) => {
    switch (s) { case 'paid': return 'default'; case 'sent': return 'secondary'; case 'overdue': return 'destructive'; default: return 'outline' as any; }
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + Number(i.total_amount), 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((a, i) => a + Number(i.total_amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-muted-foreground">Generate and manage client invoices with GST</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><FileText className="mr-2 h-4 w-4" />Create Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Line Items</Label>
                {newLines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end">
                    <Input placeholder="Description" value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} />
                    <Input type="number" placeholder="Qty" value={l.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} />
                    <Input type="number" placeholder="Price" value={l.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} />
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={newLines.length === 1}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addLine}><Plus className="mr-2 h-4 w-4" />Add Line</Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 border-t pt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{fmt(newLines.reduce((a, l) => a + l.quantity * l.unit_price, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (10%):</span>
                  <span>{fmt(newLines.reduce((a, l) => a + l.quantity * l.unit_price, 0) * GST_RATE)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total:</span>
                  <span>{fmt(newLines.reduce((a, l) => a + l.quantity * l.unit_price, 0) * (1 + GST_RATE))}</span>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Invoices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{invoices.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{fmt(totalPaid)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{fmt(totalOutstanding)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">GST Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(invoices.reduce((a, i) => a + Number(i.gst_amount), 0))}</div></CardContent></Card>
      </div>

      {viewInvoice ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{viewInvoice.invoice_number}</CardTitle>
                <p className="text-sm text-muted-foreground">{clientMap[viewInvoice.client_id || ''] || 'Unknown Client'} | Due: {viewInvoice.due_date}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={statusColor(viewInvoice.status)}>{viewInvoice.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => setViewInvoice(null)}>Back</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {invLines.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.description}</TableCell><TableCell>{l.quantity}</TableCell>
                    <TableCell>{fmt(l.unit_price)}</TableCell><TableCell className="text-right">{fmt(l.line_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 border-t pt-3 space-y-1 text-sm max-w-xs ml-auto">
              <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(viewInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>GST (10%):</span><span>{fmt(viewInvoice.gst_amount)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{fmt(viewInvoice.total_amount)}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              {viewInvoice.status === 'draft' && <Button size="sm" onClick={() => handleStatusChange(viewInvoice, 'sent')}><Send className="mr-2 h-4 w-4" />Mark Sent</Button>}
              {(viewInvoice.status === 'sent' || viewInvoice.status === 'overdue') && <Button size="sm" onClick={() => handleStatusChange(viewInvoice, 'paid')}><CheckCircle className="mr-2 h-4 w-4" />Mark Paid</Button>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : invoices.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No invoices yet. Create your first invoice above.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead>
                  <TableHead>Due</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{clientMap[inv.client_id || ''] || '—'}</TableCell>
                      <TableCell>{inv.issue_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell className="font-bold">{fmt(inv.total_amount)}</TableCell>
                      <TableCell><Badge variant={statusColor(inv.status)}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewInvoice(inv)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
