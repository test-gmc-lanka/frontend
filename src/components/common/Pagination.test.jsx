import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination, { getPageItems, clampPage } from './Pagination';

describe('getPageItems', () => {
  it('should list every page given 7 pages or fewer', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should show the first pages and a gap given the current page near the start', () => {
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, '…', 20]);
  });

  it('should show gaps on both sides given the current page in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
  });

  it('should show the last pages given the current page near the end', () => {
    expect(getPageItems(19, 20)).toEqual([1, '…', 17, 18, 19, 20]);
  });
});

describe('clampPage', () => {
  it('should keep a page that is in range', () => {
    expect(clampPage(2, 30, 10)).toBe(2);
  });

  it('should pull the page back to the last page given fewer results', () => {
    expect(clampPage(5, 12, 10)).toBe(2);
  });

  it('should return page 1 given zero items or a page below 1', () => {
    expect(clampPage(3, 0, 10)).toBe(1);
    expect(clampPage(0, 30, 10)).toBe(1);
  });
});

describe('<Pagination />', () => {
  it('should show the item range summary and mark the current page', () => {
    render(<Pagination page={2} totalItems={42} pageSize={10} onPageChange={() => {}} itemLabel="users" />);
    expect(screen.getByText('Showing 11 to 20 of 42 users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('should show an empty message and disable navigation given no items', () => {
    render(<Pagination page={1} totalItems={0} pageSize={10} onPageChange={() => {}} itemLabel="orders" />);
    expect(screen.getByText('No orders')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('should call onPageChange with the chosen page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalItems={30} pageSize={10} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });
});
