import paralogo from '../assets/images/Para1P.png';

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-5/12 flex-col min-h-svh p-12 bg-[#5b21b6] relative overflow-hidden shrink-0">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-purple-600/10 blur-3xl" />

      {/* Centered community block (no logo) */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 py-8">
        <div className="w-full max-w-lg h-64 md:h-72 rounded-3xl bg-white/10 border-2 border-dashed border-white/25 flex flex-col items-center justify-center gap-4 text-white/50">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <span className="text-base font-semibold">Community illustration</span>
        </div>

        <div className="text-center px-4 max-w-xl">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            Join the Community
          </h2>
          <p className="text-purple-100 text-xl md:text-2xl leading-relaxed">
            Building a community-led way to navigate Metro Manila.
          </p>
        </div>
      </div>

      {/* <div className="relative z-10 shrink-0 text-center lg:text-left">
        <p className="text-purple-200 text-base">Helping commuters find their way &mdash; since 2024</p>
      </div> */}
    </div>
  );
}

export default function AuthPageLayout({ variant = 'default', children }) {
  if (variant === 'split') {
    return (
      <div className="flex min-h-svh h-svh overflow-hidden">
        {/* Form first (left); brand panel second (right) for LTR reading */}
        <div className="flex-1 bg-white flex flex-col overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>

        <BrandPanel />
      </div>
    );
  }

  // Default: white centered (used by Login and OTP step)
  return (
    <div className="flex min-h-svh h-svh flex-col bg-gray-50 overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* <div className="mb-8 flex justify-center">
            <img src={paralogo} alt="ParaPH" className="h-14 w-auto object-contain md:h-16" />
          </div> */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 md:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
