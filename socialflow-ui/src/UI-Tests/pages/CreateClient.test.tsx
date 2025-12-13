import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateClient from '@/pages/CreateClient';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderCreateClient() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CreateClient />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CreateClient Page', () => {
  describe('Loading State', () => {
    it('should show loading spinner while fetching accounts', () => {
      renderCreateClient();
      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should display Create New Client title', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create New Client' })).toBeInTheDocument();
      });
    });

    it('should have Clients back link', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
      });
    });
  });

  describe('Client Information Section', () => {
    it('should have Client Information card', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Client Information')).toBeInTheDocument();
      });
    });

    it('should have Name input', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      });
    });

    it('should have Slug input', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText(/Slug/)).toBeInTheDocument();
      });
    });

    it('should auto-generate slug from name', async () => {
      const user = userEvent.setup();
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/);
      await user.type(nameInput, 'Berlin Doner');

      const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
      expect(slugInput.value).toBe('berlin-doner');
    });

    it('should have Type select with default value', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
      });

      // Check the select shows the default Restaurant value (multiple due to select options)
      const restaurantElements = screen.getAllByText('Restaurant');
      expect(restaurantElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have Language select', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Language')).toBeInTheDocument();
      });
    });

    it('should have Timezone select', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Timezone')).toBeInTheDocument();
      });
    });
  });

  describe('Link Social Accounts Section', () => {
    it('should have Link Social Accounts card', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Link Social Accounts')).toBeInTheDocument();
      });
    });

    it('should display Late.com accounts description', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText(/Select which Late.com accounts/)).toBeInTheDocument();
      });
    });

    it('should have Instagram Account select', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Instagram Account')).toBeInTheDocument();
      });
    });

    it('should have TikTok Account select', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('TikTok Account')).toBeInTheDocument();
      });
    });
  });

  describe('Posting Schedule Section', () => {
    it('should have Posting Schedule card', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText('Posting Schedule')).toBeInTheDocument();
      });
    });

    it('should display 24-hour format description', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByText(/24-hour format/)).toBeInTheDocument();
      });
    });

    it('should have Feed posts at time input', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText('Feed posts at')).toBeInTheDocument();
      });
    });

    it('should have Story posts at time input', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText('Story posts at')).toBeInTheDocument();
      });
    });

    it('should have default feed time of 20:00', async () => {
      renderCreateClient();

      await waitFor(() => {
        const feedInput = screen.getByLabelText('Feed posts at') as HTMLInputElement;
        expect(feedInput.value).toBe('20:00');
      });
    });

    it('should have default story time of 18:30', async () => {
      renderCreateClient();

      await waitFor(() => {
        const storyInput = screen.getByLabelText('Story posts at') as HTMLInputElement;
        expect(storyInput.value).toBe('18:30');
      });
    });
  });

  describe('Action Buttons', () => {
    it('should have Cancel button', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });
    });

    it('should have Create Client button', async () => {
      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Client' })).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in name and auto-generate slug', async () => {
      const user = userEvent.setup();

      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;

      await user.type(nameInput, 'My Restaurant');

      // Verify the slug is auto-generated
      expect(slugInput.value).toBe('my-restaurant');
    });

    it('should allow editing the slug manually', async () => {
      const user = userEvent.setup();

      renderCreateClient();

      await waitFor(() => {
        expect(screen.getByLabelText(/Slug/)).toBeInTheDocument();
      });

      const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
      await user.type(slugInput, 'custom-slug');

      expect(slugInput.value).toBe('custom-slug');
    });

    it('should have enabled Create Client button', async () => {
      renderCreateClient();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Create Client' });
        expect(submitButton).toBeEnabled();
      });
    });
  });
});
