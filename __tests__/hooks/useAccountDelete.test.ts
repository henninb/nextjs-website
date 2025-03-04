import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import useAccountDelete from '../../hooks/useAccountDelete';
import Account from '../../model/Account';

// Mock server setup
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a wrapper for the test component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  // Return a wrapper function with proper type annotation
  return ({ children }: { children: React.ReactNode }) => {
    const { QueryClientProvider } = require('@tanstack/react-query');
    const React = require('react');
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('useAccountDelete', () => {
  const mockAccount: Account = {
    accountId: 123,
    accountNameOwner: 'testAccount_owner',
    accountType: 'debit',
    activeStatus: true,
    moniker: 'Test Account',
    outstanding: 100,
    future: 0,
    cleared: 200
  };

  it('should delete an account successfully', async () => {
    // Mock the API response
    server.use(
      http.delete('https://finance.lan/api/account/delete/testAccount_owner', () => {
        return HttpResponse.text('', { status: 204 });
      })
    );

    // Set up the initial query cache
    const wrapper = createWrapper();
    const queryClient = new QueryClient();
    queryClient.setQueryData(['account'], [mockAccount]);

    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), { wrapper });

    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the account was removed from the cache
    const updatedAccounts = queryClient.getQueryData<Account[]>(['account']);
    expect(updatedAccounts).toEqual([]);
  });

  it('should handle API errors correctly', async () => {
    // Mock an API error
    server.use(
      http.delete('https://finance.lan/api/account/delete/testAccount_owner', () => {
        return HttpResponse.json(
          { response: 'Cannot delete this account' },
          { status: 400 }
        );
      })
    );

    const wrapper = createWrapper();
    
    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), { wrapper });
    
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });
    
    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cannot delete this account')
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle network errors correctly', async () => {
    // Mock a network error
    server.use(
      http.delete('https://finance.lan/api/account/delete/testAccount_owner', () => {
        return HttpResponse.error();
      })
    );

    const wrapper = createWrapper();
    
    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), { wrapper });
    
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });
    
    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});