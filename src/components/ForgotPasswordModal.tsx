import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Lock,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react';
import type { PasswordResetRequest } from '../types/index.ts';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onNavigateToReset?: (token: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onClose,
  onNavigateToReset,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    request: PasswordResetRequest;
    simulatedEmailDelivery?: {
      to: string;
      subject: string;
      body: string;
    };
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your staff email or username.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: identifier.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData(data);
      } else {
        setError(data.error || 'Unable to process password reset request. Please check your details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while contacting authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const copyResetUrl = () => {
    if (!successData?.request?.resetLink) return;
    const fullUrl = `${window.location.origin}${successData.request.resetLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1a0f0a]/95 border border-[rgba(225,165,95,0.28)] rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-100 shadow-2xl shadow-black/80 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#20120b] hover:bg-[#2c180e] text-[#a88d77] hover:text-white transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!successData ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#361e11] border border-[rgba(200,140,80,0.3)] flex items-center justify-center text-amber-400 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#fdf6ed] tracking-tight">
                  Staff Password Recovery
                </h2>
                <p className="text-xs text-[#a88d77]">
                  White Collar Realty Security & Identity Portal
                </p>
              </div>
            </div>

            <p className="text-xs text-[#c9b19e] mb-5 leading-relaxed">
              Enter your registered staff email address or username (e.g. <span className="font-mono text-amber-400">nisha@whitecollarrealty.com</span>, <span className="font-mono text-amber-400">sameer.admin</span>, or <span className="font-mono text-amber-400">lalit.sir</span>). A secure, time-limited verification token will be generated and routed for Admin approval.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e8c89b] mb-1.5">
                  Staff Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8d735f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. nisha@whitecollarrealty.com or sameer.admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-xs text-white placeholder-[#7d6554] focus:outline-hidden focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Security Policy Notice */}
              <div className="p-3 bg-[#140b07] border border-[rgba(200,140,80,0.2)] rounded-2xl space-y-1 text-[11px] text-[#a88d77]">
                <div className="flex items-center gap-1.5 font-bold text-[#fdf6ed]">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dual Verification & Admin Override Policy</span>
                </div>
                <p>
                  Reset links require Admin approval or token verification within a 30-minute window. Admin (Sameer Sir) has full access to change credentials directly.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#20120b] hover:bg-[#2c180e] text-[#a88d77] hover:text-[#fdf6ed] font-semibold text-xs rounded-xl border border-[rgba(200,140,80,0.2)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#c98944] to-amber-600 hover:from-[#db974e] hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Request Reset Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#fdf6ed]">Reset Request Registered!</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {successData.request.userName} ({successData.request.userRole})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#c9b19e] leading-relaxed">
              {successData.message}
            </p>

            {/* Token & Expiry Details Card */}
            <div className="p-4 bg-[#140b07] border border-[rgba(200,140,80,0.2)] rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#a88d77]">Target Account:</span>
                <strong className="text-white font-mono">{successData.request.userEmail}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a88d77]">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {successData.request.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a88d77] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8d735f]" />
                  Token Validity:
                </span>
                <strong className="text-slate-200">30 Minutes</strong>
              </div>
              <div className="pt-2 border-t border-[rgba(200,140,80,0.18)]">
                <span className="text-[11px] text-[#a88d77] block mb-1">Verification Token:</span>
                <div className="p-2 bg-[#1c100a] border border-[rgba(200,140,80,0.2)] rounded-xl font-mono text-[11px] text-amber-300 select-all break-all">
                  {successData.request.token}
                </div>
              </div>
            </div>

            {/* Simulated Email Card */}
            {successData.simulatedEmailDelivery && (
              <div className="p-3.5 bg-[#140b07]/80 border border-[rgba(200,140,80,0.2)] rounded-2xl space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-[#a88d77]">
                  <span className="font-semibold text-[#fdf6ed] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    Simulated Email Dispatch:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Delivered</span>
                </div>
                <div className="p-2 bg-[#1c100a] rounded-lg text-[#c9b19e] font-mono text-[10px] whitespace-pre-wrap border border-[rgba(200,140,80,0.15)]">
                  {successData.simulatedEmailDelivery.body}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={copyResetUrl}
                className="w-full sm:flex-1 py-2.5 bg-[#20120b] hover:bg-[#2c180e] text-[#e8c89b] font-semibold text-xs rounded-xl border border-[rgba(200,140,80,0.2)] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>{copiedLink ? 'Link Copied!' : 'Copy Reset Link'}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToReset) {
                    onNavigateToReset(successData.request.token);
                  } else {
                    window.location.href = successData.request.resetLink || `/reset-password?token=${successData.request.token}`;
                  }
                }}
                className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-[#c98944] to-amber-600 hover:from-[#db974e] hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Reset Screen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
