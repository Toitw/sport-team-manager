import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { usePlayers } from "../../hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";

interface ScorersDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Scorer {
  playerId: number;
  minute: number;
  eventType: 'goal' | 'own_goal' | 'penalty';
}

export function ScorersDialog({ matchId, teamId, open, onOpenChange }: ScorersDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const [scorers, setScorers] = React.useState<Scorer[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && matchId) {
      setIsLoading(true);
      fetch(`/api/matches/${matchId}/details`)
        .then((res) => res.json())
        .then((data) => {
          if (data.scorers) {
            setScorers(data.scorers.map((scorer: any) => ({
              playerId: scorer.playerId,
              minute: scorer.minute,
              eventType: scorer.eventType
            })));
          }
        })
        .catch((error) => {
          console.error("Error loading scorers:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [matchId, open]);

  const handleSave = async () => {
    if (!matchId) {
      console.error("Match ID is required");
      return;
    }

    // Validate scorers data
    const invalidScorers = scorers.filter(
      scorer => !scorer.playerId || scorer.minute < 0 || scorer.minute > 120 || !scorer.eventType
    );

    if (invalidScorers.length > 0) {
      console.error("Invalid scorer data detected");
      return;
    }

    setIsLoading(true);
    try {
      // First, delete existing scorers
      const deleteResponse = await fetch(`/api/matches/${matchId}/scorers`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to clear existing scorers");
      }

      // Then save new scorers
      await Promise.all(
        scorers.map((scorer) =>
          fetch(`/api/matches/${matchId}/scorers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(scorer),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to save scorer: ${response.statusText}`);
            }
          })
        ),
      );

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving scorers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Match Scorers</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Minute</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scorers.map((scorer, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={scorer.playerId.toString()}
                      onValueChange={(value) => {
                        const newScorers = [...scorers];
                        newScorers[index].playerId = parseInt(value);
                        setScorers(newScorers);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name} ({player.position} - #{player.number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={scorer.minute}
                      onChange={(e) => {
                        const newScorers = [...scorers];
                        newScorers[index].minute = parseInt(e.target.value);
                        setScorers(newScorers);
                      }}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={scorer.eventType}
                      onValueChange={(value: 'goal' | 'own_goal' | 'penalty') => {
                        const newScorers = [...scorers];
                        newScorers[index].eventType = value;
                        setScorers(newScorers);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="own_goal">Own Goal</SelectItem>
                        <SelectItem value="penalty">Penalty</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setScorers(scorers.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setScorers([
                  ...scorers,
                  { playerId: 0, minute: 0, eventType: "goal" },
                ]);
              }}
            >
              Add Scorer
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Scorers</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
