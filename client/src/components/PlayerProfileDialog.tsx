import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Player } from "@db/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PlayerProfileDialogProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerProfileDialog({ player, open, onOpenChange }: PlayerProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Player Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {player.photoUrl ? (
              <img 
                src={player.photoUrl} 
                alt={player.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-4xl text-muted-foreground">{player.name[0]}</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Basic Information</h3>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{player.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Number</dt>
                  <dd>#{player.number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Position</dt>
                  <dd>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                      player.position === "GK" ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                      player.position === "DEF" ? "bg-green-50 text-green-700 ring-green-600/20" :
                      player.position === "MID" ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" :
                      "bg-red-50 text-red-700 ring-red-600/20"
                    )}>
                      {player.position}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Member Since</dt>
                  <dd>{player.createdAt ? format(new Date(player.createdAt), "PPP") : "Unknown"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
