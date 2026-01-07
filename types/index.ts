/**
 * Central Type System - Barrel Export
 *
 * This file provides a single entry point for importing all custom types
 * used throughout the application.
 *
 * @example
 * ```typescript
 * import { AppError, toErrorResult, ValidationResult } from '../types';
 * ```
 */

// Error types
export {
  AppError,
  isAppError,
  isError,
  hasMessage,
  toErrorResult,
  getErrorMessage,
  type ErrorResult,
} from "./errors/AppError";

// Validation types
export {
  isValidationSuccess,
  isValidationFailure,
  type ValidationResult,
  type ValidatedData,
  type ArrayValidationResult,
  type ValidatorFunction,
} from "./validation/ValidationTypes";

// MUI DataGrid types
export {
  type TypedRenderCellParams,
  type TypedGridColDef,
  type GridRowId,
  type GridCallbackDetails,
  type GridRowSelectionModel,
  type GridPaginationModel,
  type GridValidRowModel,
  type RowSelectionChangeHandler,
  type PaginationChangeHandler,
  type ProcessRowUpdateHandler,
} from "./mui/DataGridTypes";

// Window extensions
export type { PerimeterXObject } from "./window/WindowExtensions";

// API types
export {
  type ApiResponse,
  type PaginatedResponse,
  type FetchOptions,
  type FetchResult,
  type HttpMethod,
  type ApiEndpoint,
  type SportsGame,
  type NFLGame,
  type NBAGame,
  type MLBGame,
  type NHLGame,
  type SportsDataFetcher,
} from "./api/ApiTypes";

// Test types
export {
  type TestWrapperProps,
  type QueryClientWrapper,
  type MockedFunction,
  type MockResponse,
  type CustomRenderOptions,
  type CustomRenderResult,
  type MockDataFactory,
  type TestHookResult,
  type MockRequestHandler,
  type UnknownTestUtility,
  type MockEventHandler,
  type MockConsole,
  type TestRender,
} from "./test/TestTypes";
