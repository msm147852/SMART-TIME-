import { Capacitor } from '@capacitor/core';

export const NativeBridge = {
  isNative(): boolean { return Capacitor.isNativePlatform(); },
  platform(): string { return Capacitor.getPlatform(); },
  async share(title: string, text: string): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      const mod = await import('@capacitor/share');
      await mod.Share.share({ title, text });
      return true;
    } catch { return false; }
  },
};
