import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import paralogo from '../assets/images/Para1P.png';
import GasPriceWidget from './GasPrice/index.jsx';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Commute' },
  { to: '/explore', label: 'Explore' },
  { to: '/community', label: 'Community' },
  { to: '/gas-prices', label: 'Gas Prices' },
  { to: '/about', label: 'About' },
  { to: '/admin', label: 'Admin' },
];

function HamburgerIcon({ open }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isGuest } = useAuth();

  const activeIndex = useMemo(() => {
    const idx = NAV_LINKS.findIndex(({ to }) => (to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`)));
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  const activeLink = useMemo(() => {
    return (path) => (path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`));
  }, [location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const pillWidth = `calc((100% - 0.75rem) / ${NAV_LINKS.length})`;
  const pillTransform = `translateX(${activeIndex * 100}%)`;

  return (
    <nav className="sticky top-0 z-[120] border-b border-black/5 bg-white/90 px-4 py-1.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10">
      <div className="mx-auto flex h-[3.8rem] w-full max-w-[1680px] items-center justify-center lg:justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] relative">
        <Link to="/" className="flex min-w-0 shrink-0 items-center">
          <img src={paralogo} alt="PARAPH Logo" className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 hover:scale-[1.02]" />
        </Link>

        <div className="hidden lg:flex items-center justify-center px-2 xl:px-4 lg:justify-self-center">
          <div className="relative grid h-[2.8rem] w-[36rem] items-center rounded-full border border-black/5 bg-gray-100/90 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-white/70"
               style={{ gridTemplateColumns: `repeat(${NAV_LINKS.length}, minmax(0, 1fr))` }}>
            <span
              aria-hidden
              className="pointer-events-none absolute left-1.5 top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-white shadow-[0_8px_18px_rgba(79,0,205,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: pillWidth, transform: pillTransform }}
            />
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = activeLink(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative z-[1] flex h-full items-center justify-center rounded-full px-4 text-[0.95rem] font-semibold leading-none tracking-[0.01em] transition-colors duration-200 whitespace-nowrap ${
                    isActive ? 'text-[#4f00cd]' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2.5 md:flex lg:justify-self-end">
          <GasPriceWidget compact className="w-[12rem] lg:w-[14rem] xl:w-[16rem]" />
          
          {user && !isGuest ? (
            <button
              onClick={logout}
              className="inline-flex h-10 items-center rounded-full bg-gray-800 px-5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-900 whitespace-nowrap"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-gray-700 hover:text-[#4f00cd] transition-colors whitespace-nowrap">Login</Link>
              <Link to="/signup" className="inline-flex h-10 items-center rounded-full bg-[#4f00cd] px-5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(79,0,205,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3f00a8] hover:shadow-[0_14px_24px_rgba(79,0,205,0.26)] whitespace-nowrap">Sign Up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/45 transition-colors touch-manipulation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <HamburgerIcon open={mobileOpen} />
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-[130] bg-black/40" aria-hidden={!mobileOpen} onClick={closeMobile} />
          <div id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu" className="md:hidden fixed inset-0 z-[140] h-svh w-screen bg-white text-gray-900 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="text-sm font-semibold tracking-[0.04em] text-gray-800">Menu</span>
              <button type="button" className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 -mr-1" aria-label="Close menu" onClick={closeMobile}><HamburgerIcon open /></button>
            </div>
            <nav className="flex flex-col px-6 pt-6 pb-6 gap-2 flex-1 overflow-y-auto">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} onClick={closeMobile} aria-current={activeLink(to) ? 'page' : undefined}
                  className={`py-3 px-2 rounded-xl text-[1.95rem] leading-[1.2] font-semibold transition-all duration-200 ${activeLink(to) ? 'text-[#4f00cd] bg-[#f5f0ff]' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>
                  {label}
                </Link>
              ))}
              {user && !isGuest ? (
                <button onClick={() => { logout(); closeMobile(); }} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-gray-800 px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.15)]">Logout</button>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobile} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-gray-200 px-5 py-3 text-base font-bold text-gray-800">Login</Link>
                  <Link to="/signup" onClick={closeMobile} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#4f00cd] px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(79,0,205,0.2)]">Sign Up</Link>
                </>
              )}
            </nav>
            <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">Gas prices</p>
              <div className="[&_a]:w-full [&_a]:justify-center [&_a]:max-w-full [&_a]:overflow-hidden">
                <GasPriceWidget compact />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
