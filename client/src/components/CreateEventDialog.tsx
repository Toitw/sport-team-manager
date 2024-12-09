import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@db/schema";
import { useEvents } from "../hooks/use-events";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type FormData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: string;
  teamId: number;
};

export function CreateEventDialog({ teamId }: { teamId: number }) {
  const [open, setOpen] = useState(false);
  const { createEvent } = useEvents(teamId);
  const { toast } = useToast();

  const getDefaultDates = () => {
    const startDate = new Date();
    startDate.setMinutes(Math.ceil(startDate.getMinutes() / 15) * 15);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    return {
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16)
    };
  };

  const form = useForm<FormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      ...getDefaultDates(),
      type: "match",
      teamId
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const now = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          variant: "destructive",
          title: "Invalid Date",
          description: "Please enter valid dates and times"
        });
        return;
      }

      if (startDate < now) {
        toast({
          variant: "destructive",
          title: "Invalid Start Date",
          description: "Start date cannot be in the past"
        });
        return;
      }

      if (endDate <= startDate) {
        toast({
          variant: "destructive",
          title: "Invalid End Date",
          description: "End date must be after start date"
        });
        return;
      }

      await createEvent({
        ...data,
        startDate,
        endDate
      });
      
      toast({
        title: "Success",
        description: "Event created successfully"
      });
      setOpen(false);
      form.reset({
        title: "",
        description: "",
        ...getDefaultDates(),
        type: "match",
        teamId
      });
    } catch (error: any) {
      console.error('Create event error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event for your team.
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date and Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      {...field}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        field.onChange(newStartDate);
                        
                        // Update end date to be 2 hours after start date
                        const startDateTime = new Date(newStartDate);
                        if (!isNaN(startDateTime.getTime())) {
                          const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
                          form.setValue('endDate', endDateTime.toISOString().slice(0, 16));
                        }
                      }}
                    />
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
                    <Input 
                      type="datetime-local"
                      min={form.getValues('startDate')}
                      {...field}
                    />
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
            <Button type="submit" className="w-full">Add Event</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
