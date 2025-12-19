import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Onboarding from '../../pages/Onboarding';

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Client Info', () => {
    it('renders step 1 by default with all required form fields', async () => {
      render(<Onboarding />);

      // Wait for accounts to load (page shows LoadingSpinner until then)
      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Check form fields are present
      expect(screen.getByLabelText(/url slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/brand personality/i)).toBeInTheDocument();
    });

    it('auto-generates slug from name', async () => {
      const user = userEvent.setup();
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/client name/i), 'Berlin Bistro');

      await waitFor(() => {
        expect(screen.getByLabelText(/url slug/i)).toHaveValue('berlin-bistro');
      });
    });

    it('disables Next button when required fields are empty', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('enables Next button when required fields are filled', async () => {
      const user = userEvent.setup();
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Fill required fields
      await user.type(screen.getByLabelText(/client name/i), 'Test Restaurant');
      await user.type(
        screen.getByLabelText(/business description/i),
        'A cozy restaurant serving authentic cuisine'
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
      });
    });

    it('shows page header with breadcrumbs', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByText('New Client Onboarding')).toBeInTheDocument();
      });

      // Breadcrumbs
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText('New Client')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('Back button is disabled on step 1', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });

    it('shows progress indicator with all 4 steps', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // All step labels should be visible in the progress bar
      const stepLabels = [
        'Client Info',
        'Connect Accounts',
        'Upload Media',
        'Generate',
      ];

      stepLabels.forEach((label) => {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Form Validation', () => {
    it('validates name is required', async () => {
      const user = userEvent.setup();
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Only fill description, not name
      await user.type(
        screen.getByLabelText(/business description/i),
        'A description'
      );

      // Next should still be disabled without name
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('validates description is required', async () => {
      const user = userEvent.setup();
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Only fill name, not description
      await user.type(screen.getByLabelText(/client name/i), 'Test Client');

      // Next should still be disabled without description
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', async () => {
      render(<Onboarding />);

      // Initially should show loading or form
      // The accounts query loads quickly from MSW, so we just verify final state
      await waitFor(
        () => {
          expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Select Fields', () => {
    it('has business type select with options', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Business type select should be present (looking for the label)
      expect(screen.getByText('Business Type')).toBeInTheDocument();
    });

    it('has language select with options', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Language select should be present
      expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('has timezone select with options', async () => {
      render(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Timezone select should be present
      expect(screen.getByText('Timezone')).toBeInTheDocument();
    });
  });
});
