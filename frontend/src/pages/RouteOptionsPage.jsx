import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ROUTES = [
  {
    id: 'best',
    label: 'The Best Route',
    duration: '30-52 min',
    price: 'P35-35',
    segments: [
      { mode: 'Jeepney', duration: '15-25 min' },
      { mode: 'Bus', duration: '20-30 min' },
    ],
    route: 'Jeepney through Buendia → Bus through BGC',
    badges: ['Walkable', 'Best', 'Safest'],
  },
  {
    id: 'average',
    label: 'Average Route',
    duration: '38-48 min',
    price: 'P35-60',
    segments: [
      { mode: 'Jeepney', duration: '15-25 min' },
      { mode: 'Bus', duration: '20-25 min' },
      { mode: 'UV', duration: '20-25 min' },
    ],
    route: 'Jeepney through Buendia → Bus through BGC → UV to Sm Batangas',
    badges: [],
    weather: true,
  },
  {
    id: 'normal',
    label: 'Normal Route',
    duration: '30-52 min',
    price: 'P35-35',
    segments: [
      { mode: 'Jeepney', duration: '15-25 min' },
      { mode: 'Bus', duration: '20-30 min' },
    ],
    route: 'Jeepney through Buendia → Bus through BGC',
    badges: ['Traffic'],
  },
];

export default function RouteOptionsPage({ destination = 'Mapua University Makati', routes = [] }) {
  const navigate = useNavigate();
  const [showComparison, setShowComparison] = useState(false);
  const [likedRoutes, setLikedRoutes] = useState({});

  const handleToggleLike = (routeId) => {
    setLikedRoutes((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  };

  const routeList = routes.length > 0 ? routes : DEFAULT_ROUTES;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 ml-4 text-sm font-medium truncate">To {destination}</h1>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors" aria-label="Menu">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="6" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="18" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Comparison Button */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full border-2 border-purple-300 rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-purple-600">See Route Comparison</span>
            <svg className={`w-5 h-5 text-purple-600 transition-transform ${showComparison ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold pt-4">Route Options</h2>

        {/* Route List */}
        <div className="space-y-4 pb-8">
          {routeList.map((route) => (
            <RouteCard key={route.id} route={route} isLiked={likedRoutes[route.id] || false} onToggleLike={() => handleToggleLike(route.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, isLiked, onToggleLike }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{route.label}</h3>
            <div className="flex gap-6 mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
                {route.duration}
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {route.price}
              </div>
            </div>
          </div>
          {route.weather && (
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9.5M19 10H7.5a4 4 0 104 4m6-11l3 3m0 0l-3 3m3-3l-3-3m3 3l3 3" />
            </svg>
          )}
        </div>
      </div>

      {/* Transport Segments */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between gap-2">
          {route.segments.map((segment, idx) => (
            <div key={idx} className="flex-1 text-center">
              <div className="w-8 h-6 mx-auto text-purple-900 mb-1">
                <TransportIcon mode={segment.mode} />
              </div>
              <p className="text-xs text-gray-600">{segment.duration}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {route.badges?.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
          {route.badges.map((badge) => (
            <span key={badge} className="px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Route Description */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">{route.route}</p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
        <button
          onClick={onToggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded transition-colors text-sm font-medium ${
            isLiked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg className={`w-4 h-4`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          Details
        </button>
      </div>
    </div>
  );
}

function TransportIcon({ mode }) {
  const icons = {
    Jeepney: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M6 18q-1 0-1-1v-3H3V9q0-1 1-1h14q1 0 1 1v5h-2v3q0 1-1 1h-1q-1 0-1-1v-1h-4v1q0 1-1 1H6Z" /></svg>,
    Bus: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14q1 0 1 1v2h2v2h-2v8h2v2h-2v1q0 1-1 1h-1q-1 0-1-1v-1H7v1q0 1-1 1H5q-1 0-1-1V4q0-1 1-1Z" /></svg>,
    UV: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M8 3h8q1 0 1 1v2h2v2h-2v8h2v2h-2v1q0 1-1 1h-1q-1 0-1-1v-1H9v1q0 1-1 1H7q-1 0-1-1V4q0-1 1-1Z" /></svg>,
  };
  return icons[mode] || null;
}
