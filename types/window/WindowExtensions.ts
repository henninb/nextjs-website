/**
 * Window Interface Extensions
 *
 * This module extends the global Window interface to include third-party
 * properties that are added at runtime, replacing '(window as any)' patterns.
 */

/**
 * PerimeterX configuration object type
 */
export interface PerimeterXObject {
  appId: string;
  vid?: string;
  uuid?: string;
}

/**
 * Extend the global Window interface with third-party properties
 */
declare global {
  interface Window {
    /**
     * PerimeterX bot detection initialization callback
     * Used in /app/watch/page.tsx
     */
    PXjJ0cYtn9_asyncInit?: (px?: PerimeterXObject) => void;

    /**
     * PerimeterX custom domains for CDN
     * Used in /utils/globalSetup.ts
     */
    _pxCustomAbrDomains?: string[];

    /**
     * Google Analytics gtag function
     * Used for analytics tracking
     */
    gtag?: (...args: unknown[]) => void;

    /**
     * Google Analytics data layer
     * Used for event tracking
     */
    dataLayer?: unknown[];

    /**
     * PerimeterX main object
     * May be added by the PerimeterX script
     */
    _px?: PerimeterXObject;

    /**
     * Generic analytics or tracking objects
     * Some third-party scripts may add these
     */
    analytics?: unknown;
    heap?: unknown;
  }
}

// Make this file a module
export {};
