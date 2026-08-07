import { Link } from 'react-router-dom';

export default function GasPriceBadge({ compact = false, className = '' }) {
  return (
    <Link
      to="/gas-prices"
      className={`group flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-sm no-underline shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-purple-50 ${className}`}
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-purple-50 shadow-inner ${compact ? 'h-7 w-7 text-sm' : 'h-8 w-8 text-base'}`}>
        ⛽
      </span>
      <span className="text-xs text-gray-500">Gas Prices</span>
      <span className="text-[10px] text-purple-600 font-semibold ml-auto">Coming Soon</span>
    </Link>
  );
}