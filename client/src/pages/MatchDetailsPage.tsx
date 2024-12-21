import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { ShirtIcon, Award, Clock, UserMinus, UserPlus, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MatchDetails {
  lineup: Array<{
    id: number;
    matchId: number;
    playerId: number;
    position: string;
    player?: {
      name: string;
      number: number;
      photoUrl?: string;
    };
  }>;
  scorers: Array<{
    id: number;
    playerId: number;
    minute: number;
    eventType: string;
    player?: {
      name: string;
      number: number;
      photoUrl?: string;
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
      photoUrl?: string;
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
}

const LineupGrid = ({ lineup }: { lineup: MatchDetails['lineup'] }) => {
  const positions = {
    FWD: lineup.filter(p => p.position === 'FWD'),
    MID: lineup.filter(p => p.position === 'MID'),
    DEF: lineup.filter(p => p.position === 'DEF'),
    GK: lineup.filter(p => p.position === 'GK')
  };

  return (
    <div className="relative w-full aspect-[2/3] p-2">
      <div className="h-full flex flex-col justify-between py-2">
        {/* Forwards */}
        <div className="flex justify-center gap-16 px-4">
          {positions.FWD.map((player) => (
              <div 
                key={player.id} 
                className="flex flex-col items-center p-2"
              >
                <div className="w-8 h-8 rounded-md bg-black/50 flex items-center justify-center mb-1 overflow-hidden">
                  {player.player?.photoUrl ? (
                    <img 
                      src={player.player.photoUrl} 
                      alt={player.player?.name || 'Player'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShirtIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    #{player.player?.number || ''}
                  </div>
                  <div className="text-xs text-white/90">
                    {player.player?.name?.split(' ')[0] || 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
        </div>
        {/* Midfielders */}
        <div className="flex justify-center gap-12 px-4">
          {positions.MID.map((player) => (
            <div 
              key={player.id} 
              className="flex flex-col items-center p-1"
            >
              <div className="w-7 h-7 rounded-md bg-black/20 flex items-center justify-center mb-1 overflow-hidden">
                {player.player?.photoUrl ? (
                  <img 
                    src={player.player.photoUrl} 
                    alt={player.player?.name || 'Player'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShirtIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  #{player.player?.number || ''}
                </div>
                <div className="text-xs text-white/90">
                  {player.player?.name?.split(' ')[0] || 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Defenders */}
        <div className="flex justify-center gap-8 px-4">
          {positions.DEF.map((player) => (
            <div 
              key={player.id} 
              className="flex flex-col items-center p-1"
            >
              <div className="w-7 h-7 rounded-md bg-black/20 flex items-center justify-center mb-1 overflow-hidden">
                {player.player?.photoUrl ? (
                  <img 
                    src={player.player.photoUrl} 
                    alt={player.player?.name || 'Player'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShirtIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  #{player.player?.number || ''}
                </div>
                <div className="text-xs text-white/90">
                  {player.player?.name?.split(' ')[0] || 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Goalkeeper */}
        <div className="flex justify-center px-4">
          {positions.GK.map((player) => (
            <div 
              key={player.id} 
              className="flex flex-col items-center p-1"
            >
              <div className="w-7 h-7 rounded-md bg-black/20 flex items-center justify-center mb-1 overflow-hidden">
                {player.player?.photoUrl ? (
                  <img 
                    src={player.player.photoUrl} 
                    alt={player.player?.name || 'Player'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShirtIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  #{player.player?.number || ''}
                </div>
                <div className="text-xs text-white/90">
                  {player.player?.name?.split(' ')[0] || 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MatchEvents = ({ event, matchDetails }: { 
  event: any; 
  matchDetails: MatchDetails;
}) => {
  const isPastMatch = new Date(event.startDate) < new Date();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isPastMatch && (
        <>
          {/* Scorers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchDetails.scorers.map((scorer) => (
                  <div key={scorer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">
                        {scorer.player?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        #{scorer.player?.number}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {scorer.minute}'
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cards Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchDetails.cards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-6 rounded ${
                        card.cardType === 'yellow' ? 'bg-yellow-400' : 'bg-red-600'
                      }`} />
                      <div>
                        <div className="font-semibold">{card.player?.name}</div>
                        <div className="text-sm text-muted-foreground">{card.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {card.minute}'
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Substitutions Section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Substitutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchDetails.substitutions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <UserPlus className="w-4 h-4 text-green-500" />
                        <div className="text-sm font-medium">{sub.playerIn?.name}</div>
                        <div className="text-xs text-muted-foreground">#{sub.playerIn?.number}</div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="flex flex-col items-center">
                        <UserMinus className="w-4 h-4 text-red-500" />
                        <div className="text-sm font-medium">{sub.playerOut?.name}</div>
                        <div className="text-xs text-muted-foreground">#{sub.playerOut?.number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {sub.minute}'
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
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
              {isPastMatch && event.homeScore !== null && event.awayScore !== null && (
                <div className="text-4xl font-bold text-primary">
                  {event.homeScore} - {event.awayScore}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lineup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShirtIcon className="w-5 h-5" />
                Starting Lineup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs mx-auto">
                <LineupGrid lineup={matchDetails.lineup} />
              </div>
            </CardContent>
          </Card>
          
          {/* Match Events */}
          <div className="space-y-6">
            <MatchEvents event={event} matchDetails={matchDetails} />
          </div>
        </div>
      </div>
    </Layout>
  );
}