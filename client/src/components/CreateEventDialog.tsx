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
import { Plus } from "lucide-react";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  type: z.enum(["match", "training", "other"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required")
});

type FormValues = z.infer<typeof formSchema>;

export function CreateEventDialog({ teamId }: { teamId: number }) {
  const [open, setOpen] = useState(false);
  const { createEvent } = useEvents(teamId);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "match",
      startDate: "",
      endDate: "",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (!data.startDate || !data.endDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select both start and end dates"
        });
        return;
      }

      const startDateObj = new Date(data.startDate);
      const endDateObj = new Date(data.endDate);

      // Validate date objects
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid date format. Please use the date picker or enter a valid date"
        });
        return;
      }

      // Validate date order
      if (endDateObj <= startDateObj) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "End date must be after start date"
        });
        return;
      }

      // Create event with validated dates
      await createEvent({
        title: data.title,
        description: data.description || "",
        type: data.type,
        teamId,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString()
      });
      
      toast({
        title: "Success",
        description: "Event created successfully"
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Create event error:", error);
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
                    <Input {...field} value={field.value || ''} placeholder="Event description" />
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
                    <Input 
                      type="datetime-local" 
                      {...field}
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
                      {...field}
                    />
                  </FormControl>
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
