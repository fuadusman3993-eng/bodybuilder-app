/**
 * Web implementation of device hardware resolution.
 * Zero native modules imported — ensures expo-device is never bundled or evaluated on Web.
 */
export function getNativeDeviceHardware(): {
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
} | null {
  return null;
}
