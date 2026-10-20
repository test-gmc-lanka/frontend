import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDeadline, todayInputValue, deadlineInfo } from './deadline';

describe('deadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 15, 0, 0)); // Tue 20 Oct 2026, 3 pm local
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatDeadline should parse YYYY-MM-DD as a local date', () => {
    expect(formatDeadline('2026-10-20')).toBe('Tue, Oct 20, 2026');
    expect(formatDeadline('')).toBe('—');
  });

  it('todayInputValue should return today as a zero-padded YYYY-MM-DD string', () => {
    vi.setSystemTime(new Date(2026, 0, 5));
    expect(todayInputValue()).toBe('2026-01-05');
  });

  describe('deadlineInfo', () => {
    it('should return null given no deadline', () => {
      expect(deadlineInfo(null, 'PENDING')).toBeNull();
    });

    it('should show a neutral label given a completed task, even if overdue', () => {
      expect(deadlineInfo('2026-10-01', 'COMPLETED')).toMatchObject({
        label: 'Due Thu, Oct 1, 2026',
        color: '#6b7280',
      });
    });

    it('should mark the task urgent given a past deadline', () => {
      expect(deadlineInfo('2026-10-19', 'PENDING')).toMatchObject({ label: 'Overdue by 1 day', urgent: true });
      expect(deadlineInfo('2026-10-17', 'PENDING')).toMatchObject({ label: 'Overdue by 3 days', urgent: true });
    });

    it('should show "Due today" given today as the deadline', () => {
      expect(deadlineInfo('2026-10-20', 'IN_PROGRESS')).toMatchObject({ label: 'Due today', urgent: true });
    });

    it('should warn given a deadline within two days', () => {
      expect(deadlineInfo('2026-10-21', 'PENDING').label).toBe('Due in 1 day');
      expect(deadlineInfo('2026-10-22', 'PENDING').label).toBe('Due in 2 days');
    });

    it('should show the plain date given a deadline three or more days away', () => {
      const info = deadlineInfo('2026-10-23', 'PENDING');
      expect(info.label).toBe('Due Fri, Oct 23, 2026');
      expect(info.urgent).toBeUndefined();
    });
  });
});
