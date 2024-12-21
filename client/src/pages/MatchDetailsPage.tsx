import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { format } from "date-fns";
import { Layout } from "../components/Layout";
import { Separator } from "../components/ui/separator";

interface MatchDetails {
  lineup: Array<{
    id: number;
    matchId: number;
    playerId: number;
    position: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  scorers: Array<{
    id: number;
    playerId: number;
    minute: number;
    eventType: 'goal' | 'own_goal' | 'penalty';
    player?: {
      name: string;
      number: number;
    };
  }>;
  cards: Array<{
    id: number;
    playerId: number;
    cardType: 'yellow' | 'red';
    minute: number;
    reason?: string;
    player?: {
      name: string;
      number: number;
    };
  }>;
  substitutions: Array<{
    id: number;
    minute: number;
    playerInId: number;
    playerOutId: number;
    playerIn?: {
      name: string;
      number: number;
    };
    playerOut?: {
      name: string;
      number: number;
    };
  }>;
  commentary: Array<{
    id: number;
    minute: number;
    type: 'highlight' | 'commentary';
    content: string;
  }>;
}

export default function MatchDetailsPage() {
  const { teamId, matchId } = useParams();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["events", teamId, matchId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/events/${matchId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      return res.json();
    }
  });

  const { data: matchDetails, isLoading: detailsLoading } = useQuery<MatchDetails>({
    queryKey: ["match-details", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/details`);
      if (!res.ok) throw new Error('Failed to fetch match details');
      return res.json();
    }
  });

  if (eventLoading || detailsLoading) return <div>Loading...</div>;
  if (!event || !matchDetails) return <div>Match not found</div>;

  return (
    <Layout teamId={teamId}>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

        {/* Match Overview */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p>{format(new Date(event.startDate), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-xl font-bold">{event.homeScore ?? 0} - {event.awayScore ?? 0}</p>
            </div>
          </div>
        </Card>

        {/* Starting Lineup */}
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
        </Card>

        {/* Scorers */}
        {matchDetails.scorers.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Scorers</h3>
            <div className="space-y-2">
              {matchDetails.scorers.map((scorer) => (
                <div key={scorer.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{scorer.minute}'</span>
                  <span className="text-sm">
                    {scorer.player?.name || `Player ${scorer.playerId}`}
                    {scorer.eventType !== 'goal' && ` (${scorer.eventType.replace('_', ' ')})`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cards */}
        {matchDetails.cards.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Cards</h3>
            <div className="space-y-2">
              {matchDetails.cards.map((card) => (
                <div key={card.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{card.minute}'</span>
                  <div className={`w-3 h-3 rounded-sm ${card.cardType === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                  <span className="text-sm">
                    {card.player?.name || `Player ${card.playerId}`}
                    {card.reason && ` - ${card.reason}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Substitutions */}
        {matchDetails.substitutions.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Substitutions</h3>
            <div className="space-y-2">
              {matchDetails.substitutions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{sub.minute}'</span>
                  <span className="text-sm">
                    ↑ {sub.playerIn?.name || `Player ${sub.playerInId}`}
                    <Separator className="mx-2" orientation="vertical" />
                    ↓ {sub.playerOut?.name || `Player ${sub.playerOutId}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Commentary */}
        {matchDetails.commentary.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Match Commentary</h3>
            <div className="space-y-4">
              {matchDetails.commentary.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{comment.minute}'</span>
                  <p className={`text-sm ${comment.type === 'highlight' ? 'font-medium' : ''}`}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}