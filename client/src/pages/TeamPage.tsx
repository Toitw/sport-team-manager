import * as React from "react";
import { useParams, Link } from "wouter";
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
import { cn } from "@/lib/utils";

export default function TeamPage() {
  const { teamId = "", section = "news" } = useParams();
  const { user } = useUser();
  const parsedTeamId = teamId ? parseInt(teamId) : 0;
  const { players, isLoading: playersLoading } = usePlayers(parsedTeamId);
  const { events = [], isLoading: eventsLoading } = useEvents(parsedTeamId);
  const { news, nextMatch, isLoading: newsLoading } = useNews(parsedTeamId);
  
  const matches = events.filter(event => event.type === "match");
  
  const canManageTeam = user?.role === "admin" || user?.role === "manager";

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

  const [selectedPlayerId, setSelectedPlayerId] = React.useState<number | null>(null);
  
  const renderPlayers = () => {
    return (
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
                {canManageTeam && <TableHead className="text-right">Actions</TableHead>}
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
                  <React.Fragment key={player.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setSelectedPlayerId(player.id)}
                    >
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
                      {canManageTeam && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <EditPlayerDialog player={player} teamId={parsedTeamId} />
                            <DeletePlayerDialog playerId={player.id} teamId={parsedTeamId} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {selectedPlayerId && players && (
          <PlayerProfileDialog 
            player={players.find(p => p.id === selectedPlayerId)!}
            open={!!selectedPlayerId}
            onOpenChange={(open) => setSelectedPlayerId(open ? selectedPlayerId : null)}
          />
        )}
      </Card>
    );
  };

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
          modifiers={{
            event: events.map(event => new Date(event.startDate)),
          }}
          modifiersStyles={{
            event: {
              border: '2px solid var(--primary)',
            }
          }}
          components={{
            DayContent: (props) => {
              const matchingEvents = events.filter(
                event => format(new Date(event.startDate), 'yyyy-MM-dd') === 
                         format(props.date, 'yyyy-MM-dd')
              );

              if (matchingEvents.length === 0) {
                return <div className="p-2">{props.date.getDate()}</div>;
              }

              const [isOpen, setIsOpen] = React.useState(false);
              const [isClicked, setIsClicked] = React.useState(false);

              return (
                <div 
                  className="relative w-full h-full z-50"
                  onMouseEnter={() => !isClicked && setIsOpen(true)}
                  onMouseLeave={() => !isClicked && setIsOpen(false)}
                >
                  <Popover open={isOpen}>
                    <PopoverTrigger asChild>
                      <div
                        className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
                        onClick={() => {
                          setIsClicked(!isClicked);
                          setIsOpen(!isClicked);
                        }}
                      >
                        <span>{props.date.getDate()}</span>
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                          {matchingEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "h-1 rounded-full flex-1",
                                event.type === 'match' ? "bg-red-500" :
                                event.type === 'training' ? "bg-green-500" :
                                "bg-blue-500"
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        {matchingEvents.map((event) => (
                          <div key={event.id} className="border-b last:border-0 pb-2 last:pb-0">
                            <div className="font-medium">{event.title}</div>
                            {event.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">
                              {format(new Date(event.startDate), "p")} - {format(new Date(event.endDate), "p")}
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
            }
          }}
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

  const renderMatches = () => {
    const now = new Date();
    const upcomingMatches = matches.filter(match => new Date(match.startDate) > now);
    const pastMatches = matches.filter(match => new Date(match.startDate) <= now);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={new Date()}
              className="mb-4"
              modifiers={{
                event: matches.map(match => new Date(match.startDate)),
              }}
              modifiersStyles={{
                event: {
                  border: '2px solid var(--primary)',
                }
              }}
              components={{
                DayContent: (props) => {
                  const matchingEvents = matches.filter(
                    match => format(new Date(match.startDate), 'yyyy-MM-dd') === 
                             format(props.date, 'yyyy-MM-dd')
                  );

                  if (matchingEvents.length === 0) {
                    return <div className="p-2">{props.date.getDate()}</div>;
                  }

                  const [isOpen, setIsOpen] = React.useState(false);
                  const [isClicked, setIsClicked] = React.useState(false);

                  return (
                    <div 
                      className="relative w-full h-full z-50"
                      onMouseEnter={() => !isClicked && setIsOpen(true)}
                      onMouseLeave={() => !isClicked && setIsOpen(false)}
                    >
                      <Popover open={isOpen}>
                        <PopoverTrigger asChild>
                          <div
                            className="w-full h-full p-2 cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-sm"
                            onClick={() => {
                              setIsClicked(!isClicked);
                              setIsOpen(!isClicked);
                            }}
                          >
                            <span>{props.date.getDate()}</span>
                            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                              {matchingEvents.map((match) => (
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-2">
                            {matchingEvents.map((match) => (
                              <div key={match.id} className="border-b last:border-0 pb-2 last:pb-0">
                                <div className="font-medium">{match.title}</div>
                                {match.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {match.description}
                                  </div>
                                )}
                                <div className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(match.startDate), "p")} - {format(new Date(match.endDate), "p")}
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
                }
              }}
            />
            <div className="space-y-4">
              {upcomingMatches.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No upcoming matches scheduled
                </div>
              ) : (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    onClick={handleEventClick}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="font-semibold text-lg">{match.title}</div>
                        {match.description && (
                          <div className="text-sm text-muted-foreground">
                            {match.description}
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary">
                          {format(new Date(match.startDate), "PPP p")}
                        </div>
                      </div>
                      {canManageTeam && (
                        <div className="flex items-center gap-2">
                          <EditEventDialog event={match} teamId={parsedTeamId} />
                          <DeleteEventDialog eventId={match.id} teamId={parsedTeamId} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastMatches.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No match results yet
                </div>
              ) : (
                pastMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    onClick={handleEventClick}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="font-semibold text-lg">{match.title}</div>
                        {match.description && (
                          <div className="text-sm text-muted-foreground">
                            {match.description}
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold">
                            {match.homeScore !== null && match.awayScore !== null ? (
                              <span className="text-primary">{match.homeScore} - {match.awayScore}</span>
                            ) : (
                              <span className="text-muted-foreground text-base">Score pending</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(match.startDate), "PPP")}
                          </div>
                        </div>
                      </div>
                      {canManageTeam && (
                        <div className="flex items-center gap-2">
                          <EditEventDialog event={match} teamId={parsedTeamId} />
                          <DeleteEventDialog eventId={match.id} teamId={parsedTeamId} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderNews = () => {
    const canManageNews = user?.role === "admin";

    if (newsLoading) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {nextMatch && (
          <Card>
            <CardHeader>
              <CardTitle>Next Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{nextMatch.title}</div>
                  {nextMatch.description && (
                    <div className="text-sm text-muted-foreground">
                      {nextMatch.description}
                    </div>
                  )}
                  <div className="text-sm font-medium text-primary">
                    {format(new Date(nextMatch.startDate), "PPP p")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>News</CardTitle>
            {canManageNews && <CreateNewsDialog teamId={parsedTeamId} />}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!news?.length ? (
                <div className="text-center text-muted-foreground">
                  No news articles yet
                </div>
              ) : (
                news.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-lg">{article.title}</div>
                      {canManageNews && (
                        <div className="flex items-center gap-2">
                          <EditNewsDialog news={article} teamId={parsedTeamId} />
                          <DeleteNewsDialog newsId={article.id} teamId={parsedTeamId} />
                        </div>
                      )}
                    </div>
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    )}
                    <div className="text-sm">{article.content}</div>
                    <div className="text-xs text-muted-foreground">
                      Posted on {article.createdAt ? format(new Date(article.createdAt), "PPP") : 'Unknown date'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Layout teamId={parsedTeamId.toString()}>
      <div className="container py-8">
        {section === "players" ? renderPlayers() : 
         section === "matches" ? renderMatches() : 
         section === "news" ? renderNews() :
         renderEvents()}
      </div>
    </Layout>
  );
}