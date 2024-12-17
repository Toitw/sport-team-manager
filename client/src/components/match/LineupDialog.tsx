import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { usePlayers } from "../../hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface LineupDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LineupDialog({ matchId, teamId, open, onOpenChange }: LineupDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const [lineup, setLineup] = React.useState<Array<{ playerId: number; position: string }>>([]);

  const handleSave = async () => {
    try {
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

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lineup:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Match Lineup</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
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
                      onValueChange={(value) => {
                        const newLineup = [...lineup];
                        newLineup[index].position = value;
                        setLineup(newLineup);
                      }}
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
                      onValueChange={(value) => {
                        const newLineup = [...lineup];
                        newLineup[index].playerId = parseInt(value);
                        setLineup(newLineup);
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
                        setLineup(lineup.filter((_, i) => i !== index));
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
                setLineup([...lineup, { playerId: 0, position: "" }]);
              }}
            >
              Add Player
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Lineup</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
