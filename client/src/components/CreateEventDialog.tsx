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

  // Helper functions for date handling
  const formatDateForInput = (date: Date): string => {
    try {
      return date.toISOString().slice(0, 16);
    } catch (error) {
      return new Date().toISOString().slice(0, 16);
    }
  };

  const parseDateString = (dateString: string): Date | null => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const getDefaultDates = () => {
    const startDate = new Date();
    startDate.setMinutes(Math.ceil(startDate.getMinutes() / 15) * 15);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    return {
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate)
    };
  };

  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDates();

  const form = useForm<FormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultStart,
      endDate: defaultEnd,
      type: "match",
      teamId
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const startDate = parseDateString(data.startDate);
      const endDate = parseDateString(data.endDate);

      if (!startDate || !endDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter valid dates and times"
        });
        return;
      }

      if (startDate < new Date()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Start date cannot be in the past"
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
      
      const { startDate: newStart, endDate: newEnd } = getDefaultDates();
      form.reset({
        title: "",
        description: "",
        startDate: newStart,
        endDate: newEnd,
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
                      min={formatDateForInput(new Date())}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        field.onChange(newStartDate);
                        
                        // Only update end date if we have a valid start date
                        const startDate = parseDateString(newStartDate);
                        if (startDate) {
                          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                          form.setValue('endDate', formatDateForInput(endDate));
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
                      value={field.value}
                      min={form.getValues('startDate')}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        const endDate = parseDateString(newEndDate);
                        const startDate = parseDateString(form.getValues('startDate'));
                        
                        if (endDate && startDate && endDate > startDate) {
                          field.onChange(newEndDate);
                        } else {
                          field.onChange(field.value); // Keep the previous valid value
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
