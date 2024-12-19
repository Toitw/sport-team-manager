import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useToast } from "../../hooks/use-toast";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface CommentaryDialogProps {
  matchId: number;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Commentary {
  minute: number;
  type: 'highlight' | 'commentary';
  content: string;
}

export function CommentaryDialog({ matchId, teamId, open, onOpenChange }: CommentaryDialogProps) {
  const { toast } = useToast();
  const [commentary, setCommentary] = React.useState<Commentary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState<Commentary>({
    minute: 0,
    type: 'commentary',
    content: ''
  });

  React.useEffect(() => {
    if (open && matchId) {
      setIsLoading(true);
      fetch(`/api/matches/${matchId}/commentary`)
        .then((res) => res.json())
        .then((data) => {
          setCommentary(data);
        })
        .catch((error) => {
          console.error("Error loading commentary:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load match commentary",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [matchId, open, toast]);

  const handleAddEntry = async () => {
    if (!matchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Match ID is required",
      });
      return;
    }

    if (newEntry.minute < 0 || newEntry.minute > 120) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Minute must be between 0 and 120",
      });
      return;
    }

    if (!newEntry.content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Content is required",
      });
      return;
    }

    try {
      const response = await fetch(`/api/matches/${matchId}/commentary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        throw new Error("Failed to add commentary");
      }

      const addedEntry = await response.json();
      setCommentary([...commentary, addedEntry]);
      setNewEntry({
        minute: 0,
        type: 'commentary',
        content: ''
      });

      toast({
        title: "Success",
        description: "Commentary added successfully",
      });
    } catch (error) {
      console.error("Error adding commentary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add commentary",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Match Commentary & Highlights</DialogTitle>
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
                      <TableHead className="w-24">Minute</TableHead>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead>Content</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commentary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No commentary added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      commentary.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.minute}'</TableCell>
                          <TableCell className="capitalize">{entry.type}</TableCell>
                          <TableCell>{entry.content}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-4 py-4 px-2 border-t mt-4 bg-background sticky bottom-0">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={newEntry.minute}
                      onChange={(e) => setNewEntry({ ...newEntry, minute: parseInt(e.target.value) || 0 })}
                      placeholder="Minute"
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={newEntry.type}
                      onValueChange={(value: 'highlight' | 'commentary') => setNewEntry({ ...newEntry, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commentary">Commentary</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-7">
                    <Textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      placeholder="Enter commentary or highlight details..."
                      className="h-20"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEntry}
                    disabled={isLoading || !newEntry.content.trim()}
                  >
                    Add Entry
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
