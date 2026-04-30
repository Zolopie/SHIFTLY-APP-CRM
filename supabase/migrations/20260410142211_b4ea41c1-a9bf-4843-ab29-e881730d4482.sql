
-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete attendance" ON public.attendance_records FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pay runs
CREATE TABLE public.pay_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_gross NUMERIC DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  total_super NUMERIC DEFAULT 0,
  total_net NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pay_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their pay_runs" ON public.pay_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create pay_runs" ON public.pay_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pay_runs" ON public.pay_runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete pay_runs" ON public.pay_runs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_pay_runs_updated_at BEFORE UPDATE ON public.pay_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslips
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pay_run_id UUID NOT NULL REFERENCES public.pay_runs(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_rate NUMERIC DEFAULT 0,
  gross_pay NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  super_amount NUMERIC NOT NULL DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payslips" ON public.payslips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update payslips" ON public.payslips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete payslips" ON public.payslips FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + 30),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice lines
CREATE TABLE public.invoice_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their invoice_lines" ON public.invoice_lines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoice_lines" ON public.invoice_lines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update invoice_lines" ON public.invoice_lines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete invoice_lines" ON public.invoice_lines FOR DELETE USING (auth.uid() = user_id);
