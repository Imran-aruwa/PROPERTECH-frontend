// Test utility functions

describe('Utility Functions', () => {
  describe('Number formatting', () => {
    it('formats currency correctly', () => {
      const amount = 1500000;
      const formatted = `KSh ${amount.toLocaleString()}`;
      expect(formatted).toBe('KSh 1,500,000');
    });

    it('calculates percentage correctly', () => {
      const occupied = 8;
      const total = 10;
      const percentage = Math.round((occupied / total) * 100);
      expect(percentage).toBe(80);
    });

    it('handles zero division', () => {
      const occupied = 0;
      const total = 0;
      const percentage = total ? Math.round((occupied / total) * 100) : 0;
      expect(percentage).toBe(0);
    });
  });

  describe('Date formatting', () => {
    it('formats date to locale string', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toLocaleDateString();
      expect(formatted).toBeTruthy();
    });

    it('gets ISO date string', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const isoDate = date.toISOString().split('T')[0];
      expect(isoDate).toBe('2024-01-15');
    });
  });

  describe('String operations', () => {
    it('capitalizes first letter', () => {
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('pending')).toBe('Pending');
      expect(capitalize('completed')).toBe('Completed');
    });

    it('replaces underscores with spaces', () => {
      const status = 'in_progress';
      const formatted = status.replace('_', ' ');
      expect(formatted).toBe('in progress');
    });
  });

  describe('Array operations', () => {
    it('filters by status', () => {
      const items = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'pending' },
      ];
      const pending = items.filter(item => item.status === 'pending');
      expect(pending).toHaveLength(2);
    });

    it('calculates sum correctly', () => {
      const payments = [
        { amount: 1000 },
        { amount: 2000 },
        { amount: 500 },
      ];
      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBe(3500);
    });

    it('slices array correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const firstFive = items.slice(0, 5);
      expect(firstFive).toHaveLength(5);
      expect(firstFive).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
