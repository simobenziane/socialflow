import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadFile,
  uploadFiles,
  completeOnboarding,
  createBatch,
} from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { OnboardingCompleteInput } from '@/api/types';

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      batchId,
      file,
    }: {
      clientId: number;
      batchId: number | null;
      file: File;
    }) => uploadFile(clientId, batchId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      batchId,
      files,
      onProgress,
    }: {
      clientId: number;
      batchId: number | null;
      files: File[];
      onProgress?: (uploaded: number, total: number) => void;
    }) => uploadFiles(clientId, batchId, files, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OnboardingCompleteInput) => completeOnboarding(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byClient(data.data.client_slug),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      name,
      description,
    }: {
      clientId: number;
      name: string;
      description?: string;
    }) => createBatch(clientId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
