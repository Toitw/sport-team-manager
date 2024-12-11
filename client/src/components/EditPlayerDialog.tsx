import { useState } from "react";
import { useForm } from "react-hook-form";
import { usePlayers } from "@/hooks/use-players";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlayerSchema, type InsertPlayer } from "@db/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

export function EditPlayerDialog({ player, teamId }: { player: any; teamId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertPlayer>({
    resolver: zodResolver(insertPlayerSchema),
    defaultValues: {
      teamId,
      name: player.name,
      position: player.position,
      number: player.number
    }
  });

  const { updatePlayer } = usePlayers(teamId);

  const onSubmit = async (data: InsertPlayer) => {
    try {
      await updatePlayer({ id: player.id, ...data });
      toast({
        title: "Success",
        description: "Player updated successfully"
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update player information using the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GK">Goalkeeper</SelectItem>
                      <SelectItem value="DEF">Defender</SelectItem>
                      <SelectItem value="MID">Midfielder</SelectItem>
                      <SelectItem value="FWD">Forward</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jersey Number</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Update Player</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
