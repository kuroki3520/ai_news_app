import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock axios
jest.mock('axios');

describe('App Dark Mode Functionality', () => {
  beforeEach(() => {
    // Clear localStorage and reset document class before each test
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Reset mocks if necessary
    const mockAxios = jest.requireMock('axios');
    // Mock the initial /reports/latest call
    mockAxios.get.mockImplementation((url: string) => {
      if (url.endsWith('/reports/latest')) {
        return Promise.resolve({ data: { reportId: '1', generatedAt: new Date().toISOString(), articles: [] } });
      }
      if (url.includes('/tasks/')) {
        return Promise.resolve({ data: { status: 'COMPLETED' } }); // Or relevant status
      }
      return Promise.reject(new Error('Not mocked'));
    });
    mockAxios.post.mockResolvedValue({ data: { taskId: '123', status: 'PENDING' } });
  });

  test('renders dark mode toggle button', async () => {
    render(<App />);
    // Button text changes based on theme, so we check for its presence by role
    // and initial state (assuming default is light mode)
    const toggleButton = await screen.findByRole('button', { name: /dark mode/i });
    expect(toggleButton).toBeInTheDocument();
  });

  test('toggles dark mode on button click and updates class on html element', async () => {
    render(<App />);
    const toggleButton = await screen.findByRole('button', { name: /dark mode/i });

    // Initial state: light mode
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to enable dark mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(toggleButton).toHaveTextContent(/light mode/i);

    // Click to disable dark mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(toggleButton).toHaveTextContent(/dark mode/i);
  });

  test('saves dark mode preference to localStorage', async () => {
    render(<App />);
    const toggleButton = await screen.findByRole('button', { name: /dark mode/i });

    // Click to enable dark mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(localStorage.getItem('darkMode')).toBe('true');

    // Click to disable dark mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  test('loads dark mode preference from localStorage on initial render (dark mode enabled)', async () => {
    localStorage.setItem('darkMode', 'true');
    render(<App />);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const toggleButton = await screen.findByRole('button', { name: /light mode/i });
    expect(toggleButton).toBeInTheDocument();
  });

  test('loads dark mode preference from localStorage on initial render (dark mode disabled)', async () => {
    localStorage.setItem('darkMode', 'false');
    render(<App />);
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    const toggleButton = await screen.findByRole('button', { name: /dark mode/i });
    expect(toggleButton).toBeInTheDocument();
  });
});
