import { useParams } from "wouter";
import { usePlayers } from "../hooks/use-players";
import { useEvents } from "../hooks/use-events";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { CreatePlayerDialog } from "../components/CreatePlayerDialog";

export default function TeamPage() {
  const { teamId } = useParams();
  const { user } = useUser();
  const parsedTeamId = teamId ? parseInt(teamId) : 0;
  const { players, isLoading: playersLoading } = usePlayers(parsedTeamId);
  const { events, isLoading: eventsLoading } = useEvents(parsedTeamId);

  const canManageTeam = user?.role === "admin" || user?.role === "editor";

  if (playersLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Players</CardTitle>
            {canManageTeam && <CreatePlayerDialog teamId={parsedTeamId} />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No players added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  players?.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.number}</TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.position}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={new Date()}
              className="mb-4"
            />
            <div className="space-y-2">
              {events?.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No events scheduled
                </div>
              ) : (
                events?.map((event) => (
                  <div key={event.id} className="p-2 border rounded">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), "PPP")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
