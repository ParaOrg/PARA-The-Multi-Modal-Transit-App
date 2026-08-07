import { useState } from 'react';
import LandingPageFooter from '../components/landingpage-footer.component.jsx';
import teamPhoto from '../assets/images/ParaTeamPhoto.jpg';

export default function Contact() {
  const cardShell = 'rounded-3xl border border-gray-200 bg-white shadow-[0_12px_35px_rgba(17,24,39,0.08)]';

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus('success');
    setFormData({ name: '', email: '', message: '' });
    setLoading(false);

    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div className="relative w-full min-h-full bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 md:py-24">

        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 mb-6 md:mb-8 tracking-tight">
            Para <span className="text-[#4f00cd]">Po!</span>
          </h1>
          <p className="text-base sm:text-lg md:text-[1.65rem] text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Got a <span className="text-[#4f00cd] font-medium">route suggestion</span>, a <span className="text-[#310775] font-medium">bug to report</span>, or just want to vent about today's traffic? Tap into the network. Shoot us a message and let's make Metro Manila commutes a little smoother together.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-5 gap-6 md:gap-10">

          {/* Contact Info - Left side */}
          <div className="md:col-span-2 space-y-6">
            <figure className={`group overflow-hidden p-2 ${cardShell}`}>
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.15rem] bg-gray-100">
                <img
                  src={teamPhoto}
                  alt="Para team collaborating in the office"
                  className="h-full w-full object-cover object-[50%_34%] transition-transform duration-500 group-hover:scale-[1.02]"
                />

                <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/35" />

                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                  <p className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Para Team
                  </p>
                  <p className="mt-2 text-sm sm:text-base font-medium text-white/95">
                    Building better commutes, together.
                  </p>
                </figcaption>
              </div>
            </figure>

            <div className={`${cardShell} p-6 sm:p-8 md:p-10`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8">Connect with Us</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Email Us</h3>
                    <a href="mailto:para.ph.info@gmail.com" className="text-purple-800 hover:text-purple-900 transition-colors text-base">
                      para.ph.info@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-800" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0022 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Facebook</h3>
                    <a href="https://www.facebook.com/para.commute" target="_blank" rel="noreferrer" className="text-purple-800 hover:text-purple-900 transition-colors text-base break-all">
                      facebook.com/para.commute
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.8A3.95 3.95 0 003.8 7.75v8.5a3.95 3.95 0 003.95 3.95h8.5a3.95 3.95 0 003.95-3.95v-8.5a3.95 3.95 0 00-3.95-3.95h-8.5zm8.85 1.55a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zM12 7.4a4.6 4.6 0 110 9.2 4.6 4.6 0 010-9.2zm0 1.8a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Instagram</h3>
                    <a href="https://www.instagram.com/para.commute/?hl=en" target="_blank" rel="noreferrer" className="text-purple-800 hover:text-purple-900 transition-colors text-base break-all">
                      instagram.com/para.commute
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* You can uncomment this if you want, but please reposition it -shiva */}
            {/* <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <p className="text-purple-800 text-base leading-relaxed">
                <span className="font-semibold">Para is community-powered.</span> Your feedback shapes every update. Every question helps us improve. Every suggestion matters.
              </p>
            </div> */}
          </div>

          {/* Contact Form - Right side */}
          <div className="md:col-span-3">
            <div className={`${cardShell} p-6 sm:p-8 md:p-10`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8">Send us a Message</h2>

              {status === 'success' && (
                <div className="mb-6 p-5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-base">
                  Thanks for reaching out! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Juan dela Cruz"
                    className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg bg-gray-50 border-2 border-gray-200
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg bg-gray-50 border-2 border-gray-200
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl text-gray-900 bg-gray-50 border-2 border-gray-200
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-11 py-4 rounded-full font-bold text-lg text-white
                             bg-[#4f00cd] hover:bg-[#3f00a8]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/45 focus-visible:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-purple-500/20"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-14 md:mt-20 text-center">
          <p className="text-gray-600 text-base sm:text-lg md:text-2xl">
            Every bug report, feature idea, and quick 'hello' helps us build a better commute for everyone
          </p>
        </div>
      </div>

      <LandingPageFooter />
    </div>
  );
}
