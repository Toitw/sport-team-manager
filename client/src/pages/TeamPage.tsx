import * as React from "react";
import { useParams, useLocation } from "wouter";
import { usePlayers } from "../hooks/use-players";
import { useEvents } from "../hooks/use-events";
import { useUser } from "../hooks/use-user";
import { useNews } from "../hooks/use-news";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Layout } from "../components/Layout";
import { CreatePlayerDialog } from "../components/CreatePlayerDialog";
import { EditPlayerDialog } from "../components/EditPlayerDialog";
import { DeletePlayerDialog } from "../components/DeletePlayerDialog";
import { PlayerProfileDialog } from "../components/PlayerProfileDialog";
import { CreateEventDialog } from "../components/CreateEventDialog";
import { EditEventDialog } from "../components/EditEventDialog";
import { DeleteEventDialog } from "../components/DeleteEventDialog";
import { CreateNewsDialog } from "../components/CreateNewsDialog";
import { EditNewsDialog } from "../components/EditNewsDialog";
import { DeleteNewsDialog } from "../components/DeleteNewsDialog";
import { MatchLineupDialog } from "../components/MatchLineupDialog";
import { MatchGoalsDialog } from "../components/MatchGoalsDialog";
import { cn } from "@/lib/utils";

const DayContent = React.memo(({ date, events, onEventClick }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const matchingEvents = events.filter(
    (event: any) =>
      format(new Date(event.startDate), "yyyy-MM-dd") === 
      format(date, "yyyy-MM-dd")
  );

  if (matchingEvents.length === 0) {
    return <div className="p-2">{date.getDate()}</div>;
  }

  return (
    <div className="relative w-full h-full z-50">
      <Popover open={isOpen}>
        <PopoverTrigger asChild>
          <div
            className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
            onClick={() => {
              setIsOpen(true);
              onEventClick?.();
            }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <span>{date.getDate()}</span>
            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
              {matchingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className={cn(
                    "h-1 rounded-full flex-1",
                    event.type === "match"
                      ? "bg-red-500"
                      : event.type === "training"
                        ? "bg-green-500"
                        : "bg-blue-500"
                  )}
                />
              ))}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 z-[100]"
          sideOffset={5}
          align="start"
          side="right"
          onInteractOutside={() => setIsOpen(false)}
        >
          <div className="space-y-2">
            {matchingEvents.map((event: any) => (
              <div
                key={event.id}
                className="border-b last:border-0 pb-2 last:pb-0"
              >
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(event.startDate), "p")} -{" "}
                  {format(new Date(event.endDate), "p")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {event.type}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

const MatchDayContent = React.memo(({ date, matches, canManageTeam }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const matchingEvents = matches.filter(
    (match: any) =>
      format(new Date(match.startDate), "yyyy-MM-dd") === 
      format(date, "yyyy-MM-dd")
  );

  if (matchingEvents.length === 0) {
    return <div className="p-2">{date.getDate()}</div>;
  }

  return (
    <div className="relative w-full h-full z-50">
      <Popover open={isOpen}>
        <PopoverTrigger asChild>
          <div
            className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <span>{date.getDate()}</span>
            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
              {matchingEvents.map((match: any) => (
                <div
                  key={match.id}
                  className="h-1 rounded-full flex-1 bg-red-500"
                />
              ))}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 z-[100]"
          sideOffset={5}
          align="start"
          side="right"
          onInteractOutside={() => setIsOpen(false)}
        >
          <div className="space-y-2">
            {matchingEvents.map((match: any) => (
              <div
                key={match.id}
                className="border-b last:border-0 pb-2 last:pb-0"
              >
                <div className="font-medium">{match.title}</div>
                {match.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {match.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(match.startDate), "p")} -{" "}
                  {format(new Date(match.endDate), "p")}
                </div>
                {match.homeScore !== null && match.awayScore !== null && (
                  <div className="text-sm font-medium mt-1">
                    Score: {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default function TeamPage() {
  const params = useParams();
  const teamId = parseInt(params.teamId || "0");
  const [location] = useLocation();
  const { user } = useUser();
  const { players = [], isLoading: playersLoading } = usePlayers(teamId);
  const { events = [], isLoading: eventsLoading } = useEvents(teamId);
  const { news = [], nextMatch, isLoading: newsLoading } = useNews(teamId);
  const canManageTeam = user?.role === "admin";
  
  const currentSection = location.split('/').pop() || 'news';

  const matches = React.useMemo(() => 
    events.filter(event => event.type === "match"), [events]);

  return (
    <Layout teamId={params.teamId}>
      <div className="container py-8">
        <div className="grid gap-8">
          {currentSection === "news" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Latest News</CardTitle>
                {canManageTeam && <CreateNewsDialog teamId={teamId} />}
              </CardHeader>
              <CardContent>
                {newsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map((item) => (
                      <div key={item.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{item.title}</h3>
                          {canManageTeam && (
                            <div className="flex gap-2">
                              <EditNewsDialog newsId={item.id} teamId={teamId} />
                              <DeleteNewsDialog newsId={item.id} teamId={teamId} />
                            </div>
                          )}
                        </div>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-48 object-cover rounded-md mb-2"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {currentSection === "events" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Events Calendar</CardTitle>
                {canManageTeam && <CreateEventDialog teamId={teamId} />}
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    components={{
                      DayContent: (props) => (
                        <DayContent
                          {...props}
                          events={events}
                          onEventClick={() => {}}
                        />
                      ),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}
          {currentSection === "matches" && (
            <Card>
              <CardHeader>
                <CardTitle>Match Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    components={{
                      DayContent: (props) => (
                        <MatchDayContent
                          {...props}
                          matches={matches}
                          canManageTeam={canManageTeam}
                        />
                      ),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}
          {currentSection === "players" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Players</CardTitle>
                {canManageTeam && <CreatePlayerDialog teamId={teamId} />}
              </CardHeader>
              <CardContent>
                {playersLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>{player.number}</TableCell>
                          <TableCell>{player.name}</TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <PlayerProfileDialog
                                playerId={player.id}
                                open={false}
                                onOpenChange={() => {}}
                              />
                              {canManageTeam && (
                                <>
                                  <EditPlayerDialog playerId={player.id} teamId={teamId} />
                                  <DeletePlayerDialog playerId={player.id} teamId={teamId} />
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
