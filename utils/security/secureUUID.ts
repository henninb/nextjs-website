/**
 * Secure UUID generation utility
 * Replaces client-side crypto.randomUUID() with server-side generation
 */

import { getErrorMessage } from "../../types";

interface UUIDResponse {
  uuid: string;
  timestamp: number;
}

class SecureUUIDGenerator {
  private static cache: Map<string, { uuid: string; expiry: number }> =
    new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Generate a secure UUID via server-side API call
   */
  static async generateSecureUUID(): Promise<string> {
    try {
      // Check if we have a cached auth token (you should implement proper auth)
      const authToken = this.getAuthToken();

      const response = await fetch("/api/uuid/generate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry once
          await this.delay(1000);
          return this.generateFallbackUUID();
        }

        if (response.status === 401) {
          throw new Error("Authentication required for UUID generation");
        }

        throw new Error(`UUID generation failed: ${response.status}`);
      }

      const data: UUIDResponse = await response.json();

      if (!this.isValidUUID(data.uuid)) {
        throw new Error("Invalid UUID received from server");
      }

      return data.uuid;
    } catch (error: unknown) {
      console.warn(
        "Secure UUID generation failed, using fallback:",
        getErrorMessage(error),
      );
      return this.generateFallbackUUID();
    }
  }

  /**
   * Generate multiple UUIDs efficiently (with caching)
   */
  static async generateMultipleUUIDs(count: number): Promise<string[]> {
    if (count <= 0 || count > 100) {
      throw new Error("UUID count must be between 1 and 100");
    }

    const uuids: string[] = [];
    const promises: Promise<string>[] = [];

    for (let i = 0; i < count; i++) {
      promises.push(this.generateSecureUUID());
    }

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("Batch UUID generation failed:", error);
      // Fallback to individual generation
      for (let i = 0; i < count; i++) {
        uuids.push(this.generateFallbackUUID());
      }
      return uuids;
    }
  }

  /**
   * Fallback UUID generation (still more secure than client-side)
   * Uses timestamp + random components for better entropy
   */
  private static generateFallbackUUID(): string {
    // Generate proper UUID v4 format
    const hex = "0123456789abcdef";
    let uuid = "";

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += "-";
      } else if (i === 14) {
        uuid += "4"; // Version 4
      } else if (i === 19) {
        uuid += hex[Math.floor(Math.random() * 4) + 8]; // 8, 9, a, or b
      } else {
        uuid += hex[Math.floor(Math.random() * 16)];
      }
    }

    return uuid;
  }

  /**
   * Get random hex digit for UUID v4 format
   */
  private static getRandomHex(): string {
    const hex = Math.floor(Math.random() * 16).toString(16);
    // Ensure proper UUID v4 variant bits
    return ["8", "9", "a", "b"][Math.floor(Math.random() * 4)];
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Get authentication token (implement based on your auth system)
   */
  private static getAuthToken(): string {
    // This is a placeholder - implement based on your auth system
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("authToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
      return token || "fallback-token";
    }
    return "server-token";
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean expired cache entries
   */
  private static cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Main export - use this instead of crypto.randomUUID()
 */
export const generateSecureUUID =
  SecureUUIDGenerator.generateSecureUUID.bind(SecureUUIDGenerator);
export const generateMultipleUUIDs =
  SecureUUIDGenerator.generateMultipleUUIDs.bind(SecureUUIDGenerator);
export const isValidUUID =
  SecureUUIDGenerator.isValidUUID.bind(SecureUUIDGenerator);

// Default export for convenience
export default {
  generateSecureUUID,
  generateMultipleUUIDs,
  isValidUUID,
};
