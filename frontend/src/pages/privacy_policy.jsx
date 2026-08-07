import { Link } from 'react-router-dom';
import LandingPageFooter from '../components/landingpage-footer.component.jsx';

const SECTIONS = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <p className="mb-4 text-gray-600 leading-relaxed">
          Para PH uses a progressive data collection model: we keep data minimal at first and expand only as needed to deliver value to partners and users. Depending on your relationship with us, we may collect:
        </p>
        <ul className="list-disc space-y-3 pl-5 text-gray-600 marker:text-purple-600">
          <li>
            <span className="font-semibold text-gray-800">Mobility and GPS data.</span> Real-time and historical location, route paths based on movement, trip timestamps (start, stop, duration), and movement behavior such as speed and idle periods through your device and GPS modules integrated in PUVs.
          </li>
          <li>
            <span className="font-semibold text-gray-800">Fleet operations data.</span> Dispatch frequency, vehicle intervals, stop dwell times, route adherence, and vehicle activity states (active, idle, offline).
          </li>
          <li>
            <span className="font-semibold text-gray-800">IoT and technical data.</span> Non-personal device identifiers assigned to GPS units, connectivity strength, uptime, signal quality, and hardware diagnostics including battery performance.
          </li>
          <li>
            <span className="font-semibold text-gray-800">Media and participation data.</span> Photos, videos, or recordings related to device installation, pilot activities, field operations, and public communications, collected only with explicit consent.
          </li>
          <li>
            <span className="font-semibold text-gray-800">Network intelligence (aggregated).</span> Demand signals (e.g. estimated passenger levels), peak movement patterns, boarding and alighting estimates, route structures, stop locations, and events such as congestion or road closures.
          </li>
          <li>
            <span className="font-semibold text-gray-800">System performance and feedback.</span> Accuracy of estimated travel times, route consistency metrics, and voluntary observations from drivers about route conditions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <ul className="list-disc space-y-3 pl-5 text-gray-600 marker:text-purple-600">
        <li>Improving routing algorithms and reducing operational inefficiencies.</li>
        <li>Generating insights and demand models to support transport cooperatives.</li>
        <li>Supporting transport planning and future mobility solutions.</li>
        <li>Enhancing system reliability, hardware accuracy, and platform performance.</li>
      </ul>
    ),
  },
  {
    id: 'not-collect',
    title: 'Data we do not collect',
    body: (
      <ul className="list-disc space-y-3 pl-5 text-gray-600 marker:text-purple-600">
        <li>Detailed personal driver profiles beyond what operationally necessary.</li>
        <li>
          We do not currently collect fares, process payments, or store credit card or bank data. Any future use of driver bank accounts or digital wallets would require a separate, explicit opt-in.
        </li>
        <li>Medical, biometric, or health-related information.</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'Data sharing',
    body: (
      <>
        <p className="mb-4 text-gray-600 leading-relaxed">
          We do not sell your personal data. We may share information with:
        </p>
        <ul className="list-disc space-y-3 pl-5 text-gray-600 marker:text-purple-600">
          <li>Transportation-related groups we are officially partnered with (e.g. associations, cooperatives, federations).</li>
          <li>Service providers who help operate the platform (e.g. cloud storage, messaging), under confidentiality obligations.</li>
          <li>Regulatory authorities when required by law.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Data security',
    body: (
      <p className="text-gray-600 leading-relaxed">
        We apply organizational, physical, and technical safeguards, including encryption and access controls, to protect personal data from unauthorized access, loss, or misuse. No method of transmission over the internet is completely secure.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    body: (
      <p className="text-gray-600 leading-relaxed">
        We retain personal data while your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting us, subject to legal retention requirements.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights under the DPA',
    body: (
      <ul className="list-disc space-y-3 pl-5 text-gray-600 marker:text-purple-600">
        <li>Right to be informed about how your data is collected and used.</li>
        <li>Right to access a copy of the personal data we hold.</li>
        <li>Right to correct inaccurate or outdated information.</li>
        <li>Right to erasure or blocking of personal data in certain circumstances.</li>
        <li>Right to object to processing of your personal data.</li>
        <li>Right to lodge a complaint with the National Privacy Commission.</li>
      </ul>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p className="text-gray-600 leading-relaxed">
        For questions, concerns, or to exercise your privacy rights, contact our Data Protection Officer at{' '}
        <a href="mailto:para.ph.info@gmail.com" className="font-semibold text-purple-900 hover:text-pink-700 underline-offset-2 hover:underline">
          para.ph.info@gmail.com
        </a>
        . You may also reach us through our{' '}
        <Link to="/contact" className="font-semibold text-purple-900 hover:text-pink-700 underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white">
      <article className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
        <h1 className="mt-2 text-5xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Privacy and data use
        </h1>
        <p className="mt-2 text-2xl text-gray-500">Last updated: April 1, 2026</p>

        <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50/80 p-6 sm:p-8">
          <p className="text-gray-700 leading-relaxed">
            Welcome to Para PH. In accordance with the{' '}
            <span className="font-semibold text-gray-900">Data Privacy Act of 2012</span>{' '}
            (Republic Act No. 10173), participants are informed that personal information, vehicle telemetry, and media supplied or collected may be processed for transit operations, system documentation, and marketing. By agreeing or continuing to use our services where consent is requested, you voluntarily consent to processing of your information and, where applicable, use of your image, likeness, and voice by Para PH.
          </p>
        </div>

        <nav aria-label="On this page" className="mt-10 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-900">On this page</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-purple-900">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="underline-offset-2 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-14">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4">{section.body}</div>
            </section>
          ))}
        </div>

        {/* <p className="mt-14 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
          By continuing to use Para PH, you acknowledge that you have read and understood this policy.
        </p> */}
{/* 
        <p className="mt-8">
          <Link
            to="/"
            className="text-sm font-semibold text-purple-900 hover:text-pink-700"
          >
            &larr; Back to home
          </Link>
        </p> */}
      </article>

      <LandingPageFooter />
    </div>
  );
}
