import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1/gas-prices/blended`;
const POLL_INTERVAL_MS = 30_000; // re-fetch every 30 seconds

export function useGasPrices() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastFetched, setLastFetched] = useState(null); // Date object
  const [secondsAgo, setSecondsAgo]   = useState(0);

  // ── fetch helper ────────────────────────────────────────────────────
  const fetchPrices = async (signal) => {
    try {
      const res = await fetch(API_URL, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetched(new Date());
      setSecondsAgo(0);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── initial fetch + polling every 30 s ─────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetchPrices(controller.signal);

    const pollId = setInterval(() => {
      fetchPrices(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(pollId);
    };
  }, []);

  // ── "X seconds ago" ticker — increments every second ───────────────
  useEffect(() => {
    if (!lastFetched) return;
    const tickId = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetched.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tickId);
  }, [lastFetched]);

  return { data, loading, error, lastFetched, secondsAgo };
}
