import { useGasPrices } from './useGasPrices';

function PriceRow({ item }) {
  const change = item.price - item.prev_price;
  const isDown = change < 0;
  const isUp = change > 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{item.label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">₱{item.price.toFixed(2)}</span>
        {isDown && (
          <span className="text-xs text-green-600 font-medium">↓ {Math.abs(change).toFixed(2)}</span>
        )}
        {isUp && (
          <span className="text-xs text-red-500 font-medium">↑ {change.toFixed(2)}</span>
        )}
        {!isDown && !isUp && (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </div>
  );
}

export default function GasPricePanel() {
  const { data, loading, error } = useGasPrices();

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
        <p className="text-sm text-gray-400 text-center">Loading prices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
        <p className="text-sm text-red-500 text-center">Failed to load prices</p>
      </div>
    );
  }

  const gasoline = data.prices.filter(p => p.category === 'gasoline');
  const diesel = data.prices.filter(p => p.category === 'diesel');
  const other = data.prices.filter(p => p.category !== 'gasoline' && p.category !== 'diesel');

  return (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">PH Fuel Prices (Avg)</h3>
        <span className="text-xs text-gray-400">per liter</span>
      </div>

      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Gasoline</p>
        {gasoline.map(p => <PriceRow key={p.id} item={p} />)}
      </div>

      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-3">Diesel</p>
        {diesel.map(p => <PriceRow key={p.id} item={p} />)}
      </div>

      {other.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-3">Other</p>
          {other.map(p => <PriceRow key={p.id} item={p} />)}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
        Source: DOE Philippines · {data.last_updated}
      </p>
    </div>
  );
}
