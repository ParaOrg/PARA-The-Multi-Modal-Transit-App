/**
 * TripSummaryCard.jsx — Figma-inspired route cards, one per segment.
 */

export default function TripSummaryCard({ routeData }) {
  if (!routeData) return null;
  const { segments = [], total_fare, total_time_min } = routeData;

  return (
    <div className="space-y-2">
      {/* Each segment gets its own card */}
      {segments.map((seg, i) => {
        const isWalk = seg.is_transfer || seg.type === "walk";
        const emoji = isWalk ? "🚶" : "🚌";
        const dist = seg.distance_display || (seg.distance_m >= 1000 
          ? (seg.distance_m / 1000).toFixed(1) + " km" 
          : seg.distance_m + "m");
        const title = isWalk 
          ? `Walk ${seg.time_min} min` 
          : `${seg.route || "Transit"} (${seg.time_min} min)`;
        const detail = isWalk
          ? `${dist} walking`
          : `${dist} · ₱${seg.fare}`;

        return (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="flex">
              {/* Left color bar */}
              <div className={`w-[11px] rounded-l-xl shrink-0 ${
                isWalk ? "bg-gray-300" : "bg-[#7A4BC8]"
              }`} />
              
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5">
                {/* Emoji */}
                <span className="text-base shrink-0">{emoji}</span>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#381D65] text-[11px] font-bold leading-tight">{title}</p>
                  <p className="text-[#381D65] text-[10px] leading-tight mt-0.5">{detail}</p>
                </div>

                {/* Time badge */}
                <div className="text-[#7A4BC8] text-[10px] font-bold shrink-0">
                  {seg.time_min}min
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Total bar */}
      <div className="bg-[#7A4BC81A] rounded-2xl px-3 py-2 flex items-center justify-between">
        <span className="text-[#381D65] text-[10px] font-bold">Total</span>
        <div className="flex gap-3 text-[#381D65] text-[10px]">
          <span>⏱ {total_time_min} min</span>
          <span>💰 ₱{total_fare}</span>
        </div>
      </div>
    </div>
  );
}
