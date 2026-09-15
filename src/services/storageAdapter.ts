export class StorageAdapter {
  static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to parse key "${key}":`, e);
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      // Verify immediately so a save action never fails silently.
      return localStorage.getItem(key) === serialized;
    } catch (e) {
      console.error(`[StorageAdapter] Failed to save key "${key}":`, e);
      return false;
    }
  }

  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[StorageAdapter] Failed to remove key "${key}":`, e);
    }
  }

  static clearAll(keys: readonly string[] | string[]): void {
    if (typeof window === 'undefined') return;
    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`[StorageAdapter] Failed to clear key "${key}":`, e);
      }
    });
  }
}
