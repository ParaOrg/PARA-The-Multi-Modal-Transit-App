export function getGoogleMapsApiKey() {
  return (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ??
    import.meta.env.VITE_GOOGLE_CLOUD_KEY ??
    import.meta.env.GOOGLE_MAPS_API_KEY ??
    import.meta.env.GOOGLE_CLOUD_API_KEY ??
    ''
  ).trim();
}