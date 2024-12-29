import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Organization, InsertOrganization } from "@db/schema";
import { useToast } from './use-toast';

export type OrganizationMember = {
  id: number;
  userId: number;
  organizationId: number;
  role: string;
  createdAt: string;
  userEmail: string;
};

type RequestResult<T = any> = {
  ok: true;
  data: T;
} | {
  ok: false;
  message: string;
};

async function handleRequest<T>(
  url: string,
  method: string,
  body?: InsertOrganization | { userId: number; role: string }
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "X-Requested-With": "XMLHttpRequest",
        "X-Requested-By": "frontend"
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          timestamp: new Date().toISOString()
        });
        return { ok: false, message: "Server error. Please try again later." };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (e: any) {
    console.error('Network error:', {
      url,
      error: e.message,
      timestamp: new Date().toISOString()
    });
    return { ok: false, message: e.message };
  }
}

export function useOrganization(organizationId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch organization details
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const result = await handleRequest<Organization>(`/api/organizations/${organizationId}`, 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: !!organizationId
  });

  // Fetch organization members
  const { data: members } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await handleRequest<OrganizationMember[]>(`/api/organizations/${organizationId}/members`, 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: !!organizationId
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: InsertOrganization) => {
      const result = await handleRequest<Organization>('/api/organizations', 'POST', data);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: "Success",
        description: "Organization created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      if (!organizationId) throw new Error("Organization ID is required");
      const result = await handleRequest<OrganizationMember>(`/api/organizations/${organizationId}/members`, 'POST', { userId, role });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      toast({
        title: "Success",
        description: "Member added successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      if (!organizationId) throw new Error("Organization ID is required");
      const result = await handleRequest<OrganizationMember>(
        `/api/organizations/${organizationId}/members/${userId}`,
        'PATCH',
        { userId, role }
      );
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      toast({
        title: "Success",
        description: "Member role updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  return {
    organization,
    members,
    isLoading,
    createOrganization: createOrganizationMutation.mutateAsync,
    addMember: addMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
  };
}

export function useOrganizations() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const result = await handleRequest<Organization[]>('/api/organizations', 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data;
    }
  });

  return {
    organizations: organizations || [],
    isLoading
  };
}