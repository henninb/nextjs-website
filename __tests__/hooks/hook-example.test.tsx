import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// A simple custom hook
const useCounter = () => {
  const [count, setCount] = React.useState(0);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  
  return { count, increment, decrement };
};

describe('Custom Hook Test', () => {
  it('should increment counter', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useCounter(), { wrapper });
    
    // Initial value should be 0
    expect(result.current.count).toBe(0);
    
    // Increment
    act(() => {
      result.current.increment();
    });
    
    // Value should be 1
    expect(result.current.count).toBe(1);
    
    // Decrement
    act(() => {
      result.current.decrement();
    });
    
    // Value should be back to 0
    expect(result.current.count).toBe(0);
  });
});