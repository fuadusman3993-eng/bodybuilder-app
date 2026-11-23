/**
 * Native APK implementation of device hardware resolution (Android / iOS).
 * Direct native OS access to android.os.Build.MODEL and Build.MANUFACTURER.
 */
import * as Device from 'expo-device';

export function getNativeDeviceHardware(): {
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
} | null {
  try {
    const brand = Device.manufacturer || Device.brand || '';
    const model = Device.modelName || '';
    if (model || brand) {
      let nativeName = '';
      if (brand && model) {
        if (model.toLowerCase().includes(brand.toLowerCase())) {
          nativeName = model;
        } else {
          nativeName = `${brand} ${model}`;
        }
      } else {
        nativeName = model || brand;
      }
      const isTablet = Device.deviceType === Device.DeviceType.TABLET;
      return {
        name: nativeName,
        type: isTablet ? 'tablet' : 'mobile',
      };
    }
  } catch (_) {}
  return null;
}
