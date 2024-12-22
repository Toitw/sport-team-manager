import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Team } from "@db/schema";

export function useTeams() {
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  const createTeam = useMutation<Team, Error, { name: string }>({
    mutationFn: async (newTeam) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      console.error('Create team mutation error:', error);
      throw error;
    }
  });

  return {
    teams,
    isLoading,
    createTeam: createTeam.mutateAsync
  };
}
