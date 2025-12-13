import { describe, it, expect } from 'vitest';
import {
  getHealth,
  getClients,
  getClient,
  createClient,
  getAccounts,
  syncAccounts,
  getBatches,
  getBatchStatus,
  triggerIngest,
  triggerGenerate,
  triggerSchedule,
  getSettings,
  updateSettings,
} from '@/api/client';
import {
  mockHealthResponse,
  mockClientsResponse,
  mockClientResponse,
  mockAccountsResponse,
  mockBatchesResponse,
  mockBatchStatusResponse,
  mockSettingsResponse,
} from '../mocks/handlers';

describe('API Client', () => {
  describe('Health', () => {
    it('should fetch health status', async () => {
      const result = await getHealth();
      expect(result).toEqual(mockHealthResponse);
      expect(result.status).toBe('ok');
      expect(result.service).toBe('socialflow-api');
    });
  });

  describe('Clients', () => {
    it('should fetch all clients', async () => {
      const result = await getClients();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].slug).toBe('berlin-doner');
    });

    it('should fetch a single client by slug', async () => {
      const result = await getClient('berlin-doner');
      expect(result.success).toBe(true);
      expect(result.data.slug).toBe('berlin-doner');
      expect(result.data.name).toBe('Berlin Doner');
    });

    it('should create a new client', async () => {
      const input = {
        name: 'Test Client',
        slug: 'test-client',
        type: 'restaurant',
        language: 'en',
        timezone: 'UTC',
      };
      const result = await createClient(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Accounts', () => {
    it('should fetch all accounts', async () => {
      const result = await getAccounts();
      expect(result.success).toBe(true);
      expect(result.data.accounts).toHaveLength(3);
      expect(result.data.profiles).toHaveLength(1);
      expect(result.data.accounts[0].platform).toBe('instagram');
      expect(result.data.accounts[1].platform).toBe('tiktok');
    });

    it('should sync accounts', async () => {
      const result = await syncAccounts();
      expect(result.success).toBe(true);
      expect(result.workflow).toBe('W0-Sync');
    });
  });

  describe('Batches', () => {
    it('should fetch batches for a client', async () => {
      const result = await getBatches('berlin-doner');
      expect(result.success).toBe(true);
      expect(result.data.client).toBe('berlin-doner');
      expect(result.data.batches).toHaveLength(2);
      expect(result.data.batches[0].name).toBe('december');
    });

    it('should fetch batch status', async () => {
      const result = await getBatchStatus('berlin-doner', 'december');
      expect(result.success).toBe(true);
      expect(result.data.counts.total).toBe(10);
      expect(result.data.counts.needs_review).toBe(3);
      expect(result.data.counts.approved).toBe(5);
    });
  });

  describe('Workflow Triggers', () => {
    it('should trigger ingest workflow', async () => {
      const result = await triggerIngest('berlin-doner', 'december');
      expect(result.success).toBe(true);
      expect(result.workflow).toBe('W1-Ingest');
    });

    it('should trigger generate workflow', async () => {
      const result = await triggerGenerate('berlin-doner', 'december');
      expect(result.success).toBe(true);
      expect(result.workflow).toBe('W2-Captions');
    });

    it('should trigger schedule workflow', async () => {
      const result = await triggerSchedule('berlin-doner', 'december');
      expect(result.success).toBe(true);
      expect(result.workflow).toBe('W3-Schedule');
    });
  });

  describe('Settings', () => {
    it('should fetch settings', async () => {
      const result = await getSettings();
      expect(result.success).toBe(true);
      expect(result.data.cloudflare_tunnel_url).toBeDefined();
      expect(result.data.ollama.model).toBe('llava:7b');
    });

    it('should update settings', async () => {
      const result = await updateSettings({ cloudflare_tunnel_url: 'https://new-url.com' });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Settings updated');
    });
  });
});
