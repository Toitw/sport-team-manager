import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const baseUrl = '/api';
        let endpoint: string;

        if (Array.isArray(queryKey[0])) {
          endpoint = queryKey[0][0] as string;
        } else {
          endpoint = queryKey[0] as string;
        }

        const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        try {
          const res = await fetch(url, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "X-Requested-By": "frontend"
            },
          });

          // Handle development mode
          if (process.env.NODE_ENV === 'development') {
            // In development, always succeed for user endpoint
            if (endpoint === 'user') {
              return {
                id: 1,
                email: "test@example.com",
                role: "admin",
                emailVerified: true,
                createdAt: new Date().toISOString()
              };
            }
          }

          if (!res.ok) {
            if (res.status === 401) {
              return null;
            }

            // Log error details but return null instead of throwing
            console.error('Request failed:', {
              status: res.status,
              statusText: res.statusText,
              url,
              timestamp: new Date().toISOString()
            });

            return null;
          }

          return res.json();
        } catch (error: any) {
          console.error('Query error:', {
            error: error.message,
            url,
            timestamp: new Date().toISOString()
          });
          return null;
        }
      },
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 300000,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        console.error('Mutation error:', error);
      }
    }
  },
});