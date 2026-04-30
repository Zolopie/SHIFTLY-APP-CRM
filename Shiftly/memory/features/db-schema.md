---
name: Database schema
description: Staff, shifts, clients, attendance, pay_runs, payslips, invoices, invoice_lines tables with user_id-based RLS
type: feature
---
Tables: staff, shifts, clients, attendance_records, pay_runs, payslips, invoices, invoice_lines
All have user_id column with RLS: auth.uid() = user_id for all CRUD ops.
- attendance_records: shift_id (FK shifts), staff_id (FK staff), clock_in/out, status
- pay_runs: period_start/end, totals (gross/tax/super/net), status (draft/completed)
- payslips: FK pay_run_id, staff_id, hours/rate/overtime/gross/tax/super/net, status
- invoices: FK client_id, invoice_number, dates, subtotal/gst/total, status (draft/sent/paid/overdue)
- invoice_lines: FK invoice_id, description/quantity/unit_price/line_total
Payroll logic: 32.5% tax, 11.5% super, 1.5x OT after 38hrs. GST: 10%.
