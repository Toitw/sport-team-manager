
import { usePlayerStats } from "@/hooks/use-player-stats";
import { Loader2 } from "lucide-react";

interface PlayerStatsProps {
  playerId: number;
}

export function PlayerStats({ playerId }: PlayerStatsProps) {
  const { data: stats, isLoading } = usePlayerStats(playerId);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <dl className="space-y-2">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Games Played</dt>
        <dd>{stats?.gamesPlayed || 0}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Minutes Played</dt>
        <dd>{stats?.minutesPlayed || 0}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Goals</dt>
        <dd>{stats?.goals || 0}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Yellow Cards</dt>
        <dd>{stats?.yellowCards || 0}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Red Cards</dt>
        <dd>{stats?.redCards || 0}</dd>
      </div>
    </dl>
  );
}
