/**
 * Test Utility Type Definitions
 *
 * This module provides types for test utilities, mocks, and wrappers
 * to replace 'any' types in test files.
 */

import { ReactNode, ReactElement } from "react";
import { QueryClient } from "@tanstack/react-query";
import { RenderOptions, RenderResult } from "@testing-library/react";

/**
 * Test wrapper component props
 */
export interface TestWrapperProps {
  children: ReactNode;
}

/**
 * Query client wrapper factory type
 * Use this for creating React Query test wrappers
 */
export type QueryClientWrapper = (
  queryClient: QueryClient,
) => React.FC<TestWrapperProps>;

/**
 * Generic mock function type with proper typing
 * Use this instead of jest.Mock<any, any>
 */
export type MockedFunction<
  T extends (...args: Parameters<T>) => ReturnType<T>,
> = jest.MockedFunction<T>;

/**
 * Mock fetch response type
 * Use this for mocking fetch API responses
 */
export interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  redirected: boolean;
  type: ResponseType;
  url: string;
  clone: () => Response;
  body: ReadableStream | null;
  bodyUsed: boolean;
  arrayBuffer: () => Promise<ArrayBuffer>;
  blob: () => Promise<Blob>;
  formData: () => Promise<FormData>;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
}

/**
 * Custom render options for React Testing Library
 */
export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  wrapper?: React.ComponentType<TestWrapperProps>;
}

/**
 * Custom render result type
 */
export type CustomRenderResult = RenderResult;

/**
 * Mock data factory function type
 */
export type MockDataFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Test hook result wrapper
 */
export interface TestHookResult<T> {
  result: {
    current: T;
  };
  rerender: (props?: unknown) => void;
  unmount: () => void;
}

/**
 * MSW request handler types
 */
export interface MockRequestHandler {
  method: string;
  path: string;
  response: unknown;
  status?: number;
}

/**
 * Test utilities that return unknown types
 * (for cases where the return type is intentionally flexible)
 */
export type UnknownTestUtility = (...args: unknown[]) => unknown;

/**
 * Generic event handler mock
 */
export type MockEventHandler<E = Event> = jest.MockedFunction<
  (event: E) => void
>;

/**
 * Mock console methods
 */
export interface MockConsole {
  log: jest.MockedFunction<typeof console.log>;
  error: jest.MockedFunction<typeof console.error>;
  warn: jest.MockedFunction<typeof console.warn>;
  info: jest.MockedFunction<typeof console.info>;
}

/**
 * Helper type for rendering components in tests
 */
export type TestRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => CustomRenderResult;
