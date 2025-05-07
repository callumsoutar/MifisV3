"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Button } from "@/components/ui/button";
import { LucideHome, LucideCalendar, LucideBookOpen, LucidePlane, LucideUsers, LucideUserCog, 
  LucideFileText, LucideGraduationCap, LucideShield, LucideSettings, LucideLogOut, LucideUser } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole, canAccessTab, getUserRoleForOrg, TAB_ROLE_ACCESS } from "@/lib/permissions";

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
};

const mainNavOptions = [
  { label: "Dashboard", icon: LucideHome, href: "/dashboard", tab: "dashboard" },
  { label: "Scheduler", icon: LucideCalendar, href: "/scheduler", tab: "scheduler" },
  { label: "Bookings", icon: LucideBookOpen, href: "/bookings", tab: "bookings" },
  { label: "Aircraft", icon: LucidePlane, href: "/aircraft", tab: "aircraft" },
  { label: "Members", icon: LucideUsers, href: "/members", tab: "members" },
  { label: "Staff", icon: LucideUserCog, href: "/staff", tab: "staff" },
  { label: "Invoicing", icon: LucideFileText, href: "/invoicing", tab: "invoices" },
  { label: "Training", icon: LucideGraduationCap, href: "/training", tab: "training" },
  { label: "Safety", icon: LucideShield, href: "/safety", tab: "safety" },
] as const;

export default function AppShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    async function loadUserData() {
      try {
        // Get current session
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError || !user) {
          console.error('[ERROR] Session error:', sessionError);
          router.replace("/login");
          return;
        }
        
        setUser(user);
        
        // Get user profile with organization data
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select(`
            *,
            organizations:user_organizations!inner(
              role,
              organization:organizations(*)
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('[ERROR] Profile error:', profileError);
          setLoading(false);
          return;
        }

        if (!profile) {
          console.error('[ERROR] No profile found for user');
          setLoading(false);
          return;
        }

        console.log('[DEBUG] User profile:', {
          id: profile.id,
          email: profile.email,
          organizations: profile.organizations
        });

        setUserProfile(profile);
        
        // Get user role for primary organization if it exists
        if (profile.organizations && profile.organizations.length > 0) {
          const primaryOrg = profile.organizations[0];
          console.log('[DEBUG] Primary organization:', {
            org: primaryOrg,
            role: primaryOrg.role
          });
          
          if (primaryOrg.role) {
            console.log('[DEBUG] Setting user role from organization:', primaryOrg.role);
            setUserRole(primaryOrg.role as UserRole);
          } else {
            console.error('[ERROR] No role found in organization data');
            setLoading(false);
            return;
          }
        } else {
          console.error('[ERROR] User has no organizations');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[ERROR] Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [router]);

  // Filter navigation options based on user role
  const visibleNavOptions = mainNavOptions.filter(option => {
    const hasAccess = canAccessTab(option.tab, userRole);
    console.log('[DEBUG] Nav access check:', {
      tab: option.tab,
      role: userRole,
      hasAccess,
      allowedRoles: TAB_ROLE_ACCESS[option.tab]
    });
    return hasAccess;
  });

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const getUserInitials = (user: User | null) => {
    if (!user?.email) return "U";
    return user.email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-sky-100 to-purple-100">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-screen bg-gradient-to-br from-indigo-700 to-purple-700 text-white shadow-2xl">
          <div className="h-16 flex items-center px-8 border-b border-white/10">
            <span className="text-2xl font-extrabold tracking-tight">Flight Desk Pro</span>
          </div>
          <nav className="flex flex-col h-[calc(100%-4rem)]">
            <div className="flex-1 py-6 px-2 space-y-1">
              {mainNavOptions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium focus:outline-none"
                  disabled
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="px-4 pb-6">
              <div className="pt-4 border-t border-white/10">
                <button
                  className="w-full flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium focus:outline-none"
                  disabled
                >
                  <LucideSettings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            </div>
          </nav>
        </aside>
        {/* Main Content */}
        <div className="flex-1">
          <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200/80 bg-white/80 shadow-sm backdrop-blur-md">
            <div className="text-2xl font-bold text-indigo-800">Loading...</div>
            <div className="flex items-center gap-4">
              <div className="w-40 h-4 bg-gray-200 animate-pulse rounded"></div>
              <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full"></div>
            </div>
          </header>
          <div className="p-10">
            <div className="w-full h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar - fixed */}
      <aside className="hidden md:flex fixed top-0 left-0 w-64 h-screen bg-gradient-to-br from-indigo-700 to-purple-700 text-white shadow-2xl z-30 flex-col">
        <div className="h-16 flex items-center px-8 border-b border-white/10">
          <span className="text-2xl font-extrabold tracking-tight">Flight Desk Pro</span>
        </div>
        <nav className="flex flex-col h-[calc(100%-4rem)]">
          {/* Main Navigation */}
          <div className="flex-1 py-6 px-2 space-y-1">
            {visibleNavOptions.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className={`w-full flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium focus:outline-none ${
                  href === currentPath ? "bg-white/10" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
          {/* Settings at bottom */}
          <div className="px-4 pb-6">
            <div className="pt-4 border-t border-white/10">
              {canAccessTab('settings', userRole) && (
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium focus:outline-none"
                >
                  <LucideSettings className="w-5 h-5" />
                  Settings
                </button>
              )}
            </div>
          </div>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Bar - sticky */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-8 border-b border-gray-200/80 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="text-2xl font-bold text-indigo-800">
            {mainNavOptions.find(opt => opt.href === currentPath)?.label || "Dashboard"}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-indigo-700 font-semibold">{userProfile?.first_name} {userProfile?.last_name}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={userProfile?.profile_image_url || undefined}
                      alt={userProfile?.email || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LucideUser className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LucideSettings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                  <LucideLogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* Page Content - scrollable */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 