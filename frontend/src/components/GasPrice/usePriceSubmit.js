import { useEffect, useRef, useState } from 'react';
import { getApiBaseUrl } from '../../config/api';

const API_BASE = getApiBaseUrl();

export function usePriceSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null); // { success, message } | { error }
  const controllerRef = useRef(null);

  const submit = async (stationId, fuelType, price) => {
    const normalizedPrice = parseFloat(price);
    if (!API_BASE) {
      setResult({ error: 'API is not configured for this environment.' });
      return;
    }

    if (!stationId || !fuelType || !Number.isFinite(normalizedPrice)) {
      setResult({ error: 'Please complete all required fields before submitting.' });
      return;
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/gas-prices/stations/${stationId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fuel_type: fuelType, price: normalizedPrice }),
          signal: controller.signal,
        }
      );
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error ?? 'Submission failed' });
      else setResult({ success: true, message: data.message });
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
      setResult({ error: 'Network error. Please try again.' });
    } finally {
      controllerRef.current = null;
      setSubmitting(false);
    }
  };

  const clearResult = () => setResult(null);

  const cancelSubmit = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { submit, submitting, result, clearResult, cancelSubmit };
}
