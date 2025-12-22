import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAgentInstructions,
  updateAgentInstruction,
  getAgentSettings,
  updateAgentSettings,
  generateClientConfig,
  generateBatchBrief,
} from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type {
  InstructionScope,
  AgentType,
  OnboardingInput,
  GenerateBriefInput,
} from '@/api/types';

// ============================================
// Agent Instructions Hooks
// ============================================

/**
 * Get system-level agent instructions
 */
export function useAgentInstructions() {
  return useQuery({
    queryKey: queryKeys.agents.instructions.system,
    queryFn: () => getAgentInstructions('system'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get client-level agent instructions
 */
export function useClientInstructions(clientSlug: string) {
  return useQuery({
    queryKey: queryKeys.agents.instructions.byClient(clientSlug),
    queryFn: () => getAgentInstructions('client', clientSlug),
    enabled: !!clientSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get batch-level agent instructions
 */
export function useBatchInstructions(clientSlug: string, batchSlug: string) {
  return useQuery({
    queryKey: queryKeys.agents.instructions.byBatch(clientSlug, batchSlug),
    queryFn: () => getAgentInstructions('batch', `${clientSlug}/${batchSlug}`),
    enabled: !!clientSlug && !!batchSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update an agent instruction
 */
export function useUpdateAgentInstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentType,
      scope,
      instructionKey,
      instructionValue,
      scopeId,
    }: {
      agentType: AgentType;
      scope: InstructionScope;
      instructionKey: string;
      instructionValue: string;
      scopeId?: string | number;
    }) => {
      // Validate scopeId is required for non-system scopes
      if ((scope === 'client' || scope === 'batch') && !scopeId) {
        throw new Error(`scopeId is required for ${scope} scope`);
      }
      return updateAgentInstruction(agentType, scope, instructionKey, instructionValue, scopeId);
    },
    onSuccess: (_, variables) => {
      // Invalidate the appropriate query based on scope
      if (variables.scope === 'system') {
        queryClient.invalidateQueries({ queryKey: queryKeys.agents.instructions.system });
      } else if (variables.scope === 'client' && variables.scopeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.agents.instructions.byClient(String(variables.scopeId)),
        });
      } else if (variables.scope === 'batch' && variables.scopeId) {
        // scopeId for batch is "clientSlug/batchSlug"
        const [clientSlug, batchSlug] = String(variables.scopeId).split('/');
        if (clientSlug && batchSlug) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.agents.instructions.byBatch(clientSlug, batchSlug),
          });
        }
      }
      // Also invalidate all instructions
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.instructions.all });
    },
  });
}

// ============================================
// Agent Settings Hooks
// ============================================

/**
 * Get agent settings (models and master prompts)
 */
export function useAgentSettings() {
  return useQuery({
    queryKey: queryKeys.agents.settings,
    queryFn: getAgentSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update agent settings
 */
export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentType,
      updates,
    }: {
      agentType: AgentType;
      updates: { model?: string; master_prompt?: string };
    }) => updateAgentSettings(agentType, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.settings });
    },
  });
}

// ============================================
// AI Generation Hooks
// ============================================

/**
 * Generate client configuration files using AI
 */
export function useGenerateClientConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, onboarding }: { slug: string; onboarding: OnboardingInput }) =>
      generateClientConfig(slug, onboarding),
    onSuccess: (_, { slug }) => {
      // Invalidate both clients list and the specific client detail
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(slug) });
    },
  });
}

/**
 * Generate batch brief using AI
 */
export function useGenerateBatchBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateBriefInput) => generateBatchBrief(input),
    onSuccess: (_, variables) => {
      // Invalidate batches for this client
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byClient(variables.client),
      });
    },
  });
}
