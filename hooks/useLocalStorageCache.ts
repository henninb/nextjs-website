"use client";
import { useState, useEffect } from "react";

interface SchemaLike {
  safeParse: (
    data: unknown,
  ) => { success: boolean; data?: any; error?: { issues: unknown[] } };
}

interface UseLocalStorageCacheOptions<T> {
  storageKey: string;
  cacheEnabledKey: string;
  schema?: SchemaLike;
}

export function useLocalStorageCache<T>({
  storageKey,
  cacheEnabledKey,
  schema,
}: UseLocalStorageCacheOptions<T>) {
  const [lastValue, setLastValue] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(cacheEnabledKey) !== "true") return;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (schema) {
        const result = schema.safeParse(parsed);
        if (result.success) {
          setLastValue(result.data as T);
        } else {
          console.warn("Discarding invalid cache:", result.error?.issues);
          localStorage.removeItem(storageKey);
        }
      } else {
        setLastValue(parsed as T);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }, []);

  const save = (value: T): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const getStored = (): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (schema) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          localStorage.removeItem(storageKey);
          return null;
        }
        return result.data as T;
      }
      return parsed as T;
    } catch {
      return null;
    }
  };

  return { lastValue, setLastValue, save, getStored };
}
