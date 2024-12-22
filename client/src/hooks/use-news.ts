import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { News, InsertNews } from "@db/schema";
import type { Event } from "@db/types";

type NextMatch = Event & {
  type: "match";
};

export function useNews(teamId: number) {
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery<News[]>({
    queryKey: ['news', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/news`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });

  const { data: nextMatch, isLoading: isLoadingNextMatch } = useQuery<NextMatch | null>({
    queryKey: ['nextMatch', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/next-match`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch next match');
      const data = await response.json();
      return data.type === 'match' ? data as NextMatch : null;
    }
  });

  const createNews = useMutation<News, Error, Omit<InsertNews, 'id' | 'createdAt' | 'createdById'>>({
    mutationFn: async (newNews) => {
      const response = await fetch(`/api/teams/${teamId}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNews),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create news' }));
        throw new Error(error.message || 'Failed to create news');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', teamId] });
    }
  });

  const updateNews = useMutation<News, Error, { id: number } & Partial<InsertNews>>({
    mutationFn: async ({ id, ...data }) => {
      const response = await fetch(`/api/teams/${teamId}/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update news' }));
        throw new Error(error.message || 'Failed to update news');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', teamId] });
    }
  });

  const deleteNews = useMutation<void, Error, number>({
    mutationFn: async (newsId) => {
      const response = await fetch(`/api/teams/${teamId}/news/${newsId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete news' }));
        throw new Error(error.message || 'Failed to delete news');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', teamId] });
    }
  });

  return {
    news,
    nextMatch,
    isLoading,
    isLoadingNextMatch,
    createNews: createNews.mutateAsync,
    updateNews: updateNews.mutateAsync,
    deleteNews: deleteNews.mutateAsync
  };
}