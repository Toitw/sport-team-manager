import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { usePlayers } from "../hooks/use-players";
import { useMatchLineup } from "../hooks/use-match-lineup";

interface MatchLineupDialogProps {
  matchId: number;
  teamId: number;
}

export function MatchLineupDialog({ matchId, teamId }: MatchLineupDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { players = [], isLoading: playersLoading } = usePlayers(teamId);
  const { lineup, updateLineup, isLoading: lineupLoading } = useMatchLineup(matchId);
  const [selectedPlayers, setSelectedPlayers] = React.useState<Array<{
    playerId: number;
    isStarter: boolean;
    positionInMatch: string;
  }>>([]);

  React.useEffect(() => {
    if (lineup) {
      setSelectedPlayers(
        lineup.map((player) => ({
          playerId: player.id,
          isStarter: player.isStarter,
          positionInMatch: player.positionInMatch,
        }))
      );
    }
  }, [lineup]);

  const handleSave = async () => {
    try {
      await updateLineup(selectedPlayers);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update lineup:", error);
    }
  };

  const isLoading = playersLoading || lineupLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Lineup</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Match Lineup</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Starting Lineup</h3>
                <div className="space-y-2">
                  {Array.from({ length: 11 }).map((_, index) => (
                    <div key={`starter-${index}`} className="flex gap-2">
                      <Select
                        value={
                          selectedPlayers.find(
                            (p) => p.isStarter && Number(p.positionInMatch.split("-")[1]) === index + 1
                          )?.playerId.toString() || ""
                        }
                        onValueChange={(value) => {
                          setSelectedPlayers((prev) => {
                            const newPlayers = prev.filter(
                              (p) => !(p.isStarter && Number(p.positionInMatch.split("-")[1]) === index + 1)
                            );
                            if (value) {
                              newPlayers.push({
                                playerId: Number(value),
                                isStarter: true,
                                positionInMatch: `starter-${index + 1}`,
                              });
                            }
                            return newPlayers;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Player ${index + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.number} - {player.name} ({player.position})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Reserves</h3>
                <div className="space-y-2">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={`reserve-${index}`} className="flex gap-2">
                      <Select
                        value={
                          selectedPlayers.find(
                            (p) => !p.isStarter && Number(p.positionInMatch.split("-")[1]) === index + 1
                          )?.playerId.toString() || ""
                        }
                        onValueChange={(value) => {
                          setSelectedPlayers((prev) => {
                            const newPlayers = prev.filter(
                              (p) => !(!p.isStarter && Number(p.positionInMatch.split("-")[1]) === index + 1)
                            );
                            if (value) {
                              newPlayers.push({
                                playerId: Number(value),
                                isStarter: false,
                                positionInMatch: `reserve-${index + 1}`,
                              });
                            }
                            return newPlayers;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Reserve ${index + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.number} - {player.name} ({player.position})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Lineup</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
