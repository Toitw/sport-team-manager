
import { useQuery } from '@tanstack/react-query';

export function usePlayerStats(playerId: number) {
  return useQuery({
    queryKey: ['playerStats', playerId],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}/stats`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return response.json();
    }
  });
}
