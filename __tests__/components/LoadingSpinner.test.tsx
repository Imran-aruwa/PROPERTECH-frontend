import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without text', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = document.querySelector('.w-4');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    spinner = document.querySelector('.w-12');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingSpinner size="xl" />);
    spinner = document.querySelector('.w-16');
    expect(spinner).toBeInTheDocument();
  });

  it('renders fullScreen variant', () => {
    render(<LoadingSpinner fullScreen />);
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });
});

describe('LoadingSkeleton', () => {
  it('renders default 3 lines', () => {
    render(<LoadingSkeleton />);
    const lines = document.querySelectorAll('.h-4');
    expect(lines).toHaveLength(3);
  });

  it('renders custom number of lines', () => {
    render(<LoadingSkeleton lines={5} />);
    const lines = document.querySelectorAll('.h-4');
    expect(lines).toHaveLength(5);
  });
});

describe('CardSkeleton', () => {
  it('renders skeleton card', () => {
    render(<CardSkeleton />);
    const card = document.querySelector('.animate-pulse');
    expect(card).toBeInTheDocument();
  });
});
