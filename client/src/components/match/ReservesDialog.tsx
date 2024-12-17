import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { usePlayers } from "../../hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ReservesDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservesDialog({ matchId, teamId, open, onOpenChange }: ReservesDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const [reserves, setReserves] = React.useState<number[]>([]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/reserves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players: reserves }),
      });

      if (!response.ok) {
        throw new Error("Failed to save reserves");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving reserves:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Reserve Players</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reserves.map((playerId, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={playerId.toString()}
                      onValueChange={(value) => {
                        const newReserves = [...reserves];
                        newReserves[index] = parseInt(value);
                        setReserves(newReserves);
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setReserves(reserves.filter((_, i) => i !== index));
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
                setReserves([...reserves, 0]);
              }}
            >
              Add Reserve
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Reserves</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
