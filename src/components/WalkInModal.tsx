import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, RefreshCw } from 'lucide-react';
import type { VisitorType } from '../types/index.ts';
import { STAFF_HOST_OPTIONS, validatePersonName, validateIndianMobile } from '../utils/registrationConfig.ts';

interface WalkInModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({ onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('CLIENT');
  const [selectedHostId, setSelectedHostId] = useState('usr-sales-vikram');
  const [purpose, setPurpose] = useState('Commercial Property Investment Discussion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validatePersonName(fullName);
    if (!nameValidation.isValid) {
      setError(nameValidation.error || 'Please enter a valid visitor name.');
      return;
    }

    const phoneValidation = validateIndianMobile(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const hostObj = STAFF_HOST_OPTIONS.find((h) => h.id === selectedHostId) || STAFF_HOST_OPTIONS[0];

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/walkin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          company: company.trim(),
          visitorType,
          hostName: hostObj.name,
          hostDepartment: hostObj.department,
          purpose: purpose.trim() || 'Visitor Consultation',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register visitor');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#1a0f0a]/95 border border-[rgba(225,165,95,0.28)] rounded-3xl max-w-lg w-full shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-5 sm:p-6 border-b border-[rgba(200,140,80,0.18)] flex items-center justify-between bg-[#140b07]/90">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Front Desk Quick Intake
            </span>
            <h2 className="text-lg font-bold text-[#fdf6ed] mt-0.5">Register Walk-in Visitor / Client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#a88d77] hover:text-white hover:bg-[#25150d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">
                Visitor Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">
                Mobile Number <span className="text-amber-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apex Investments"
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">Visitor Category</label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
              >
                <option value="CLIENT">Client / High-Net-Worth Investor</option>
                <option value="VENDOR">Vendor / Partner</option>
                <option value="WALK_IN">General Walk-in Candidate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">
                Meeting Host (WCR Staff) <span className="text-amber-400">*</span>
              </label>
              <select
                value={selectedHostId}
                onChange={(e) => setSelectedHostId(e.target.value)}
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
              >
                {STAFF_HOST_OPTIONS.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name} ({host.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#e8c89b] mb-1">Purpose of Visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Contract Signing"
                className="w-full px-3 py-2 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(200,140,80,0.18)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#20120b] hover:bg-[#2c180e] text-[#a88d77] hover:text-[#fdf6ed] rounded-xl font-semibold border border-[rgba(200,140,80,0.2)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#c98944] to-amber-600 hover:from-[#db974e] hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Check In Visitor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
