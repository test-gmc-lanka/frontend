import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Link to="/about">Go to About</Link>} />
        <Route path="/about" element={<p>About page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ScrollToTop', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('should scroll to the top given the first page load', () => {
    // Act
    renderAt('/');

    // Assert
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should scroll to the top again given navigation to another page', async () => {
    // Arrange
    renderAt('/');
    window.scrollTo.mockClear();

    // Act
    await userEvent.click(screen.getByText('Go to About'));

    // Assert
    expect(screen.getByText('About page')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
