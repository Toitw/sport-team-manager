import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Player, InsertPlayer } from "@db/schema";

export function usePlayers(teamId: number) {
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/players`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    }
  });

  const createPlayer = useMutation<Player, Error, InsertPlayer>({
    mutationFn: async (newPlayer) => {
      const response = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create player');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    }
  });

  return {
    players,
    isLoading,
    createPlayer: createPlayer.mutateAsync
  };
}
