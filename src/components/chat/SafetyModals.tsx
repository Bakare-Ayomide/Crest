import React, { useState } from 'react';
import { ShieldAlert, Ban, UserX, AlertTriangle, X, Check } from 'lucide-react';
import { UserProfile, Message } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface BlockConfirmModalProps {
  user: UserProfile;
  onConfirmBlock: () => void;
  onClose: () => void;
}

export const BlockConfirmModal: React.FC<BlockConfirmModalProps> = ({ user, onConfirmBlock, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white animate-in fade-in duration-150">
      <div className="bg-[#18191c] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <Ban className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-lg">Block {user.name}?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {user.name} will no longer be able to message or call you, view your profile, or match with you. This conversation will be closed immediately.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onConfirmBlock();
            }}
            className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-xs shadow-lg transition-colors"
          >
            Block {user.name}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface UnmatchConfirmModalProps {
  user: UserProfile;
  onConfirmUnmatch: () => void;
  onClose: () => void;
}

export const UnmatchConfirmModal: React.FC<UnmatchConfirmModalProps> = ({ user, onConfirmUnmatch, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white animate-in fade-in duration-150">
      <div className="bg-[#18191c] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <UserX className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-lg">Unmatch with {user.name}?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            You will be removed from each other's match list, and this chat history will disappear permanently.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onConfirmUnmatch();
            }}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs shadow-lg transition-colors"
          >
            Yes, Unmatch
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReportModalProps {
  user: UserProfile;
  message?: Message | null;
  onSubmitReport: (reason: string, details: string) => void;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Inappropriate media or explicit content',
  'Harassment, bullying, or hate speech',
  'Commercial spam, scam, or external links',
  'Fake profile or stolen photos',
  'Underage or safety concern',
  'Other violation of Community Guidelines'
];

export const ReportModal: React.FC<ReportModalProps> = ({ user, message, onSubmitReport, onClose }) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    triggerHaptic('heavy');
    onSubmitReport(selectedReason, details);
    showNativeToast('Report submitted to CREST Safety Team. Thank you.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white animate-in fade-in duration-150">
      <div className="bg-[#18191c] border border-white/10 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="font-extrabold text-base">Report {message ? 'Message' : user.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300 italic">
            "{message.text || 'Attached Media Message'}"
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Select a Reason
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {REPORT_REASONS.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedReason(r)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-medium transition-colors flex items-center justify-between ${
                  selectedReason === r
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span>{r}</span>
                {selectedReason === r && <Check className="w-4 h-4 text-rose-400 flex-shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            Additional Details (Optional)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Help our moderation team understand what happened..."
            className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-20 placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};
