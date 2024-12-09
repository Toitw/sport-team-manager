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

  // Helper function to format date to datetime-local input format
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  const defaultStartDate = new Date();
  const defaultEndDate = new Date(defaultStartDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  const form = useForm<FormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: formatDateForInput(defaultStartDate),
      endDate: formatDateForInput(defaultEndDate),
      type: "match",
      teamId
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Parse dates from the form
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid date format"
        });
        return;
      }

      if (endDate <= startDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "End date must be after start date"
        });
        return;
      }

      // Submit event with proper date objects
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
      
      // Reset form with new default dates
      const newStartDate = new Date();
      const newEndDate = new Date(newStartDate.getTime() + 2 * 60 * 60 * 1000);
      form.reset({
        title: "",
        description: "",
        startDate: formatDateForInput(newStartDate),
        endDate: formatDateForInput(newEndDate),
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
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // Update end date to be 2 hours after start date when start date changes
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                        form.setValue('endDate', formatDateForInput(endDate));
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
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      min={form.getValues('startDate')}
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
