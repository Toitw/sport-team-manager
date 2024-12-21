import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { format } from "date-fns";
import { useTeams } from "../hooks/use-teams";
import { Layout } from "@/components/Layout";

interface MatchDetails {
  lineup: Array<{
    id: number;
    matchId: number;
    playerId: number;
    position: string;
    createdAt: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  reserves: Array<{
    id: number;
    matchId: number;
    playerId: number;
    createdAt: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  scorers: Array<{
    id: number;
    matchId: number;
    playerId: number;
    minute: number;
    createdAt: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  cards: Array<{
    id: number;
    matchId: number;
    playerId: number;
    type: 'yellow' | 'red';
    minute: number;
    createdAt: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  substitutions: Array<{
    id: number;
    matchId: number;
    playerInId: number;
    playerOutId: number;
    minute: number;
    createdAt: string;
    playerIn?: {
      name: string;
      number: number;
    };
    playerOut?: {
      name: string;
      number: number;
    };
  }>;
}

export default function MatchDetailsPage() {
  const { teamId, matchId } = useParams();
  const { teams } = useTeams();
  const team = teams?.find((t: { id: number }) => t.id === Number(teamId));

  const { data: event } = useQuery({
    queryKey: ["events", teamId, matchId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/events/${matchId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      return res.json();
    }
  });

  const { data: matchDetails } = useQuery<MatchDetails>({
    queryKey: ["match-details", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/details`);
      if (!res.ok) throw new Error('Failed to fetch match details');
      return res.json();
    }
  });

  if (!event || !matchDetails) return <div>Loading...</div>;

  return (
    <Layout teamId={teamId}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
        <Card className="mb-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p>{format(new Date(event.startDate), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p>{event.homeScore ?? 0} - {event.awayScore ?? 0}</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="lineup" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="lineup">Lineup</TabsTrigger>
            <TabsTrigger value="scorers">Scorers</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="substitutions">Substitutions</TabsTrigger>
          </TabsList>
          <TabsContent value="lineup">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Starting Lineup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchDetails.lineup.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <span className="text-sm font-medium">{player.position}</span>
                    <span className="text-sm">
                      #{player.player?.number} - {player.player?.name || `Player ${player.playerId}`}
                    </span>
                  </div>
                ))}
              </div>

              {matchDetails.reserves.length > 0 && (
                <>
                  <h3 className="font-semibold mt-6 mb-4">Reserves</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchDetails.reserves.map((player) => (
                      <div key={player.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="text-sm">
                          #{player.player?.number} - {player.player?.name || `Player ${player.playerId}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="scorers">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Scorers</h3>
              <div className="space-y-2">
                {matchDetails.scorers.map((scorer) => (
                  <div key={scorer.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <span className="text-sm font-medium">{scorer.minute}'</span>
                    <span className="text-sm">
                      {scorer.player?.name || `Player ${scorer.playerId}`} (#{scorer.player?.number})
                    </span>
                  </div>
                ))}
                {matchDetails.scorers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No goals scored yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="cards">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Cards</h3>
              <div className="space-y-2">
                {matchDetails.cards.map((card) => (
                  <div key={card.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <span className="text-sm font-medium">{card.minute}'</span>
                    <div 
                      className={`w-3 h-4 rounded ${
                        card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                      }`} 
                    />
                    <span className="text-sm">
                      {card.player?.name || `Player ${card.playerId}`} (#{card.player?.number})
                    </span>
                  </div>
                ))}
                {matchDetails.cards.length === 0 && (
                  <p className="text-sm text-muted-foreground">No cards shown yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="substitutions">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Substitutions</h3>
              <div className="space-y-2">
                {matchDetails.substitutions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <span className="text-sm font-medium">{sub.minute}'</span>
                    <span className="text-sm">
                      {sub.playerOut?.name || `Player ${sub.playerOutId}`} (#{sub.playerOut?.number})
                      <span className="mx-2">↔️</span>
                      {sub.playerIn?.name || `Player ${sub.playerInId}`} (#{sub.playerIn?.number})
                    </span>
                  </div>
                ))}
                {matchDetails.substitutions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No substitutions made yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}