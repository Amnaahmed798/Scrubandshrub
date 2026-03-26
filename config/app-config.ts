// Frontend environment configuration for production
// This helps manage different environments and URLs

export const AppConfig = {
  // Base URLs - using relative URLs for production to work with Apache reverse proxy
  PRODUCTION: {
    FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || '',
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '/api/v1',
  },

  DEVELOPMENT: {
    FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1',
  },

  // OAuth Configuration
  OAUTH: {
    // These should match the redirect URIs configured in Google Cloud Console
    REDIRECT_URIS: {
      DEVELOPMENT: [
        'http://localhost:8000/api/auth/callback',
        'http://127.0.0.1:8000/api/auth/callback'
      ],
      PRODUCTION: [
        '/api/auth/callback', // Using relative URL for Apache reverse proxy
      ]
    }
  },

  // App-specific settings
  APP_NAME: 'Car Wash App',
  COMPANY_NAME: 'Sandpiper Car Washing',

  // For WebView environments
  WEBVIEW: {
    SUPPORTED: true,
    EXTERNAL_BROWSER_OAUTH: true, // Whether to open OAuth in external browser
  },

  // Get current environment configuration
  getCurrentConfig() {
    const isDev = process.env.NODE_ENV !== 'production';
    return isDev ? this.DEVELOPMENT : this.PRODUCTION;
  },

  // Get backend URL based on environment
  getBackendUrl() {
    return this.getCurrentConfig().BACKEND_URL;
  },

  // Get frontend URL based on environment
  getFrontendUrl() {
    return this.getCurrentConfig().FRONTEND_URL;
  },
};

export default AppConfig;