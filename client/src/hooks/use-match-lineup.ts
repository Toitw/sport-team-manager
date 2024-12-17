import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
}

interface LineupPlayer extends Player {
  isStarter: boolean;
  positionInMatch: string;
}

export function useMatchLineup(matchId: number) {
  const queryClient = useQueryClient();

  const {
    data: lineup,
    isLoading,
    error,
  } = useQuery<LineupPlayer[]>({
    queryKey: ["match", matchId, "lineup"],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/lineup`);
      if (!response.ok) {
        throw new Error("Failed to fetch lineup");
      }
      return response.json();
    },
    enabled: !!matchId,
  });

  const {
    mutate: updateLineup,
    isLoading: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async (players: { playerId: number; isStarter: boolean; positionInMatch: string }[]) => {
      const response = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lineup");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId, "lineup"] });
    },
  });

  return {
    lineup,
    isLoading,
    error,
    updateLineup,
    isUpdating,
    updateError,
  };
}
