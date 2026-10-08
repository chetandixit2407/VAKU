import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  KeyRound,
  ArrowRight,
  RefreshCw,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

interface ResetPasswordViewProps {
  token: string;
  onBackToLogin: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  token,
  onBackToLogin,
}) => {
  const [tokenInput, setTokenInput] = useState(token);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<any>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [approvingDirect, setApprovingDirect] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setVerifying(false);
      setVerifyError('No password reset token provided. Please check the reset link from your email.');
    }
  }, [token]);

  const verifyToken = async (tok: string) => {
    if (!tok.trim()) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/auth/reset-password/verify?token=${encodeURIComponent(tok.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setVerifyData(data);
      } else {
        setVerifyError(data.error || 'Invalid or expired password reset token.');
      }
    } catch (err: any) {
      setVerifyError('Network error while verifying security token.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateAdminApprove = async () => {
    if (!verifyData?.request?.id) return;
    setApprovingDirect(true);
    try {
      const res = await fetch(`/api/admin/password-resets/${verifyData.request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: 'usr-admin-sameer',
          adminName: 'Sameer Sir (Admin)',
          role: 'ADMIN',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        verifyToken(tokenInput);
      } else {
        setSubmitError(data.error || 'Failed to approve reset request.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Error during approval.');
    } finally {
      setApprovingDirect(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 5) {
      setSubmitError('Password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setSubmitError(data.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Network error while updating password.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { label: 'None', color: 'bg-slate-700', width: '0%' };
    if (newPassword.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (newPassword.length < 9) return { label: 'Medium', color: 'bg-amber-500', width: '60%' };
    return { label: 'Strong (PBKDF2 Secured)', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">White Collar Realty</h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase">
              Staff Security & Password Management
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Verifying reset authorization token...</p>
            </div>
          ) : verifyError ? (
            /* ERROR / INVALID TOKEN STATE */
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Token Invalid or Expired</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{verifyError}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onBackToLogin}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  Return to Staff Login
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* SUCCESS STATE */
            <div className="space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Password Updated Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your new password has been securely hashed and stored. You can now access your staff dashboard.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-left space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Account:</span>
                  <strong className="text-white">{verifyData?.request?.userName}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Role:</span>
                  <span className="text-amber-400 font-mono">{verifyData?.request?.userRole}</span>
                </div>
              </div>

              <button
                onClick={onBackToLogin}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Staff Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* FORM STATE */
            <div className="space-y-4">
              {/* User Profile Banner */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white">{verifyData?.request?.userName}</h4>
                  <p className="text-[11px] text-slate-400">{verifyData?.request?.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {verifyData?.request?.userRole}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{verifyData?.request?.department}</p>
                </div>
              </div>

              {/* Admin Approval Notice Banner */}
              {verifyData?.requiresAdminApproval && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Admin Approval Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This password reset link was requested via staff recovery. Admin (Sameer Sir) has been notified. You may set your new password below, or Admin can approve directly from the Admin Console.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateAdminApprove}
                    disabled={approvingDirect}
                    className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {approvingDirect ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Simulate Admin One-Click Approval</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password (min 5 chars)"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Strength: <strong className="text-slate-200">{strength.label}</strong></span>
                        <span className="text-slate-500">PBKDF2 SHA-256</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Set New Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>WCR End-to-End Encrypted Identity & Access Management</span>
        </div>
      </div>
    </div>
  );
};
