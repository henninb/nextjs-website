/**
 * API Response Type Definitions
 *
 * This module provides generic types for API responses and fetch utilities
 * to replace 'any' types in API response handling.
 */

import { ErrorResult } from '../errors/AppError';

/**
 * Generic API response wrapper
 * Use this for endpoints that return a data payload with metadata
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated API response structure
 * Use this for endpoints that return paginated results
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
}

/**
 * Extended fetch options with typed query parameters
 */
export interface FetchOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  timeout?: number;
}

/**
 * Discriminated union for fetch results
 * Provides type-safe access to data or error
 *
 * @example
 * ```typescript
 * const result = await fetchData<User>('/api/user/1');
 * if (result.success) {
 *   console.log(result.data.username);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type FetchResult<T> =
  | {
      success: true;
      data: T;
      status: number;
    }
  | {
      success: false;
      error: ErrorResult;
      status: number;
    };

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
}

/**
 * Sports data API response types
 * These can be refined based on actual API schemas
 */

export interface SportsGame {
  id: string | number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  [key: string]: unknown; // Allow additional properties
}

export interface NFLGame extends SportsGame {
  week?: number;
  season?: number;
}

export interface NBAGame extends SportsGame {
  quarter?: number;
  timeRemaining?: string;
}

export interface MLBGame extends SportsGame {
  inning?: number;
}

export interface NHLGame extends SportsGame {
  period?: number;
  timeRemaining?: string;
}

/**
 * Type for sports data fetchers
 */
export type SportsDataFetcher = () => Promise<SportsGame[]>;
