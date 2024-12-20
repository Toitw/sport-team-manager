import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { usePlayers } from "../../hooks/use-players";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";

interface CardsDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Card {
  playerId: number;
  minute: number;
  cardType: 'yellow' | 'red';
  reason?: string;
}

export function CardsDialog({ matchId, teamId, open, onOpenChange }: CardsDialogProps) {
  const { players = [] } = usePlayers(teamId);
  const { toast } = useToast();
  const [cards, setCards] = React.useState<Card[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && matchId) {
      setIsLoading(true);
      fetch(`/api/matches/${matchId}/details`)
        .then((res) => res.json())
        .then((data) => {
          if (data.cards) {
            setCards(data.cards.map((card: any) => ({
              playerId: card.playerId,
              minute: card.minute,
              cardType: card.cardType,
              reason: card.reason,
            })));
          }
        })
        .catch((error) => {
          console.error("Error loading cards:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load cards data",
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

    // Validate cards data
    const invalidCards = cards.filter(
      card => !card.playerId || card.minute < 0 || card.minute > 120 || !card.cardType
    );

    if (invalidCards.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all card details correctly (valid player, minute between 0-120)",
      });
      return;
    }

    // Check for duplicate players with same card type
    const duplicates = cards.reduce((acc: any[], card, index) => {
      const duplicateCard = cards.find((c, i) => 
        i !== index && 
        c.playerId === card.playerId && 
        c.cardType === card.cardType
      );
      if (duplicateCard) {
        const player = players.find(p => p.id === card.playerId);
        acc.push(`${player?.name || 'Player'} (${card.cardType})`);
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      toast({
        variant: "destructive",
        title: "Duplicate Cards",
        description: `${duplicates[0]} has duplicate cards of the same type`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cards }),
      });

      if (!response.ok) {
        throw new Error("Failed to save cards");
      }

      toast({
        title: "Success",
        description: "Cards saved successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving cards:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save cards",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort players by name to make them easier to find
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Match Cards</DialogTitle>
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
                      <TableHead className="w-1/3">Player</TableHead>
                      <TableHead className="w-16">Minute</TableHead>
                      <TableHead className="w-24">Card</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-20 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={card.playerId ? card.playerId.toString() : ""}
                            onValueChange={(value) => {
                              const newCards = [...cards];
                              newCards[index].playerId = parseInt(value);
                              setCards(newCards);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select player" />
                            </SelectTrigger>
                            <SelectContent>
                              {sortedPlayers.map((player) => (
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
                            value={card.minute}
                            onChange={(e) => {
                              const newCards = [...cards];
                              newCards[index].minute = parseInt(e.target.value) || 0;
                              setCards(newCards);
                            }}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={card.cardType}
                            onValueChange={(value: 'yellow' | 'red') => {
                              const newCards = [...cards];
                              newCards[index].cardType = value;
                              setCards(newCards);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={card.reason || ''}
                            onChange={(e) => {
                              const newCards = [...cards];
                              newCards[index].reason = e.target.value;
                              setCards(newCards);
                            }}
                            placeholder="Enter reason"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setCards(cards.filter((_, i) => i !== index));
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
                    setCards([
                      ...cards,
                      { playerId: 0, minute: 0, cardType: "yellow" },
                    ]);
                  }}
                  disabled={isLoading}
                >
                  Add Card
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
                    disabled={isLoading || cards.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full" />
                        Saving...
                      </>
                    ) : (
                      'Save Cards'
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