/**
 * Utility functions for WebView environments
 * These help with OAuth flows and other functionality in WebView wrappers
 */

/**
 * Checks if the app is running in a WebView environment
 */
export function isInWebView(): boolean {
  // Check for common WebView indicators
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for React Native WebView
  if ((window as any).ReactNativeWebView) {
    return true;
  }

  // Check for Cordova
  if ((window as any).cordova) {
    return true;
  }

  // Check for Capacitor
  if ((window as any).Capacitor) {
    return true;
  }

  // Check for common WebView user agent patterns
  if (
    userAgent.includes('WebView') ||
    userAgent.includes('wv') ||
    userAgent.includes('Version/') // iOS Safari in WebView often has this pattern
  ) {
    return true;
  }

  return false;
}

/**
 * Opens a URL in the appropriate way based on the environment
 * @param url The URL to open
 * @param target Target for opening (e.g., '_blank', '_self')
 */
export function openUrlInEnvironment(url: string, target: string = '_blank'): void {
  if (isInWebView()) {
    // In WebView, try to open in external browser for OAuth flows
    // This is safer for OAuth and payment flows
    window.open(url, '_system');
  } else {
    // In regular browser, use normal window.open
    window.open(url, target);
  }
}

/**
 * Helper function to handle OAuth redirects appropriately
 * @param oauthUrl The OAuth provider URL
 */
export function handleOAuthFlow(oauthUrl: string): void {
  if (isInWebView()) {
    // For WebView environments, open OAuth in external browser
    // This provides better security and user experience
    window.open(oauthUrl, '_system');
  } else {
    // For regular browsers, redirect normally
    window.location.href = oauthUrl;
  }
}