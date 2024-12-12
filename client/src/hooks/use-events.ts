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

  const updateEvent = useMutation<Event, Error, { id: number } & Omit<InsertEvent, 'id' | 'createdAt'>>({
    mutationFn: async ({ id, ...data }) => {
      try {
        // Handle scores for match events
        let scores = {
          homeScore: null,
          awayScore: null
        };
        
        if (data.type === 'match') {
          scores = {
            homeScore: data.homeScore === undefined || data.homeScore === null || data.homeScore === '' ? null : Number(data.homeScore),
            awayScore: data.awayScore === undefined || data.awayScore === null || data.awayScore === '' ? null : Number(data.awayScore)
          };
        }

        const response = await fetch(`/api/teams/${teamId}/events/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            startDate: new Date(data.startDate).toISOString(),
            endDate: new Date(data.endDate).toISOString(),
            ...scores
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to update event' }));
          throw new Error(error.message || 'Failed to update event');
        }

        return response.json();
      } catch (error) {
        console.error('Update event error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', teamId] });
    }
  });

  const deleteEvent = useMutation<void, Error, number>({
    mutationFn: async (eventId) => {
      try {
        const response = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to delete event' }));
          throw new Error(error.message || 'Failed to delete event');
        }
      } catch (error) {
        console.error('Delete event error:', error);
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
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync
  };
}
