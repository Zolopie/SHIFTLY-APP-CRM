import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Building, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('Shiftly');
  const [abn, setAbn] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully' });
      setNewPassword('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Manage your account and company settings</p></div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Change Password</Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Button onClick={handlePasswordChange} variant="outline">Update</Button>
            </div>
          </div>
          <Separator />
          <Button variant="destructive" onClick={signOut}>Sign Out</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
            <div className="space-y-2"><Label>ABN</Label><Input value={abn} onChange={e => setAbn(e.target.value)} placeholder="XX XXX XXX XXX" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Email</Label><Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} type="email" /></div>
            <div className="space-y-2"><Label>Company Phone</Label><Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} /></div>
          </div>
          <Button onClick={() => toast({ title: 'Company details saved' })}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Payroll Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground">Tax Rate (PAYG)</span><span className="font-medium">32.5%</span></div>
          <div className="flex justify-between p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground">Superannuation Rate</span><span className="font-medium">11.5%</span></div>
          <div className="flex justify-between p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground">Overtime Multiplier</span><span className="font-medium">1.5x after 38hrs/week</span></div>
          <div className="flex justify-between p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground">GST Rate</span><span className="font-medium">10%</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
