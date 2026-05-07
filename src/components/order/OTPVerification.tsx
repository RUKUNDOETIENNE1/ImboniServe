import { useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  branchId: string;
  phone: string;
  onVerified: () => void;
  onPhoneChange: (phone: string) => void;
}

export default function OTPVerification({
  branchId,
  phone,
  onVerified,
  onPhoneChange
}: OTPVerificationProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function requestOTP() {
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, phone })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      startResendCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, phone, code: otpCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid code');
      }

      setSuccess(true);
      setTimeout(() => onVerified(), 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-1">Phone Verified!</h3>
        <p className="text-sm text-green-700">You can now place your order</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Verify Your Phone</h3>
        <p className="text-sm text-slate-600">
          For remote orders, we need to verify your phone number
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!otpSent ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="07XX XXX XXX"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Rwanda numbers start with 078, 079, 072, or 073
            </p>
          </div>

          <button
            onClick={requestOTP}
            disabled={loading || !phone}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              We sent a 6-digit code to <strong>{phone}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <button
            onClick={verifyOTP}
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-slate-600">
                Resend code in {resendCooldown}s
              </p>
            ) : (
              <button
                onClick={() => {
                  setOtpCode('');
                  setError(null);
                  requestOTP();
                }}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend Code
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setOtpSent(false);
              setOtpCode('');
              setError(null);
            }}
            className="w-full text-sm text-slate-600 hover:text-slate-800"
          >
            Change Phone Number
          </button>
        </div>
      )}
    </div>
  );
}
