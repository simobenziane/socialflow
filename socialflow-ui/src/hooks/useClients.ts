import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  deleteAllClients,
  archiveClient,
  getArchivedClients,
  restoreClient,
  deleteArchivedClient,
  generateClientConfig,
  createClientFolder,
} from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { CreateClientInput, OnboardingInput } from '@/api/types';

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: getClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClient(slug: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(slug),
    queryFn: () => getClient(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: Partial<CreateClientInput> }) =>
      updateClient(slug, input),
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(slug) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteClient(slug),
    onSuccess: (_data, slug) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      // Remove the deleted client's cached detail
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(slug) });
      // Also invalidate any batches for this client
      queryClient.removeQueries({ queryKey: queryKeys.batches.byClient(slug) });
    },
  });
}

export function useDeleteAllClients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllClients(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.archived });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

// ============================================
// Archive Hooks
// ============================================

export function useArchiveClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => archiveClient(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.archived });
    },
  });
}

export function useArchivedClients() {
  return useQuery({
    queryKey: queryKeys.clients.archived,
    queryFn: getArchivedClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRestoreClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => restoreClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.archived });
    },
  });
}

export function useDeleteArchivedClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteArchivedClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.archived });
    },
  });
}

// ============================================
// AI Config Generation
// ============================================

export function useRegenerateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, onboarding }: { slug: string; onboarding: OnboardingInput }) =>
      generateClientConfig(slug, onboarding),
    onSuccess: (_data, { slug }) => {
      // Invalidate client detail to refetch with new brand data
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

// ============================================
// Folder Creation
// ============================================

export function useCreateClientFolder() {
  return useMutation({
    mutationFn: (slug: string) => createClientFolder(slug),
  });
}
