import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Organization, InsertOrganization, OrganizationMember } from "@db/schema";
import { useToast } from './use-toast';

type RequestResult = {
  ok: true;
  data?: Organization | OrganizationMember[];
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertOrganization | { userId: number; role: string }
): Promise<RequestResult> {
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
      const result = await handleRequest(`/api/organizations/${organizationId}`, 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data as Organization;
    },
    enabled: !!organizationId
  });

  // Fetch organization members
  const { data: members } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await handleRequest(`/api/organizations/${organizationId}/members`, 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data as OrganizationMember[];
    },
    enabled: !!organizationId
  });

  // Create organization mutation
  const createOrganization = useMutation({
    mutationFn: async (data: InsertOrganization) => {
      const result = await handleRequest('/api/organizations', 'POST', data);
      if (!result.ok) throw new Error(result.message);
      return result.data as Organization;
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
  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      if (!organizationId) throw new Error("Organization ID is required");
      const result = await handleRequest(`/api/organizations/${organizationId}/members`, 'POST', { userId, role });
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
  const updateMemberRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      if (!organizationId) throw new Error("Organization ID is required");
      const result = await handleRequest(`/api/organizations/${organizationId}/members/${userId}`, 'PATCH', { role });
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
    createOrganization: createOrganization.mutateAsync,
    addMember: addMember.mutateAsync,
    updateMemberRole: updateMemberRole.mutateAsync,
  };
}

export function useOrganizations() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const result = await handleRequest('/api/organizations', 'GET');
      if (!result.ok) throw new Error(result.message);
      return result.data as Organization[];
    }
  });

  return {
    organizations: organizations || [],
    isLoading
  };
}
