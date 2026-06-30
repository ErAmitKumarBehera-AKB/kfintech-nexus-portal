import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Bell, FileText, Settings, LogOut, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AppSidebar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();

  const userName = user?.name || "Investor";
  const userEmail = user?.email || "investor@example.com";
  const initials = userName.substring(0, 2).toUpperCase();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const checkNotifications = async () => {
        try {
            const res = await apiClient.get(`/notifications?_t=${Date.now()}`);
            if (isMounted) setUnreadCount(res.data.unreadCount || 0);
        } catch (e) { }
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 5000);
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === 'notifications' && unreadCount > 0) {
        apiClient.patch('/notifications/read-all').then(() => {
            setUnreadCount(0);
        }).catch(e => console.error(e));
    }
  }, [activeTab, unreadCount]);

    const navItems = [
      {
        title: "Create Ticket",
        id: "create",
        icon: PlusCircle,
      },
      {
        title: "My Tickets",
        id: "tickets",
        icon: LayoutDashboard,
      },
      {
        title: "Notifications",
        id: "notifications",
        icon: Bell,
      },
      {
        title: "Documents",
        id: "documents",
        icon: FileText,
      },
    ];

    const calculateProfileProgress = () => {
        if (!user) return 0;
        if (user.profileCompleted) return 100;
        
        let score = 0;
        if (user.name) score += 16;
        if (user.dob) score += 16;
        if (user.phoneNumber) score += 16;
        if (user.address?.street && user.address?.city && user.address?.state) score += 16;
        if (user.bankAccount?.bankName && user.bankAccount?.accountNumber && user.bankAccount?.ifsc) score += 16;
        if ((user.kyc?.aadhaar || user.kyc?.dl) && user.kyc?.pan) score += 20;
        
        return Math.min(score, 100);
    };

    const progress = calculateProfileProgress();
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const AvatarWithRing = () => (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg className="absolute -inset-1 w-10 h-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth="2"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            className={progress === 100 ? "stroke-emerald-500" : "stroke-yellow-400"}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
          />
        </svg>
        <Avatar className="h-8 w-8 rounded-full">
          <AvatarFallback className="rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-medium">{initials}</AvatarFallback>
        </Avatar>
      </div>
    );

    return (
      <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] transition-colors duration-500">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground pointer-events-none hover:bg-transparent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 shadow-sm">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                  <span className="truncate font-semibold">Nexus Portal</span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">Investor Hub</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-zinc-500 dark:text-zinc-400">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      isActive={activeTab === item.id}
                      onClick={() => onTabChange(item.id)}
                      tooltip={item.title}
                      className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 data-[active=true]:bg-zinc-100 dark:data-[active=true]:bg-zinc-800 data-[active=true]:text-zinc-900 dark:data-[active=true]:text-zinc-50 transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 font-medium">{item.title}</span>
                      {item.id === 'notifications' && unreadCount > 0 && (
                          <div className="ml-auto flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm animate-in fade-in zoom-in">
                              {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 focus-visible:ring-2 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-900 dark:data-[state=open]:text-zinc-100 h-12 outline-none transition-colors">
                    <AvatarWithRing />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-zinc-500 dark:text-zinc-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg bg-white dark:bg-[#131313] border border-zinc-200 dark:border-zinc-800 shadow-md"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3 text-left text-sm text-zinc-900 dark:text-zinc-100">
                      <AvatarWithRing />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{userName}</span>
                        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                  <DropdownMenuItem onClick={() => onTabChange('profile')} className="cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile & KYC
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                  <DropdownMenuItem onClick={() => {
                    if (logout) logout();
                  }} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50 focus:text-red-600 dark:focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

export default AppSidebar;
