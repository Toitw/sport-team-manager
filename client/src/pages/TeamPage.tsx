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
import { EditPlayerDialog } from "../components/EditPlayerDialog";
import { DeletePlayerDialog } from "../components/DeletePlayerDialog";
import { CreateEventDialog } from "../components/CreateEventDialog";
import { EditEventDialog } from "../components/EditEventDialog";
import { DeleteEventDialog } from "../components/DeleteEventDialog";

export default function TeamPage() {
  const { teamId, section = "players" } = useParams();
  const { user } = useUser();
  const parsedTeamId = teamId ? parseInt(teamId) : 0;
  const { players, isLoading: playersLoading } = usePlayers(parsedTeamId);
  const { events, isLoading: eventsLoading } = useEvents(parsedTeamId);
  
  const matches = events?.filter(event => event.type === "match") ?? [];
  
  const canManageTeam = user?.role === "admin" || user?.role === "editor";

  if (playersLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const handleEventClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const renderPlayers = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Players</CardTitle>
        {canManageTeam && <CreatePlayerDialog teamId={parsedTeamId} />}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No players added yet
                </TableCell>
              </TableRow>
            ) : (
              players?.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl} 
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">{player.name[0]}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{player.number}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <EditPlayerDialog player={player} teamId={parsedTeamId} />
                      <DeletePlayerDialog playerId={player.id} teamId={parsedTeamId} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderEvents = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events</CardTitle>
        {canManageTeam && <CreateEventDialog teamId={parsedTeamId} />}
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
              <div
                key={event.id}
                className="p-4 border rounded hover:bg-accent"
                onClick={handleEventClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {event.type}
                    </div>
                    {canManageTeam && (
                      <div className="flex items-center gap-2">
                        <EditEventDialog event={event} teamId={parsedTeamId} />
                        <DeleteEventDialog eventId={event.id} teamId={parsedTeamId} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {format(new Date(event.startDate), "PPP p")} - {format(new Date(event.endDate), "p")}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderMatches = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Matches</CardTitle>
        {canManageTeam && <CreateEventDialog teamId={parsedTeamId} />}
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          className="mb-4"
        />
        <div className="space-y-2">
          {matches.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No matches scheduled
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.id}
                className="p-4 border rounded hover:bg-accent"
                onClick={handleEventClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{match.title}</div>
                    {match.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {match.description}
                      </div>
                    )}
                    <div className="text-lg font-semibold mt-2">
                      {match.homeScore !== null && match.awayScore !== null ? (
                        <span>{match.homeScore} - {match.awayScore}</span>
                      ) : (
                        <span className="text-muted-foreground">Score pending</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      Match
                    </div>
                    {canManageTeam && (
                      <div className="flex items-center gap-2">
                        <EditEventDialog event={match} teamId={parsedTeamId} />
                        <DeleteEventDialog eventId={match.id} teamId={parsedTeamId} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {format(new Date(match.startDate), "PPP p")}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8">
      {section === "players" ? renderPlayers() : 
       section === "matches" ? renderMatches() : 
       renderEvents()}
    </div>
  );
}
