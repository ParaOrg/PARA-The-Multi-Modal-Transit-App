import Navbar from '../components/Navbar';
import LandingPageFooter from '../components/landingpage-footer.component.jsx';
import { Link } from 'react-router-dom';
import heroBanner from '../assets/images/about-page/image-1.jpeg';
import communityPhoto from '../assets/images/about-page/image-2.jpeg';
import commuterPhoto from '../assets/images/about-page/image-3.jpeg';

function PeopleIcon() {
  return (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5-2.236M17 20H7m10 0v-2c0-.653-.125-1.276-.354-1.846M7 20H2v-2a3 3 0 015-2.236M7 20v-2c0-.653.125-1.276.354-1.846m0 0a5 5 0 019.292 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h4a2 2 0 002-2v-3a2 2 0 012-2h2a2 2 0 002 2v3a2 2 0 002 2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5h.01M17 19V9a4 4 0 00-4-4H7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.172V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.172c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
    </svg>
  );
}

function ScenarioIcon({ kind }) {
  if (kind === 'work') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5v-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V4.875A1.875 1.875 0 0110.875 3h2.25A1.875 1.875 0 0115 4.875V6" />
      </svg>
    );
  }

  if (kind === 'school') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l9 4.5-9 4.5-9-4.5L12 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.75V16.5A10.5 10.5 0 0012 18a10.5 10.5 0 004.5-1.5v-3.75" />
      </svg>
    );
  }

  if (kind === 'night') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3c-.21.68-.32 1.4-.32 2.15A8 8 0 0019.85 13c.75 0 1.47-.11 2.15-.21z" />
      </svg>
    );
  }

  if (kind === 'route') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM20.5 19a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h5a3 3 0 013 3v8a3 3 0 003 3h1" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function AutoScenarioCarousel({ items }) {
  if (!items.length) return null;

  const flowingItems = [...items, ...items];

  return (
    <div className="mt-8 overflow-hidden md:mt-10">
      <style>{`
        @keyframes commute-river {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>

      <div className="flex w-max items-center gap-3 px-4 md:px-0" style={{ animation: 'commute-river 28s linear infinite', willChange: 'transform' }}>
        {flowingItems.map(({ label, kind, tone }, index) => (
          <div key={`${label}-${index}`} className="flex-none">
            <div className={`flex items-center gap-3 rounded-full border px-5 py-3.5 text-[0.98rem] font-semibold shadow-[0_5px_14px_rgba(15,23,42,0.04)] ${tone}`}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                <ScenarioIcon kind={kind} />
              </span>
              <span>{label}</span>
            </div>
          </div>
        ))}
        </div>
      <LandingPageFooter />
    </div>
  );
}

const COMMUTE_SCENARIOS = [
  { label: 'Morning rush hour', kind: 'work', tone: 'border-[#dbe7ff] bg-[#f5f8ff] text-[#315ea8]' },
  { label: 'Office commute', kind: 'work', tone: 'border-[#dde8ff] bg-[#f3f7ff] text-[#2c5fae]' },
  { label: 'Campus commute', kind: 'school', tone: 'border-[#e5ddff] bg-[#f6f3ff] text-[#5b37ad]' },
  { label: 'Class-to-class hops', kind: 'school', tone: 'border-[#e9ddff] bg-[#f7f3ff] text-[#6032c9]' },
  { label: 'UV express transfers', kind: 'route', tone: 'border-[#d7eefc] bg-[#eef8ff] text-[#0b78a8]' },
  { label: 'Jeepney route checks', kind: 'route', tone: 'border-[#d5f0ea] bg-[#edf9f5] text-[#12795f]' },
  { label: 'MRT and LRT planning', kind: 'route', tone: 'border-[#d8f1e2] bg-[#effaf3] text-[#14703f]' },
  { label: 'Rainy day reroutes', kind: 'route', tone: 'border-[#dae9ff] bg-[#f2f7ff] text-[#2e60a8]' },
  { label: 'After-hours commute', kind: 'night', tone: 'border-[#e9e4ff] bg-[#f7f5ff] text-[#5d42b0]' },
  { label: 'Weekend lakad plans', kind: 'night', tone: 'border-[#ffe5ef] bg-[#fff3f8] text-[#ba3a74]' },
  { label: 'Safety-first trips', kind: 'safe', tone: 'border-[#d9efe4] bg-[#eff8f2] text-[#1f7a4f]' },
  { label: 'Budget-friendly routes', kind: 'safe', tone: 'border-[#ffe9d8] bg-[#fff5ec] text-[#a35d1a]' },
];

// const VALUES = [
//   {
//     title: 'Community-Driven',
//     desc: 'Real commuters sharing real experiences. No corporate speak, just honest help from people who get it.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
//       </svg>
//     ),
//   },
//   {
//     title: 'Accuracy Matters',
//     desc: 'Routes change, roads close, detours happen. We stay updated so you are never caught off guard.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//       </svg>
//     ),
//   },
//   {
//     title: 'Inclusive & Accessible',
//     desc: 'Everyone deserves a smooth commute. Whether you speak Tagalog, English, or need extra help — we are here.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
//       </svg>
//     ),
//   },
//   {
//     title: 'Always Improving',
//     desc: 'Built with feedback from you. Every feature, every update, every route comes from what the community needs.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
//       </svg>
//     ),
//   },
//   {
//     title: 'Proudly Filipino',
//     desc: 'Made for Metro Manila, by Metro Manila. We know the chaos, the charm, and everything in between.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
//       </svg>
//     ),
//   },
//   {
//     title: 'Free & Open',
//     desc: 'No paywalls, no premium tiers. Getting around should not cost extra. Para is for everyone.',
//     icon: (
//       <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
//       </svg>
//     ),
//   },
// ];

export default function About() {
  return (
    <div className="relative w-full min-h-screen bg-white overflow-y-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Navbar />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-28">

        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-28">
          <div className="group relative mx-auto mb-12 w-full max-w-6xl overflow-hidden rounded-3xl border border-[#ece6f8] bg-white shadow-[0_12px_40px_rgba(79,0,205,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(79,0,205,0.14)] hover:border-[#d8c8ff]">
            <img
              src={heroBanner}
              alt="Para — Metro Manila commuters and community"
              className="h-[min(52vh,28rem)] w-full min-h-[20rem] object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/12 transition-opacity duration-300 group-hover:bg-[#0f172a]/16" />
            <div className="absolute left-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-[#4f00cd]/88 px-4 py-3 text-white shadow-[0_10px_24px_rgba(79,0,205,0.28)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(79,0,205,0.34)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <PeopleIcon />
              </span>
              <span className="flex flex-col leading-none text-left">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Para community</span>
                <span className="text-sm font-semibold">Built by commuters</span>
              </span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-gray-900 mb-6 md:mb-8 tracking-tight leading-[1.05]">
            We're not just tech.
            <br />
            <span className="text-[#4f00cd]">
              We're community.
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-2xl font-normal text-gray-700 leading-relaxed">
            Para is Metro Manila's commute companion, built by commuters, for commuters. We believe getting around shouldn't be a puzzle — it should be simple, reliable, and human.
          </p>
        </div>

        <section className="mb-20 md:mb-24">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              Perfect for your next
              <span className="block text-[#4f00cd]">commute</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-gray-600">
              From everyday biyahe to unpredictable detours, Para helps you plan with confidence.
            </p>
          </div>

          <div className="md:hidden">
            <AutoScenarioCarousel items={COMMUTE_SCENARIOS} />
          </div>

          <div className="mt-8 hidden gap-3 overflow-x-auto pb-2 md:mt-10 md:flex md:flex-wrap md:justify-center md:gap-4 md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COMMUTE_SCENARIOS.map(({ label, kind, tone }, index) => (
              <div
                key={label}
                className={`group shrink-0 items-center gap-2.5 rounded-full border px-5 py-3 text-[0.98rem] font-semibold shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(79,0,205,0.12)] ${tone} ${index > 7 ? 'hidden md:inline-flex' : 'inline-flex'}`}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                  <ScenarioIcon kind={kind} />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-20">
          <Link
            to="/"
            className="group rounded-3xl border border-[#ece6f8] bg-white p-6 sm:p-8 md:p-12 lg:p-14 shadow-[0_12px_40px_rgba(79,0,205,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(79,0,205,0.14)] hover:border-[#d8c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/45"
            aria-label="Built by the Community - open contact page"
          >
            <div className="relative mb-8 overflow-hidden rounded-2xl ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-0.5">
              <img
                src={communityPhoto}
                alt="Commuters building Para together"
                className="w-full min-h-[14rem] h-60 object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute left-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-[#4f00cd]/88 px-4 py-3 text-white shadow-[0_10px_24px_rgba(79,0,205,0.28)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(79,0,205,0.34)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <PeopleIcon />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Community</span>
                  <span className="text-sm font-semibold">Commuter stories</span>
                </span>
              </div>
            </div>
            <div className="transition-transform duration-300 group-hover:translate-x-0.5">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#381d65] mb-5">Built by the Community</h2>
              <p className="text-[#381d65]/75 text-base sm:text-lg md:text-[1.35rem] leading-relaxed">
                Every route, every tip, every piece of advice on Para comes from real commuters who know the streets, the shortcuts, and the struggles. We're not a faceless app — we're your neighbor, your classmate, your coworker.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#4f00cd]">
                Share your feedback
                <span aria-hidden>→</span>
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="group rounded-3xl border border-[#ece6f8] bg-white p-6 sm:p-8 md:p-12 lg:p-14 shadow-[0_12px_40px_rgba(79,0,205,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(79,0,205,0.14)] hover:border-[#d8c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/45"
            aria-label="For the Community - open map page"
          >
            <div className="relative mb-8 overflow-hidden rounded-2xl ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-0.5">
              <img
                src={commuterPhoto}
                alt="Commuters on the move in Metro Manila"
                className="w-full min-h-[14rem] h-60 object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute left-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-[#4f00cd]/88 px-4 py-3 text-white shadow-[0_10px_24px_rgba(79,0,205,0.28)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(79,0,205,0.34)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <RouteIcon />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Routes</span>
                  <span className="text-sm font-semibold">Trip planning</span>
                </span>
              </div>
            </div>
            <div className="transition-transform duration-300 group-hover:translate-x-0.5">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#381d65] mb-5">For the Community</h2>
              <p className="text-[#381d65]/75 text-base sm:text-lg md:text-[1.35rem] leading-relaxed">
                Whether you're a student rushing to class, a worker heading home, or a driver navigating traffic — Para is here to make your commute easier. No gates, no barriers. Just help when you need it.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#4f00cd]">
                Explore the commute map
                <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Mission Section
        <div className="relative bg-[#4f00cd] rounded-3xl p-12 md:p-20 mb-24 md:mb-28 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Our Mission</h2>
            <p className="text-xl md:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
              To empower every Filipino commuter with accurate, real-time information about public transportation — making every journey safer, faster, and less stressful.
            </p>
          </div>

          Commuter type placeholders
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
            {['Bus Riders', 'Train Commuters', 'Jeepney Passengers', 'Drivers'].map((label) => (
              <div key={label} className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
                <p className="text-white/90 text-base md:text-lg font-semibold text-center">{label}</p>
              </div>
            ))}
          </div>
        </div>

        Values Grid
        <div className="mb-24 md:mb-28">
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 text-center mb-14 md:mb-16">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {VALUES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-10 md:p-12 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-7 text-purple-800 group-hover:bg-purple-50 transition-colors duration-300 [&_svg]:w-10 [&_svg]:h-10">
                  {icon}
                </div>
                <h3 className="text-2xl md:text-[1.65rem] font-bold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div> */}

        {/* CTA Section */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white px-8 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(79,0,205,0.14)] hover:border-[#dcd0f7] md:px-16 md:py-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#4f00cd]" />
          <div className="pointer-events-none absolute -left-16 -top-12 h-44 w-44 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-14 h-52 w-52 rounded-full bg-[#310775]/10 blur-3xl" />
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.15rem] bg-[#4f00cd] text-white shadow-[0_18px_30px_rgba(79,0,205,0.24)] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-105">
              <BellIcon />
            </div>
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.28em] text-[#4f00cd] mb-3">
              Stay updated
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
              Join the Para Community
            </h2>
            <p className="text-base sm:text-lg md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Keep up with route updates, community highlights, and platform changes from Para. Sign up to stay in the loop, or log in to continue where you left off.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="px-10 py-4 rounded-full bg-[#4f00cd] text-white font-semibold text-lg shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3f00a8] hover:shadow-[0_14px_24px_rgba(79,0,205,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/45"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 rounded-full border border-gray-300 bg-white text-gray-800 font-semibold text-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[#bda6ef] hover:bg-[#faf8ff] hover:text-[#4f00cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/35"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

      </div>

      
      <LandingPageFooter />
    </div>
  );
}
