import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { usePlayers } from "../../hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";

interface SubstitutionsDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Substitution {
  playerOutId: number;
  playerInId: number;
  minute: number;
  half: 1 | 2;
}

export function SubstitutionsDialog({ matchId, teamId, open, onOpenChange }: SubstitutionsDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = React.useState<Substitution[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && matchId) {
      setIsLoading(true);
      fetch(`/api/matches/${matchId}/details`)
        .then((res) => res.json())
        .then((data) => {
          if (data.substitutions) {
            setSubstitutions(data.substitutions.map((sub: any) => ({
              playerOutId: sub.playerOutId ?? 0,
              playerInId: sub.playerInId ?? 0,
              minute: sub.minute ?? 0,
              half: sub.half ?? 1,
            })));
          }
        })
        .catch((error) => {
          console.error("Error loading substitutions:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load substitutions data",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [matchId, open, toast]);

  const handleSave = async () => {
    if (!matchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Match ID is required",
      });
      return;
    }

    // Validate substitutions data
    const invalidSubs = substitutions.filter(
      sub => !sub.playerOutId || !sub.playerInId || sub.minute < 0 || sub.minute > 120 || !sub.half
    );

    if (invalidSubs.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all substitution details correctly (valid players, minute between 0-120)",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/substitutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ substitutions }),
      });

      if (!response.ok) {
        throw new Error("Failed to save substitutions");
      }

      toast({
        title: "Success",
        description: "Substitutions saved successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving substitutions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save substitutions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Match Substitutions</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
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
                      <TableHead className="w-1/3">Player Out</TableHead>
                      <TableHead className="w-1/3">Player In</TableHead>
                      <TableHead className="w-16">Minute</TableHead>
                      <TableHead className="w-24">Half</TableHead>
                      <TableHead className="w-20 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {substitutions.map((sub, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={(sub.playerOutId ?? 0).toString()}
                            onValueChange={(value) => {
                              const newSubs = [...substitutions];
                              newSubs[index].playerOutId = parseInt(value);
                              setSubstitutions(newSubs);
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
                          <Select
                            value={(sub.playerInId ?? 0).toString()}
                            onValueChange={(value) => {
                              const newSubs = [...substitutions];
                              newSubs[index].playerInId = parseInt(value);
                              setSubstitutions(newSubs);
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
                            value={sub.minute}
                            onChange={(e) => {
                              const newSubs = [...substitutions];
                              newSubs[index].minute = parseInt(e.target.value) || 0;
                              setSubstitutions(newSubs);
                            }}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={sub.half.toString()}
                            onValueChange={(value) => {
                              const newSubs = [...substitutions];
                              newSubs[index].half = parseInt(value) as 1 | 2;
                              setSubstitutions(newSubs);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select half" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">First</SelectItem>
                              <SelectItem value="2">Second</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSubstitutions(substitutions.filter((_, i) => i !== index));
                            }}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubstitutions([
                      ...substitutions,
                      { playerOutId: 0, playerInId: 0, minute: 0, half: 1 },
                    ]);
                  }}
                  disabled={isLoading}
                >
                  Add Substitution
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading || substitutions.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full" />
                        Saving...
                      </>
                    ) : (
                      'Save Substitutions'
                    )}
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
