import React, { useState } from 'react';
import { ReportTicket, VerificationRequest } from '../types';
import { ShieldAlert, ShieldCheck, BarChart3, Sliders, UserX, Check, X, TrendingUp, Users, Heart, DollarSign } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface AdminDashboardProps {
  reports: ReportTicket[];
  onResolveReport: (reportId: string, action: 'ban' | 'dismiss') => void;
  verificationRequests: VerificationRequest[];
  onReviewVerification: (requestId: string, status: 'approved' | 'rejected') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onResolveReport,
  verificationRequests,
  onReviewVerification
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'moderation' | 'verifications' | 'analytics' | 'toggles'>('moderation');

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24 space-y-4">
      
      {/* Admin Title Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500 text-gray-950 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 fill-gray-950 text-amber-500" />
          <span className="font-black text-sm">CREST Admin Control Panel</span>
        </div>
        <span className="text-[10px] font-bold bg-black/10 px-2 py-0.5 rounded-md uppercase">
          Live Frontend
        </span>
      </div>

      {/* Admin Tabs Switcher */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[11px] font-bold">
        <button
          onClick={() => { triggerHaptic('light'); setActiveAdminTab('moderation'); }}
          className={`py-2 rounded-xl transition-all ${
            activeAdminTab === 'moderation'
              ? 'bg-white dark:bg-gray-900 text-rose-500 shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Reports ({reports.filter(r => r.status === 'open').length})
        </button>

        <button
          onClick={() => { triggerHaptic('light'); setActiveAdminTab('verifications'); }}
          className={`py-2 rounded-xl transition-all ${
            activeAdminTab === 'verifications'
              ? 'bg-white dark:bg-gray-900 text-sky-500 shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Verify ({verificationRequests.filter(v => v.status === 'pending').length})
        </button>

        <button
          onClick={() => { triggerHaptic('light'); setActiveAdminTab('analytics'); }}
          className={`py-2 rounded-xl transition-all ${
            activeAdminTab === 'analytics'
              ? 'bg-white dark:bg-gray-900 text-amber-500 shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Analytics
        </button>

        <button
          onClick={() => { triggerHaptic('light'); setActiveAdminTab('toggles'); }}
          className={`py-2 rounded-xl transition-all ${
            activeAdminTab === 'toggles'
              ? 'bg-white dark:bg-gray-900 text-purple-500 shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Toggles
        </button>
      </div>

      {/* MODERATION QUEUE TAB */}
      {activeAdminTab === 'moderation' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
            User Moderation Tickets
          </h4>

          {reports.filter(r => r.status === 'open').length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white dark:bg-gray-800 rounded-3xl">
              No open report tickets! Community is safe.
            </div>
          ) : (
            reports.filter(r => r.status === 'open').map((ticket) => (
              <div key={ticket.id} className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={ticket.reportedUserPhoto} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">{ticket.reportedUserName}</h5>
                    <p className="text-[11px] text-rose-500 font-semibold">{ticket.reason}</p>
                    <p className="text-[10px] text-gray-400">Reported by {ticket.reporterName} • {ticket.timestamp}</p>
                  </div>
                </div>

                {ticket.details && (
                  <p className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300">
                    "{ticket.details}"
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { triggerHaptic('light'); onResolveReport(ticket.id, 'dismiss'); }}
                    className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => { triggerHaptic('heavy'); onResolveReport(ticket.id, 'ban'); }}
                    className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Ban Account</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VERIFICATIONS QUEUE TAB */}
      {activeAdminTab === 'verifications' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
            Pose Verification Queue
          </h4>

          {verificationRequests.filter(v => v.status === 'pending').length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white dark:bg-gray-800 rounded-3xl">
              All selfie verification requests processed!
            </div>
          ) : (
            verificationRequests.filter(v => v.status === 'pending').map((req) => (
              <div key={req.id} className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{req.userName}</span>
                  <span className="text-[10px] text-gray-400">{req.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Profile Photo</span>
                    <img src={req.userPhoto} alt="" className="w-full aspect-square rounded-2xl object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Captured Pose ({req.requiredGesture})</span>
                    <img src={req.capturedSelfieUrl} alt="" className="w-full aspect-square rounded-2xl object-cover border-2 border-sky-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { triggerHaptic('light'); onReviewVerification(req.id, 'rejected'); }}
                    className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { triggerHaptic('success'); onReviewVerification(req.id, 'approved'); }}
                    className="flex-1 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Badge</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
              <Users className="w-5 h-5 text-rose-500 mb-1" />
              <p className="text-[10px] text-gray-400 font-bold uppercase">Daily Active Users</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">4,820</p>
              <span className="text-[10px] text-emerald-500 font-bold">↑ +14% vs yesterday</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
              <Heart className="w-5 h-5 text-pink-500 mb-1" />
              <p className="text-[10px] text-gray-400 font-bold uppercase">Matches Today</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">1,290</p>
              <span className="text-[10px] text-emerald-500 font-bold">↑ +8% conversion</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
              <DollarSign className="w-5 h-5 text-amber-500 mb-1" />
              <p className="text-[10px] text-gray-400 font-bold uppercase">Monthly Revenue</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">$38,420</p>
              <span className="text-[10px] text-amber-500 font-bold">Gold Subscriptions</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
              <ShieldCheck className="w-5 h-5 text-sky-500 mb-1" />
              <p className="text-[10px] text-gray-400 font-bold uppercase">Verified Users</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">68.4%</p>
              <span className="text-[10px] text-sky-500 font-bold">High trust score</span>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM TOGGLES TAB */}
      {activeAdminTab === 'toggles' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4 text-xs font-bold">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            System Feature Flags
          </h4>

          <div className="flex items-center justify-between">
            <span>Enable AI Wingman Icebreakers</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
          </div>

          <div className="flex items-center justify-between">
            <span>Require Pose Selfie Verification for Gold</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
          </div>

          <div className="flex items-center justify-between">
            <span>Automated Spam Phishing Detector</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
          </div>
        </div>
      )}
    </div>
  );
};
