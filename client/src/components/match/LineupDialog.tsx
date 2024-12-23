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
    if (!matchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Match ID is required",
      });
      return;
    }

    if (lineup.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one player to the lineup",
      });
      return;
    }
    
    try {
      // Validate lineup data
      const invalidPlayers = lineup.filter(
        (item) => !item.playerId || !item.position
      );
      
      if (invalidPlayers.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select both position and player for all entries",
        });
        return;
      }

      // Check for duplicate players
      const playerIds = lineup.map(item => item.playerId);
      const duplicatePlayer = playerIds.find(
        (id, index) => playerIds.indexOf(id) !== index
      );
      
      if (duplicatePlayer) {
        const player = players.find(p => p.id === duplicatePlayer);
        toast({
          variant: "destructive",
          title: "Duplicate Player",
          description: `${player?.name || 'Player'} is selected multiple times`,
        });
        return;
      }

      setIsLoading(true);
      const response = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players: lineup }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to save lineup");
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
        description: error instanceof Error ? error.message : "Failed to save lineup",
      });
    } finally {
      setIsLoading(false);
    }
  }, [matchId, lineup, players, toast, onOpenChange, setIsLoading]);

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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Match Lineup</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex-1 overflow-y-auto flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-1/3">Position</TableHead>
                      <TableHead className="w-1/2">Player</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
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
              </div>
              <div className="flex justify-between py-4 px-2 border-t mt-4 bg-background sticky bottom-0">
                <Button variant="outline" onClick={addPlayer} size="sm">
                  Add Player
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isLoading || lineup.length === 0}>
                    Save Lineup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}