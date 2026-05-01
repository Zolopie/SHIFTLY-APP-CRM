import {
  LayoutDashboard, Users, Calendar, Clock, Building2, DollarSign,
  FileText, Settings, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Staff', url: '/staff', icon: Users },
  { title: 'Rostering', url: '/rostering', icon: Calendar },
  { title: 'Attendance', url: '/attendance', icon: Clock },
  { title: 'Clients & Sites', url: '/clients', icon: Building2 },
];

const financeNav = [
  { title: 'Payroll', url: '/payroll', icon: DollarSign },
  { title: 'Invoices', url: '/invoices', icon: FileText },
  { title: 'Reports', url: '/reports', icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white text-slate-800 border-r border-slate-200 [&>[data-sidebar=sidebar]]:bg-white"
    >
      {/* HEADER */}
      <SidebarHeader className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <BrandLogo showText={!collapsed} />
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="bg-white">

        {/* MAIN */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-slate-500 uppercase tracking-wider px-2">
            Main
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="
                      transition-all duration-200
                      text-slate-700
                      hover:bg-blue-50 hover:text-blue-600
                      data-[active=true]:bg-blue-100
                      data-[active=true]:text-blue-600
                      data-[active=true]:font-medium
                    "
                  >
                    <NavLink to={item.url} end={item.url === '/dashboard'}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* FINANCE */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-slate-500 uppercase tracking-wider px-2">
            Finance
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {financeNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="
                      transition-all duration-200
                      text-slate-700
                      hover:bg-blue-50 hover:text-blue-600
                      data-[active=true]:bg-blue-100
                      data-[active=true]:text-blue-600
                      data-[active=true]:font-medium
                    "
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="border-t border-slate-200 bg-white">
        <SidebarMenu>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              <NavLink to="/settings">
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="text-slate-700 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}