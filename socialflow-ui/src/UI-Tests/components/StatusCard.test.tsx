import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusCard } from '@/components/StatusCard';
import { Clock, CheckCircle, AlertCircle, Eye, Sparkles, Calendar } from 'lucide-react';

describe('StatusCard', () => {
  describe('Basic Rendering', () => {
    it('should render title', () => {
      render(<StatusCard title="Pending" count={5} icon={Clock} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render count', () => {
      render(<StatusCard title="Pending" count={5} icon={Clock} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render zero count', () => {
      render(<StatusCard title="Failed" count={0} icon={AlertCircle} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render large count', () => {
      render(<StatusCard title="Total" count={999} icon={CheckCircle} />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('should render description when provided', () => {
      render(
        <StatusCard
          title="Needs Review"
          count={3}
          icon={Eye}
          description="Ready for approval"
        />
      );
      expect(screen.getByText('Ready for approval')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<StatusCard title="Pending" count={5} icon={Clock} />);
      expect(screen.queryByText(/ready|waiting|processed/i)).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<StatusCard title="Pending" count={5} icon={Clock} />);
      const countElement = screen.getByText('5');
      expect(countElement).toHaveClass('text-foreground');
    });

    it('should render with warning variant', () => {
      render(<StatusCard title="Needs Review" count={3} icon={Eye} variant="warning" />);
      const countElement = screen.getByText('3');
      expect(countElement).toHaveClass('text-yellow-600');
    });

    it('should render with success variant', () => {
      render(<StatusCard title="Approved" count={7} icon={CheckCircle} variant="success" />);
      const countElement = screen.getByText('7');
      expect(countElement).toHaveClass('text-green-600');
    });

    it('should render with destructive variant', () => {
      render(<StatusCard title="Failed" count={2} icon={AlertCircle} variant="destructive" />);
      const countElement = screen.getByText('2');
      expect(countElement).toHaveClass('text-red-600');
    });

    it('should render with info variant', () => {
      render(<StatusCard title="Needs AI" count={4} icon={Sparkles} variant="info" />);
      const countElement = screen.getByText('4');
      expect(countElement).toHaveClass('text-blue-600');
    });
  });

  describe('Card Structure', () => {
    it('should be rendered as a Card', () => {
      render(<StatusCard title="Scheduled" count={10} icon={Calendar} />);
      const card = document.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Different Icons', () => {
    it('should render with Clock icon', () => {
      render(<StatusCard title="Pending" count={5} icon={Clock} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render with Sparkles icon', () => {
      render(<StatusCard title="Needs AI" count={3} icon={Sparkles} variant="info" />);
      expect(screen.getByText('Needs AI')).toBeInTheDocument();
    });

    it('should render with Eye icon', () => {
      render(<StatusCard title="Needs Review" count={2} icon={Eye} variant="warning" />);
      expect(screen.getByText('Needs Review')).toBeInTheDocument();
    });

    it('should render with CheckCircle icon', () => {
      render(<StatusCard title="Approved" count={8} icon={CheckCircle} variant="success" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should render with Calendar icon', () => {
      render(<StatusCard title="Scheduled" count={6} icon={Calendar} variant="success" />);
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should render with AlertCircle icon', () => {
      render(<StatusCard title="Failed" count={1} icon={AlertCircle} variant="destructive" />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });
});
