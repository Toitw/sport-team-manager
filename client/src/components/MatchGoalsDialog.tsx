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
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { usePlayers } from "../hooks/use-players";
import { useMatchGoals } from "../hooks/use-match-goals";

interface MatchGoalsDialogProps {
  matchId: number;
  teamId: number;
}

export function MatchGoalsDialog({ matchId, teamId }: MatchGoalsDialogProps) {
  // Hooks at top level, no conditions
  const [open, setOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<string>("");
  const [minute, setMinute] = React.useState<string>("");

  const { players = [], isLoading: playersLoading } = usePlayers(teamId);
  const { goals = [], addGoal, isLoading: goalsLoading } = useMatchGoals(matchId);

  const isLoading = playersLoading || goalsLoading;

  const handleAddGoal = React.useCallback(async () => {
    if (!selectedPlayer || !minute) return;
    try {
      await addGoal({
        playerId: parseInt(selectedPlayer),
        minute: parseInt(minute),
      });
      setSelectedPlayer("");
      setMinute("");
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  }, [addGoal, minute, selectedPlayer]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Goals</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Match Goals</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Current Goals</h3>
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals recorded</p>
              ) : (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between border p-2 rounded"
                    >
                      <span>
                        {goal.playerName} ({goal.playerNumber})
                      </span>
                      <span>{goal.minute}'</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Add Goal</h3>
              <div className="flex gap-2">
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.number} - {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Minute"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-24"
                />
                <Button onClick={handleAddGoal}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
