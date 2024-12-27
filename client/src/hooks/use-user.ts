import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser | { email: string } | { token: string; newPassword: string }
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "X-Requested-With": "XMLHttpRequest"
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          url
        });
        return { ok: false, message: "Server error. Please try again later." };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    console.error('Network error:', {
      url,
      error: e.message
    });
    return { ok: false, message: "Network error. Please check your connection." };
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include',
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }

      if (response.status >= 500) {
        console.error('Server error while fetching user:', {
          status: response.status,
          statusText: response.statusText
        });
      }

      throw new Error(await response.text());
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching user:', {
      error: error.message
    });
    throw error;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      // Only retry twice for other errors
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  const loginMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => handleRequest('/api/forgot-password', 'POST', data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => 
      handleRequest('/api/reset-password', 'POST', data),
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
  };
}