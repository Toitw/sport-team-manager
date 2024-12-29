import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvents } from "../hooks/use-events";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { z } from "zod";
import type { Event } from "@db/schema";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["match", "training", "other"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  homeScore: z.union([z.coerce.number().int().min(0), z.null()]).optional(),
  awayScore: z.union([z.coerce.number().int().min(0), z.null()]).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface EditEventDialogProps {
  event: Event;
  teamId: number;
  organizationId: number;
}

export function EditEventDialog({ event, teamId, organizationId }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const { updateEvent } = useEvents(teamId);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      type: event.type === "meeting" ? "other" : event.type, // Convert legacy "meeting" type to "other"
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      homeScore: event.homeScore,
      awayScore: event.awayScore
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const startDateObj = new Date(data.startDate);
      const endDateObj = new Date(data.endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid date format"
        });
        return;
      }

      if (endDateObj <= startDateObj) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "End date must be after start date"
        });
        return;
      }

      const updateData = {
        id: event.id,
        title: data.title,
        description: data.description || "",
        type: data.type,
        teamId,
        organizationId,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        homeScore: data.type === "match" ? data.homeScore ?? null : null,
        awayScore: data.type === "match" ? data.awayScore ?? null : null
      };

      await updateEvent(updateData);

      toast({
        title: "Success",
        description: "Event updated successfully"
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Update event error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update event"
      });
    }
  };

  const handleDialogClose = () => {
    form.reset({
      title: event.title,
      description: event.description || "",
      type: event.type === "meeting" ? "other" : event.type,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      homeScore: event.homeScore,
      awayScore: event.awayScore
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Event title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Event description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="match">Match</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date and Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date and Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "match" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="homeScore"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Home Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          {...field}
                          value={value ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            onChange(val === '' ? null : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="awayScore"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Away Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          {...field}
                          value={value ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            onChange(val === '' ? null : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <Button type="submit" className="w-full">Update Event</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}