/**
 * Capacitor Native Features Utility
 * Provides unified access to native mobile features
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network, NetworkStatus } from '@capacitor/network';
import { Share } from '@capacitor/share';

// Check if running in native mobile app
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Check if running on Android
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

// Check if running on iOS
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

// Check if running on web
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

// Initialize app listeners
export const initializeApp = async (callbacks?: {
  onBackButton?: () => void;
  onAppResume?: () => void;
  onAppPause?: () => void;
}): Promise<void> => {
  if (!isNative()) return;

  // Configure status bar
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
  } catch (error) {
    console.warn('StatusBar not available:', error);
  }

  // Hide splash screen after app loads
  setTimeout(async () => {
    await SplashScreen.hide();
  }, 1000);

  // Hardware back button handler (Android)
  if (callbacks?.onBackButton) {
    App.addListener('backButton', callbacks.onBackButton);
  }

  // App lifecycle
  if (callbacks?.onAppResume) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        callbacks.onAppResume?.();
      }
    });
  }

  // Keyboard handling
  if (isNative()) {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  }
};

// Camera functions
export const takePhoto = async (options?: {
  quality?: number;
  allowEditing?: boolean;
}): Promise<Photo | null> => {
  try {
    const photo = await Camera.getPhoto({
      quality: options?.quality || 90,
      allowEditing: options?.allowEditing || false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: true,
    });
    return photo;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
};

export const pickImageFromGallery = async (options?: {
  quality?: number;
  limit?: number;
}): Promise<Photo[]> => {
  try {
    const photos = await Camera.getPhotos({
      quality: options?.quality || 90,
      limit: options?.limit || 1,
    });
    return photos.photos;
  } catch (error) {
    console.error('Gallery error:', error);
    return [];
  }
};

// Geolocation functions
export const getCurrentPosition = async (): Promise<Position | null> => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    return position;
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
};

export const watchPosition = (
  callback: (position: Position | null) => void,
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
): (() => void) => {
  const watchId = Geolocation.watchPosition(
    {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0,
    },
    (position, err) => {
      if (err) {
        console.error('Watch position error:', err);
        callback(null);
        return;
      }
      callback(position);
    }
  );

  // Return cleanup function
  return () => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
    }
  };
};

// Push Notifications
export const initializePushNotifications = async (callbacks?: {
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationTapped?: (notification: ActionPerformed) => void;
  onRegistrationError?: (error: any) => void;
}): Promise<void> => {
  if (!isNative()) {
    console.log('Push notifications only available on native platforms');
    return;
  }

  // Request permission
  await PushNotifications.requestPermissions();
  
  // Add event listeners
  if (callbacks?.onNotificationReceived) {
    PushNotifications.addListener('pushNotificationReceived', callbacks.onNotificationReceived);
  }

  if (callbacks?.onNotificationTapped) {
    PushNotifications.addListener('pushNotificationActionPerformed', callbacks.onNotificationTapped);
  }

  // Registration
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success:', token);
    // Send token to your backend
    // savePushTokenToBackend(token.value);
  });

  if (callbacks?.onRegistrationError) {
    PushNotifications.addListener('registrationError', callbacks.onRegistrationError);
  }

  // Register for push notifications
  await PushNotifications.register();
};

// Haptic feedback
export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light): Promise<void> => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    // Ignore haptic errors
  }
};

// Network status
export const getNetworkStatus = async (): Promise<NetworkStatus> => {
  return await Network.getStatus();
};

export const watchNetworkStatus = (
  callback: (status: NetworkStatus) => void
): (() => void) => {
  const listener = Network.addListener('networkStatusChange', callback);
  return () => {
    listener.then(l => l.remove());
  };
};

// Share functionality
export const shareContent = async (options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<void> => {
  try {
    await Share.share(options);
  } catch (error) {
    console.error('Share error:', error);
  }
};

// Check permissions
export const checkPermissions = async (): Promise<{
  location: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
}> => {
  const location = await Geolocation.checkPermissions();
  const camera = await Camera.checkPermissions();
  const notifications = await PushNotifications.checkPermissions();

  return {
    location: location.location as 'granted' | 'denied' | 'prompt',
    camera: camera.camera as 'granted' | 'denied' | 'prompt',
    notifications: notifications.receive as 'granted' | 'denied' | 'prompt',
  };
};

// Request permissions
export const requestPermissions = async (): Promise<void> => {
  if (isNative()) {
    await Geolocation.requestPermissions();
    await Camera.requestPermissions();
    await PushNotifications.requestPermissions();
  }
};
