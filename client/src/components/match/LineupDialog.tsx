import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlayers } from "@/hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface LineupDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineupPlayer {
  playerId: number;
  position: string;
}

export function LineupDialog({ matchId, teamId, open, onOpenChange }: LineupDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const { toast } = useToast();
  const [lineup, setLineup] = React.useState<LineupPlayer[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLineup = React.useCallback(async () => {
    if (!matchId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/details`);
      if (!response.ok) {
        throw new Error("Failed to load lineup");
      }
      const data = await response.json();
      setLineup(
        data.lineup?.map((item: any) => ({
          playerId: item.playerId,
          position: item.position,
        })) || []
      );
    } catch (error) {
      console.error("Error loading lineup:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lineup data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [matchId, toast]);

  React.useEffect(() => {
    if (open && matchId) {
      fetchLineup();
    }
  }, [open, matchId, fetchLineup]);

  const handleSave = React.useCallback(async () => {
    if (!matchId) return;
    
    try {
      if (lineup.some((item) => !item.playerId || !item.position)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all player positions",
        });
        return;
      }

      const response = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players: lineup }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lineup");
      }

      toast({
        title: "Success",
        description: "Lineup saved successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lineup:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save lineup",
      });
    }
  }, [matchId, lineup, toast, onOpenChange]);

  const addPlayer = React.useCallback(() => {
    setLineup(prev => [...prev, { playerId: 0, position: "" }]);
  }, []);

  const removePlayer = React.useCallback((index: number) => {
    setLineup(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updatePlayer = React.useCallback((index: number, field: keyof LineupPlayer, value: string) => {
    setLineup(prev => {
      const newLineup = [...prev];
      if (field === "playerId") {
        newLineup[index].playerId = parseInt(value);
      } else {
        newLineup[index].position = value;
      }
      return newLineup;
    });
  }, []);

  const handleDialogChange = React.useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setLineup([]);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Match Lineup</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineup.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.position}
                          onValueChange={(value) => updatePlayer(index, "position", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GK">Goalkeeper</SelectItem>
                            <SelectItem value="DEF">Defender</SelectItem>
                            <SelectItem value="MID">Midfielder</SelectItem>
                            <SelectItem value="FWD">Forward</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.playerId.toString()}
                          onValueChange={(value) => updatePlayer(index, "playerId", value)}
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
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePlayer(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={addPlayer}>
                  Add Player
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Lineup</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
