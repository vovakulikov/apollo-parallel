import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import Example from './example';

it('shows success message after confirm button is clicked', () => {
  const { getByText } = render(<Example />);
  
  expect(getByText(/waiting/i)).toBeInTheDocument();
  
  fireEvent.click(getByText('Confirm'));
  
  expect(getByText('Confirmed!')).toBeInTheDocument()
});
