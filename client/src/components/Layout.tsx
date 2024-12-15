import { Link, useLocation } from "wouter";
import { Users, Calendar, Trophy, Home } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarGroup
} from "@/components/ui/sidebar";

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
            </SidebarMenu>
          </SidebarGroup>

          {teamId && (
            <SidebarGroup>
              <SidebarGroupLabel>Team Management</SidebarGroupLabel>
              <SidebarMenu>
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
