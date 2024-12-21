import * as React from "react";
import { useParams } from "wouter";

// Hooks
import { usePlayers } from "@/hooks/use-players";
import { useEvents } from "@/hooks/use-events";
import { useUser } from "@/hooks/use-user";
import { useNews } from "@/hooks/use-news";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Icons
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

// Custom Components
import { LineupDialog } from "@/components/match/LineupDialog";
import { ReservesDialog } from "@/components/match/ReservesDialog";
import { ScorersDialog } from "@/components/match/ScorersDialog";
import { Layout } from "@/components/Layout";
import { CreatePlayerDialog } from "@/components/CreatePlayerDialog";
import { EditPlayerDialog } from "@/components/EditPlayerDialog";
import { DeletePlayerDialog } from "@/components/DeletePlayerDialog";
import { PlayerProfileDialog } from "@/components/PlayerProfileDialog";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { EditEventDialog } from "@/components/EditEventDialog";
import { DeleteEventDialog } from "@/components/DeleteEventDialog";
import { CreateNewsDialog } from "@/components/CreateNewsDialog";
import { EditNewsDialog } from "@/components/EditNewsDialog";
import { DeleteNewsDialog } from "@/components/DeleteNewsDialog";
import { CardsDialog } from "@/components/match/CardsDialog";
import { SubstitutionsDialog } from "@/components/match/SubstitutionsDialog";
import { CommentaryDialog } from "@/components/match/CommentaryDialog";

