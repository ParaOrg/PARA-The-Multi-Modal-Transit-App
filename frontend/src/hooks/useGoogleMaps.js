import { useEffect, useState } from "react";
import { getGoogleMapsApiKey } from "../config/googleMaps";

export function useGoogleMaps(apiKey) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const resolvedApiKey = (apiKey ?? getGoogleMapsApiKey()).trim();

  useEffect(() => {
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      setError(new Error('Google Maps rejected this key. Check API enablement, billing, and referrer restrictions.'));
    };

    if (window.google) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMapsScript = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${resolvedApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => setLoaded(true);
    script.onerror = () => setError(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);

    return () => {
      window.gm_authFailure = previousAuthFailure;
    };
  }, [resolvedApiKey]);

  return { loaded, error };
}
