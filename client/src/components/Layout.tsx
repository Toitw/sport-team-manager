import { Link } from "wouter";
import { Users, Calendar, Trophy, Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  teamId?: string;
}

export function Layout({ children, teamId }: LayoutProps) {
  const [location] = useLocation();

  const isActiveRoute = (route: string) => {
    return location === route;
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="p-4">
            <Link href="/">
              <h2 className="text-lg font-semibold">Team Manager</h2>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={isActiveRoute("/")} tooltip="Home">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            {teamId && (
              <>
                <SidebarMenuItem>
                  <Link href={`/team/${teamId}/players`}>
                    <SidebarMenuButton 
                      isActive={isActiveRoute(`/team/${teamId}/players`)}
                      tooltip="Players"
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
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Events</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
