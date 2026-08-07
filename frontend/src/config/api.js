// Auto-detect API URL based on environment
export function getApiBaseUrl() {
  // Production: use the deployed Render URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://para-ph-api.onrender.com';
  }
  // Development: use localhost
  return '';
}

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
