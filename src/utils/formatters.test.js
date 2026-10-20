import { describe, it, expect } from 'vitest';
import {
  formatLKR,
  formatDate,
  formatDateTime,
  getStatusBadgeClass,
  getErrorMessage,
  formatOrderNo,
} from './formatters';

describe('formatters', () => {
  describe('formatLKR', () => {
    it('should format a number with two decimals given a numeric amount', () => {
      expect(formatLKR(1500)).toBe('LKR 1,500.00');
    });

    it('should accept numeric strings given an amount from the API', () => {
      expect(formatLKR('99.5')).toBe('LKR 99.50');
    });

    it('should return LKR 0.00 given null or undefined', () => {
      expect(formatLKR(null)).toBe('LKR 0.00');
      expect(formatLKR(undefined)).toBe('LKR 0.00');
    });
  });

  describe('formatDate / formatDateTime', () => {
    it('should return a dash given an empty value', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDateTime(null)).toBe('-');
    });

    it('should format an ISO date given a valid date string', () => {
      expect(formatDate('2026-03-05T10:00:00')).toBe('Mar 5, 2026');
      expect(formatDateTime('2026-03-05T10:30:00')).toMatch(/^Mar 5, 2026, 10:30\sAM$/);
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should map known statuses to their badge class', () => {
      expect(getStatusBadgeClass('DELIVERED')).toBe('badge-delivered');
      expect(getStatusBadgeClass('IN_PROGRESS')).toBe('badge-in-progress');
      expect(getStatusBadgeClass('PENDING_REVIEW')).toBe('badge-pending');
    });

    it('should fall back to the pending badge given an unknown status', () => {
      expect(getStatusBadgeClass('SOMETHING_NEW')).toBe('badge-pending');
    });
  });

  describe('getErrorMessage', () => {
    it('should prefer the API message, then the API error, then the JS message', () => {
      expect(getErrorMessage({ response: { data: { message: 'Out of stock' } } })).toBe('Out of stock');
      expect(getErrorMessage({ response: { data: { error: 'BAD_REQUEST' } } })).toBe('BAD_REQUEST');
      expect(getErrorMessage(new Error('Network Error'))).toBe('Network Error');
    });

    it('should return a generic message given no usable detail', () => {
      expect(getErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    });
  });

  it('formatOrderNo should prefix the id with #', () => {
    expect(formatOrderNo(12)).toBe('#12');
  });
});
