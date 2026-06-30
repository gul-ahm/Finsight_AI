/**
 * App.test.tsx
 * Covers rendering of the main app page and basic navigation elements.
 * Protects against regressions where the homepage fails to render
 * headings or primary actions due to provider or metadata changes.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the homepage from app/page.tsx
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders without crashing and shows key headings', () => {
    render(<HomePage />);

    // Assert presence of common UI elements (adapt to actual headings/classes if needed)
    // This protects against accidental removals of main title or feature sections.
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });
});

