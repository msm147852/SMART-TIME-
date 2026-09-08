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

  static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageAdapter] Failed to save key "${key}":`, e);
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
