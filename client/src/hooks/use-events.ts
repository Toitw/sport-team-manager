import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event, InsertEvent } from "@db/schema";

export function useEvents(teamId: number) {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/events`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const createEvent = useMutation<Event, Error, InsertEvent>({
    mutationFn: async (newEvent) => {
      const response = await fetch(`/api/teams/${teamId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', teamId] });
    }
  });

  return {
    events,
    isLoading,
    createEvent: createEvent.mutateAsync
  };
}
