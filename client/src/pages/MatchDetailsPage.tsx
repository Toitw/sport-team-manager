import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { ArrowDownIcon, ArrowUpIcon, ShirtIcon, Timer } from "lucide-react";

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

const LineupGrid = ({ lineup }: { lineup: MatchDetails['lineup'] }) => {
  // Group players by position
  const positions = {
    GK: lineup.filter(p => p.position === 'GK'),
    DEF: lineup.filter(p => p.position === 'DEF'),
    MID: lineup.filter(p => p.position === 'MID'),
    FWD: lineup.filter(p => p.position === 'FWD')
  };

  return (
    <div className="grid grid-cols-1 gap-8 py-4">
      {Object.entries(positions).map(([position, players]) => (
        <div key={position} className="flex flex-col items-center gap-4">
          <h4 className="text-sm font-semibold text-muted-foreground">{position}</h4>
          <div className="flex justify-center gap-8 flex-wrap">
            {players.map((player) => (
              <div key={player.id} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShirtIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">#{player.player?.number}</div>
                  <div className="text-sm text-muted-foreground">{player.player?.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

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

  if (eventLoading || detailsLoading) {
    return (
      <Layout teamId={teamId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Loading match details...</div>
        </div>
      </Layout>
    );
  }

  if (!event || !matchDetails) {
    return (
      <Layout teamId={teamId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-destructive">Failed to load match details</div>
        </div>
      </Layout>
    );
  }

  const isPastMatch = new Date(event.startDate) < new Date();

  return (
    <Layout teamId={teamId}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Match Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-3xl font-bold text-center">{event.title}</h1>
              <div className="text-lg text-muted-foreground">
                {format(new Date(event.startDate), 'PPP')}
              </div>
              {isPastMatch && (
                <div className="text-4xl font-bold text-primary">
                  {event.homeScore ?? 0} - {event.awayScore ?? 0}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lineup Section */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ShirtIcon className="w-6 h-6" />
              Starting Lineup
            </h2>
            <LineupGrid lineup={matchDetails.lineup} />
          </CardContent>
        </Card>

        {isPastMatch && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Timer className="w-6 h-6" />
                Match Events
              </h2>
              <div className="space-y-4">
                {[
                  ...matchDetails.scorers.map(s => ({
                    minute: s.minute,
                    type: 'goal',
                    content: (
                      <div className="flex items-center gap-2">
                        <span className="font-bold">⚽</span>
                        <span>
                          {s.player?.name}
                          {s.eventType !== 'goal' && ` (${s.eventType.replace('_', ' ')})`}
                        </span>
                      </div>
                    )
                  })),
                  ...matchDetails.cards.map(c => ({
                    minute: c.minute,
                    type: 'card',
                    content: (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-4 rounded-sm ${c.cardType === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span>{c.player?.name}{c.reason && ` - ${c.reason}`}</span>
                      </div>
                    )
                  })),
                  ...matchDetails.substitutions.map(s => ({
                    minute: s.minute,
                    type: 'substitution',
                    content: (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-500">
                          <ArrowUpIcon className="w-4 h-4" />
                          <span>{s.playerIn?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <ArrowDownIcon className="w-4 h-4" />
                          <span>{s.playerOut?.name}</span>
                        </div>
                      </div>
                    )
                  }))
                ].sort((a, b) => a.minute - b.minute).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="min-w-[40px] text-sm font-medium text-muted-foreground">
                      {event.minute}'
                    </div>
                    {event.content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}