// ErrorBoundary component for handling errors gracefully
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <Button className="mt-4" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function TeamPage() {
  // Route params
  const { teamId = "", section = "news" } = useParams();

  // Parse and memoize team ID
  const parsedTeamId = React.useMemo(() => (teamId ? parseInt(teamId, 10) : 0), [teamId]);

  // State hooks
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<number | null>(null);
  const [lineupDialogOpen, setLineupDialogOpen] = React.useState(false);
  const [selectedMatchId, setSelectedMatchId] = React.useState<number | null>(null);
  const [scorersDialogOpen, setScorersDialogOpen] = React.useState(false);
  const [cardsDialogOpen, setCardsDialogOpen] = React.useState(false);
  const [substitutionsDialogOpen, setSubstitutionsDialogOpen] = React.useState(false);
  const [commentaryDialogOpen, setCommentaryDialogOpen] = React.useState(false);

  // Reset match selection when dialog closes
  const handleLineupDialogChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSelectedMatchId(null);
    }
    setLineupDialogOpen(open);
  }, []);

  // Reset states when teamId changes
  React.useEffect(() => {
    setSelectedPlayerId(null);
    setLineupDialogOpen(false);
    setSelectedMatchId(null);
    setScorersDialogOpen(false);
    setCardsDialogOpen(false);
    setSubstitutionsDialogOpen(false);
    setCommentaryDialogOpen(false);
  }, [parsedTeamId]);

  // Data fetching hooks
  const { user } = useUser();
  const { players = [], isLoading: playersLoading } = usePlayers(parsedTeamId);
  const { events = [], isLoading: eventsLoading } = useEvents(parsedTeamId);
  const { news = [], nextMatch, isLoading: newsLoading } = useNews(parsedTeamId);

  // Memoized values
  const canManageTeam = React.useMemo(() => (user?.role === "admin" || user?.role === "manager"), [user?.role]);

  const now = React.useMemo(() => new Date(), []);

  const matches = React.useMemo(() => events.filter(event => event.type === "match"), [events]);

  const upcomingMatches = React.useMemo(() => matches.filter(match => new Date(match.startDate) > now), [matches, now]);

  const pastMatches = React.useMemo(() => matches.filter(match => new Date(match.startDate) <= now), [matches, now]);

  const selectedPlayer = React.useMemo(() => players.find(p => p.id === selectedPlayerId), [players, selectedPlayerId]);

  // Callbacks
  const handleEventClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePlayerClick = React.useCallback((playerId: number) => {
    setSelectedPlayerId(playerId);
  }, []);

  const handlePlayerDialogChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSelectedPlayerId(null);
    }
  }, []);

  // Loading state
  if (playersLoading || eventsLoading || newsLoading) {
    return (
      <Layout teamId={parsedTeamId.toString()}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Layout>
    );
  }

  // Render methods
  const [sortBy, setSortBy] = React.useState<'number' | 'name' | 'position'>('number');

  const getSortedPlayers = () => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      if (sortBy === 'number') {
        return a.number - b.number;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Position order: GK -> DEF -> MID -> FWD
      const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
      return (posOrder[a.position as keyof typeof posOrder] || 0) - 
             (posOrder[b.position as keyof typeof posOrder] || 0);
    });
  };

  const renderPlayers = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Players</CardTitle>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Sort by Number</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="position">Sort by Position</SelectItem>
            </SelectContent>
          </Select>
          {canManageTeam && <CreatePlayerDialog teamId={parsedTeamId} />}
        </div>
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
                <TableCell colSpan={canManageTeam ? 5 : 4} className="text-center text-muted-foreground">
                  No players added yet
                </TableCell>
              </TableRow>
            ) : (
              getSortedPlayers().map(player => (
                <TableRow
                  key={player.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handlePlayerClick(player.id)}
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
              ))
            )}
          </TableBody>
        </Table>
        {selectedPlayer && (
          <PlayerProfileDialog player={selectedPlayer} open={!!selectedPlayerId} onOpenChange={handlePlayerDialogChange} />
        )}
      </CardContent>
    </Card>
  );

  const renderMatches = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="text-center text-muted-foreground">No upcoming matches scheduled</div>
            ) : (
              upcomingMatches.map(match => (
                <div
                  key={match.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  onClick={handleEventClick}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">{match.title}</div>
                      {match.description && (
                        <div className="text-sm text-muted-foreground">{match.description}</div>
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
              <div className="text-center text-muted-foreground">No match results yet</div>
            ) : (
              pastMatches.map(match => (
                <div
                  key={match.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  onClick={handleEventClick}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">{match.title}</div>
                      {match.description && (
                        <div className="text-sm text-muted-foreground">{match.description}</div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">
                          {match.homeScore !== null && match.awayScore !== null ? (
                            <span className="text-primary">{match.homeScore} - {match.awayScore}</span>
                          ) : (
                            <span className="text-muted-foreground text-base">Score pending</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{format(new Date(match.startDate), "PPP")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageTeam && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMatchId(match.id);
                              setLineupDialogOpen(true);
                            }}
                          >
                            Lineup
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMatchId(match.id);
                              setScorersDialogOpen(true);
                            }}
                          >
                            Scorers
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMatchId(match.id);
                              setCardsDialogOpen(true);
                            }}
                          >
                            Cards
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMatchId(match.id);
                              setSubstitutionsDialogOpen(true);
                            }}
                          >
                            Substitutions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMatchId(match.id);
                              setCommentaryDialogOpen(true);
                            }}
                          >
                            Commentary
                          </Button>
                          <EditEventDialog event={match} teamId={parsedTeamId} />
                          <DeleteEventDialog eventId={match.id} teamId={parsedTeamId} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMatchId && (
        <>
          <LineupDialog
            matchId={selectedMatchId}
            teamId={parsedTeamId}
            open={lineupDialogOpen}
            onOpenChange={setLineupDialogOpen}
          />
          <ScorersDialog
            matchId={selectedMatchId}
            teamId={parsedTeamId}
            open={scorersDialogOpen}
            onOpenChange={setScorersDialogOpen}
          />
          <CardsDialog
            matchId={selectedMatchId}
            teamId={parsedTeamId}
            open={cardsDialogOpen}
            onOpenChange={setCardsDialogOpen}
          />
          <SubstitutionsDialog
            matchId={selectedMatchId}
            teamId={parsedTeamId}
            open={substitutionsDialogOpen}
            onOpenChange={setSubstitutionsDialogOpen}
          />
          <CommentaryDialog
            matchId={selectedMatchId}
            teamId={parsedTeamId}
            open={commentaryDialogOpen}
            onOpenChange={setCommentaryDialogOpen}
          />
        </>
      )}
    </div>
  );

  const renderNews = () => {
    const canManageNews = user?.role === "admin";

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
                    <div className="text-sm text-muted-foreground">{nextMatch.description}</div>
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
              {news.length === 0 ? (
                <div className="text-center text-muted-foreground">No news articles yet</div>
              ) : (
                news.map(article => (
                  <div key={article.id} className="p-4 border rounded-lg space-y-2">
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
                      Posted on{" "}
                      {article.createdAt ? format(new Date(article.createdAt), "PPP") : "Unknown date"}
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

  const renderEvents = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events</CardTitle>
        {canManageTeam && <CreateEventDialog teamId={parsedTeamId} />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground">No events scheduled</div>
          ) : (
            events.map(event => (
              <div
                key={event.id}
                className="p-4 border rounded hover:bg-accent transition-colors"
                onClick={handleEventClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{event.type}</div>
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

  return (
    <ErrorBoundary>
      <Layout teamId={parsedTeamId.toString()}>
        <div className="container py-8">
          {section === "players"
            ? renderPlayers()
            : section === "matches"
            ? renderMatches()
            : section === "news"
            ? renderNews()
            : renderEvents()}
        </div>
      </Layout>
    </ErrorBoundary>
  );
}