import { render, screen } from '@testing-library/react';
import App from './App';

test('renders react cicd app', () => {
  render(<App />);
  const linkElement = screen.getByText(/this is react cicd app/i);
  expect(linkElement).toBeInTheDocument();
});
