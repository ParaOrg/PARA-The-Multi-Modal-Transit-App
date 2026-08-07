import { useRef } from 'react';

/**
 * 6-box OTP digit input.
 * Props:
 *   value    — string of up to 6 digits
 *   onChange — (newValue: string) => void
 *   disabled — boolean
 */
export default function OTPInput({ value = '', onChange, disabled = false }) {
  const digits = (value + '      ').slice(0, 6).split('');
  const refs = useRef([]);

  const handleChange = (idx, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw && !e.nativeEvent.inputType?.includes('delete')) return;

    const next = [...digits];
    next[idx] = raw.slice(-1);
    onChange(next.join('').replace(/\s/g, ''));

    if (raw && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (!next[idx]?.trim() && idx > 0) {
        refs.current[idx - 1]?.focus();
      } else {
        next[idx] = '';
        onChange(next.join('').replace(/\s/g, ''));
      }
    }
    if (e.key === 'ArrowLeft'  && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i]?.trim() || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 sm:w-14 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold text-gray-900 rounded-xl
                     bg-gray-50 border-2 border-gray-200
                     focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />
      ))}
    </div>
  );
}
