import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Goal {
  id: number;
  playerId: number;
  minute: number;
  playerName: string;
  playerNumber: number;
}

export function useMatchGoals(matchId: number) {
  const queryClient = useQueryClient();

  const {
    data: goals,
    isLoading,
    error,
  } = useQuery<Goal[]>({
    queryKey: ["match", matchId, "goals"],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/goals`);
      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }
      return response.json();
    },
    enabled: !!matchId,
  });

  const {
    mutate: addGoal,
    isLoading: isAdding,
    error: addError,
  } = useMutation({
    mutationFn: async ({ playerId, minute }: { playerId: number; minute: number }) => {
      const response = await fetch(`/api/matches/${matchId}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, minute }),
      });

      if (!response.ok) {
        throw new Error("Failed to add goal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId, "goals"] });
    },
  });

  return {
    goals,
    isLoading,
    error,
    addGoal,
    isAdding,
    addError,
  };
}
