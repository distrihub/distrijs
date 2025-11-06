import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '@distri/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  Bot,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
  User2,
  ChevronUp,
} from 'lucide-react';
import Threads from '@/components/Threads';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAccount } from '@/components/AccountProvider';

function HomeSidebar() {
  const { theme, setTheme } = useTheme();
  const { accountInfo } = useAccount()
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/home')}
            >
              <Bot />
              Distri Agents
            </SidebarMenuButton>
            <SidebarMenuAction
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
              className="absolute right-0 top-0"
            >
              <svg className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="mb-1">
                <SidebarMenuButton
                  isActive={isActiveRoute('/home/agents')}
                  onClick={() => navigate('/home/agents')}
                >
                  <Bot className="h-4 w-4" />
                  Agents
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarSeparator />
        <Threads />

      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={accountInfo?.picture || undefined} alt={accountInfo?.email || 'User'} />
                    <AvatarFallback className="rounded-lg">
                      {accountInfo?.email?.charAt(0)?.toUpperCase() || <User2 className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">

                    <span className="truncate text-xs">{accountInfo?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/home/menu/account">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/home/menu/account/pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/home/menu/help">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/auth">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function HomeLayout() {
  const [defaultOpen, setDefaultOpen] = useState(true);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar:state');
    if (savedState !== null) {
      setDefaultOpen(savedState === 'true');
    }
  }, []);

  return (
    <div className="h-screen">

      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties}
      >
        <HomeSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>

    </div>
  );
}