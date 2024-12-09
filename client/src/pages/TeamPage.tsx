import { useParams } from "wouter";
import { usePlayers } from "../hooks/use-players";
import { useEvents } from "../hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function TeamPage() {
  const { teamId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId) : 0;
  const { players, isLoading: playersLoading } = usePlayers(parsedTeamId);
  const { events, isLoading: eventsLoading } = useEvents(parsedTeamId);

  if (playersLoading || eventsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
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
                {players?.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>{player.number}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.position}</TableCell>
                  </TableRow>
                ))}
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
              {events?.map((event) => (
                <div key={event.id} className="p-2 border rounded">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(event.startDate), "PPP")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
