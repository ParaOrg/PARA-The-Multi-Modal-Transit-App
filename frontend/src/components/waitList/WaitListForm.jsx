import { useRef, useState } from 'react';
import { getApiBaseUrl } from '../../config/api';

export function WaitListForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const abortControllerRef = useRef(null);
  const API_BASE_URL = getApiBaseUrl();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
        signal: controller.signal,
      });

      const payload = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'You have been added to the waitlist!' });
        setFormData({ name: '', email: '' });
      } else if (response.status === 409 || payload.error === 'DUPLICATE_EMAIL') {
        setSubmitStatus({ type: 'error', message: 'This email is already on the waitlist.' });
      } else if (response.status === 429 || payload.error === 'RATE_LIMITED') {
        setSubmitStatus({ type: 'error', message: 'Too many attempts. Please wait and try again.' });
      } else {
        setSubmitStatus({ type: 'error', message: payload.message ?? 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        setSubmitStatus({ type: 'error', message: 'Submission canceled.' });
      } else {
        console.error('Error submitting waitlist form:', error);
        setSubmitStatus({ type: 'error', message: 'Failed to connect. Please try again later.' });
      }
    } finally {
      abortControllerRef.current = null;
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmission = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      handleCancelSubmission();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="relative w-full sm:w-[90vw] max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 mb-16 sm:mb-0">
      {/* Header */}
      <div className="bg-purple-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-semibold text-white">Join the Waitlist</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Be the first to know when we launch! Sign up for early access.
        </p>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-purple-800 outline-none transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-purple-800 outline-none transition-all"
            placeholder="Enter your email"
          />
        </div>

        {submitStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            submitStatus.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {submitStatus.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-purple-900 text-white font-medium rounded-lg hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Join Waitlist'
          )}
        </button>

        {isSubmitting && (
          <button
            type="button"
            onClick={handleCancelSubmission}
            className="w-full py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel Submission
          </button>
        )}
      </form>
    </div>
    </div>
  );
}
