import { Link, useLocation } from "wouter";
import { Users, Calendar, Trophy, Home, Newspaper, LogOut, Building2 } from "lucide-react";
import { useUser } from "../hooks/use-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarGroupLabel,
  SidebarGroup
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  teamId?: string;
}

export function Layout({ children, teamId }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();

  if (!teamId) {
    console.log("No teamId provided to Layout");
  }

  const isActiveRoute = (route: string) => {
    if (route.startsWith("/team/")) {
      return location.startsWith(route);
    }
    return location === route;
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to logout"
        });
        return;
      }
      setLocation("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during logout"
      });
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="fixed">
        <SidebarHeader className="border-b">
          <div className="p-4">
            <Link href="/">
              <h2 className="text-lg font-semibold">Team Manager</h2>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="h-[calc(100vh-4rem)]">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton 
                    isActive={isActiveRoute("/")} 
                    tooltip="Home"
                    size="lg"
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/organizations">
                  <SidebarMenuButton 
                    isActive={isActiveRoute("/organizations")} 
                    tooltip="Organizations"
                    size="lg"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Organizations</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {user?.role === "admin" && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/admin">
                    <SidebarMenuButton
                      isActive={isActiveRoute("/admin")}
                      tooltip="Administration"
                      size="lg"
                    >
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip="Logout"
                    size="lg"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {teamId && (
            <SidebarGroup>
              <SidebarGroupLabel>Team Management</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href={`/team/${teamId}/news`}>
                    <SidebarMenuButton 
                      isActive={isActiveRoute(`/team/${teamId}/news`)}
                      tooltip="News"
                      size="lg"
                    >
                      <Newspaper className="h-4 w-4" />
                      <span>News</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={`/team/${teamId}/players`}>
                    <SidebarMenuButton 
                      isActive={isActiveRoute(`/team/${teamId}/players`)}
                      tooltip="Players"
                      size="lg"
                    >
                      <Users className="h-4 w-4" />
                      <span>Players</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={`/team/${teamId}/matches`}>
                    <SidebarMenuButton 
                      isActive={isActiveRoute(`/team/${teamId}/matches`)}
                      tooltip="Matches"
                      size="lg"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Matches</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={`/team/${teamId}/events`}>
                    <SidebarMenuButton 
                      isActive={isActiveRoute(`/team/${teamId}/events`)}
                      tooltip="Events"
                      size="lg"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Events</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}