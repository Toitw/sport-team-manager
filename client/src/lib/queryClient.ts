import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        try {
          const baseUrl = '/api';  // Always use /api prefix
          const url = `${baseUrl}${queryKey[0].startsWith('/') ? queryKey[0] : `/${queryKey[0]}`}`;
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
              throw new Error("Unauthorized: Please log in");
            }

            if (res.status === 403) {
              throw new Error("Forbidden: You don't have permission to access this resource");
            }

            // Handle server errors
            if (res.status >= 500) {
              console.error('Server error:', {
                status: res.status,
                statusText: res.statusText,
                url
              });
              throw new Error(`Server error (${res.status}): Please try again later`);
            }

            // Handle other client errors
            const errorText = await res.text();
            throw new Error(`Request failed (${res.status}): ${errorText}`);
          }

          return res.json();
        } catch (error) {
          console.error('Query error:', {
            queryKey: queryKey[0],
            error: error instanceof Error ? error.message : "Unknown error"
          });
          throw error;
        }
      },
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && 
            (error.message.includes("401") || error.message.includes("403"))) {
          return false;
        }
        // Only retry twice for network/server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 300000, // Keep unused data in cache for 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && 
            (error.message.includes("401") || error.message.includes("403"))) {
          return false;
        }
        // Only retry once for mutations
        return failureCount < 1;
      },
    }
  },
});