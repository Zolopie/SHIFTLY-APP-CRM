-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('leave', 'unavailability')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- for admin submitting on behalf
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leave requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leave requests" ON public.leave_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all leave requests" ON public.leave_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.staff WHERE user_id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "Admins can update leave requests" ON public.leave_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.staff WHERE user_id = auth.uid() AND role IN ('admin', 'manager')));
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();