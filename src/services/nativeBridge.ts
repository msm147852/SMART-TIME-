import { Capacitor } from '@capacitor/core';

export const NativeBridge = {
  isNative(): boolean { return Capacitor.isNativePlatform(); },
  platform(): string { return Capacitor.getPlatform(); },
  capabilities() {
    return { native: this.isNative(), platform: this.platform(), push: false, biometric: false, filesystem: false, share: false };
  },
};
