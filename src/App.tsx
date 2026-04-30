import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Staff from "@/pages/Staff";
import Rostering from "@/pages/Rostering";
import Attendance from "@/pages/Attendance";
import Clients from "@/pages/Clients";
import Payroll from "@/pages/Payroll";
import StaffDetail from '@/pages/StaffDetail';
import Invoices from '@/pages/Invoices';
import Reports from "@/pages/Reports";
import GuardDashboard from "@/pages/GuardDashboard";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import SplashScreen from "@/components/SplashScreen";
import { useState } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => {
  const [appLoading, setAppLoading] = useState(true);

  // ✅ Splash screen FIRST
  if (appLoading) {
    return <SplashScreen onFinish={() => setAppLoading(false)} />;
  }

  // ✅ Then your actual app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/staff/:id" element={<StaffDetail />} />
                <Route path="/rostering" element={<Rostering />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/guard" element={<GuardDashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;