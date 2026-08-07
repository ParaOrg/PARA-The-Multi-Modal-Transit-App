import { Link } from 'react-router-dom';
import paralogo from '../assets/images/Para1P.png';

const FOOTER_LINKS = [
  { to: '/', label: 'Home', locked: false },
  { to: '/about', label: 'About', locked: false },
  { to: '/privacy-policy', label: 'Privacy Policy', locked: false },
  { to: '/explore', label: 'Explore', locked: true },
  { to: '/community', label: 'Community', locked: true },
  { to: '/signup', label: 'Sign Up', locked: false },
];

const DPO_EMAIL = 'para.ph.info@gmail.com';

export default function LandingPageFooter({ className = '' }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-gray-200 bg-gray-50 text-gray-600 ${className}`}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
              <img src={paralogo} alt="" className="h-10 w-auto object-contain" width={120} height={40} />
              <span className="sr-only">Para PH home</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed sm:text-base">
              Metro Manila&rsquo;s commute companion: community-first routes, transit context, and tools built for commuters and partners.
            </p>
            <p className="mt-4 text-sm">
              <span className="font-semibold text-gray-800">Data protection:</span>{' '}
              <a
                href={`mailto:${DPO_EMAIL}`}
                className="text-purple-900 underline decoration-purple-900/30 underline-offset-2 hover:text-pink-700"
              >
                {DPO_EMAIL}
              </a>
            </p>
          </div>

          <nav aria-labelledby="footer-explore-heading" className="min-w-0">
            <h2 id="footer-explore-heading" className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Explore
            </h2>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.map(({ to, label, locked }) => (
                <li key={to}>
                  {locked ? (
                    <Link
                      to="/signup"
                      className="text-sm font-medium text-gray-500 hover:text-purple-900 focus:outline-none focus-visible:text-purple-900 focus-visible:underline rounded-sm"
                    >
                      {label} <span className="text-[10px] text-gray-400 ml-1">🔒</span>
                    </Link>
                  ) : (
                    <Link
                      to={to}
                      className="text-sm font-medium text-gray-700 hover:text-purple-900 focus:outline-none focus-visible:text-purple-900 focus-visible:underline rounded-sm"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal-heading" className="min-w-0">
            <h2 id="footer-legal-heading" className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Legal
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm font-medium text-gray-700 hover:text-purple-900 focus:outline-none focus-visible:text-purple-900 focus-visible:underline rounded-sm"
                >
                  Privacy policy
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-8 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>
            &copy; {year} Para PH. All rights reserved.
          </p>
          <p className="max-w-prose leading-relaxed">
            We process personal data in line with the Data Privacy Act of 2012 (Republic Act No. 10173). See our{' '}
            <Link to="/privacy-policy" className="font-medium text-purple-900 hover:text-pink-700 underline-offset-2 hover:underline">
              privacy policy
            </Link>
            {' '}for details.
          </p>
        </div>
      </div>
    </footer>
  );
}
