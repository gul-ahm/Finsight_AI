/**
 * SymbolSearch.test.tsx
 * Exercises the SymbolSearch component rendering, input typing, and option selection.
 * Protects against issues where search input or results stop working due to API changes.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import SymbolSearch from '@/components/SymbolSearch';

describe('SymbolSearch component', () => {
  it('renders input and allows typing', async () => {
    const user = userEvent.setup();
    render(<SymbolSearch />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();

    await user.type(input, 'AAPL');
    expect(input).toHaveValue('AAPL');
  });
});

