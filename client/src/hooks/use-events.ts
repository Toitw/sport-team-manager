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

  const createEvent = useMutation<Event, Error, Omit<InsertEvent, 'id' | 'createdAt'>>({
    mutationFn: async (newEvent) => {
      try {
        const response = await fetch(`/api/teams/${teamId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newEvent,
            startDate: new Date(newEvent.startDate).toISOString(),
            endDate: new Date(newEvent.endDate).toISOString()
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to create event' }));
          throw new Error(error.message || 'Failed to create event');
        }

        return response.json();
      } catch (error) {
        console.error('Create event error:', error);
        throw error;
      }
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
