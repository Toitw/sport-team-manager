import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        try {
          const baseUrl = '/api';  // Always use /api prefix
          const endpoint = Array.isArray(queryKey[0]) ? queryKey[0][0] : queryKey[0];
          const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

          console.log('Sending Request:', url);

          const res = await fetch(url, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            },
          });

          console.log('Received Response:', res.status, url);

          if (!res.ok) {
            // Handle authentication errors
            if (res.status === 401) {
              const error = new Error("Unauthorized: Please log in");
              error.name = 'AuthError';
              throw error;
            }

            if (res.status === 403) {
              const error = new Error("Forbidden: You don't have permission to access this resource");
              error.name = 'AuthError';
              throw error;
            }

            // Handle connection errors
            if (res.status === 0 || !res.status) {
              const error = new Error("Connection failed: Please check your internet connection");
              error.name = 'ConnectionError';
              throw error;
            }

            // Handle server errors
            if (res.status >= 500) {
              console.error('Server error:', {
                status: res.status,
                statusText: res.statusText,
                url
              });
              const error = new Error(`Server error (${res.status}): Please try again later`);
              error.name = 'ServerError';
              throw error;
            }

            // Handle other client errors
            const errorText = await res.text();
            const error = new Error(`Request failed (${res.status}): ${errorText}`);
            error.name = 'ClientError';
            throw error;
          }

          return res.json();
        } catch (error: any) {
          console.error('Query error:', {
            queryKey: endpoint,
            error: error.message,
            name: error.name
          });
          throw error;
        }
      },
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error.name === 'AuthError') {
          return false;
        }
        // Retry connection errors more times
        if (error.name === 'ConnectionError') {
          return failureCount < 3;
        }
        // Only retry twice for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 300000, // Keep unused data in cache for 5 minutes
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error.name === 'AuthError') {
          return false;
        }
        // Only retry once for mutations
        return failureCount < 1;
      },
    }
  },
});