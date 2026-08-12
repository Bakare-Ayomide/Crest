import React, { useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2, Sparkles, X, RefreshCw } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface VerificationWizardProps {
  onClose: () => void;
  onVerifiedSuccess: () => void;
}

export const VerificationWizard: React.FC<VerificationWizardProps> = ({
  onClose,
  onVerifiedSuccess
}) => {
  const [step, setStep] = useState<'intro' | 'pose' | 'scan' | 'complete'>('intro');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleSnapPhoto = () => {
    triggerHaptic('heavy');
    // Simulated selfie capture
    const sampleSelfies = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
    ];
    setCapturedPhoto(sampleSelfies[0]);
    setStep('scan');

    // Simulate AI Scan processing
    setTimeout(() => {
      triggerHaptic('success');
      setStep('complete');
      onVerifiedSuccess();
      showNativeToast('Profile Verified! Blue Badge Unlocked 💙');
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-center space-y-5">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: INTRO */}
        {step === 'intro' && (
          <div className="space-y-4 py-2">
            <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-500 mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Get Your Verified Badge
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
              Show potential matches that you're real. Verified profiles receive up to 3x more likes and matches on CREST!
            </p>

            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-left text-xs space-y-2 border border-sky-200 dark:border-sky-800">
              <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>How Pose Verification Works:</span>
              </div>
              <p className="text-sky-800 dark:text-sky-300">
                1. Copy the requested pose on camera.<br />
                2. Our AI verifies your face matches your profile photos.<br />
                3. Your blue checkmark badge activates instantly.
              </p>
            </div>

            <button
              onClick={() => { triggerHaptic('medium'); setStep('pose'); }}
              className="w-full py-3.5 bg-sky-500 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-sky-500/25 hover:scale-102 transition-transform"
            >
              Continue to Camera
            </button>
          </div>
        )}

        {/* STEP 2: POSE CAMERA */}
        {step === 'pose' && (
          <div className="space-y-4 py-2">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-700 dark:text-sky-300">
              Requested Pose: "Peace Sign ✌️ Near Your Eye"
            </div>

            {/* Camera Frame Simulation */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-900 border-4 border-dashed border-sky-400 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                alt="Camera Stream"
                className="w-full h-full object-cover filter contrast-105"
              />

              {/* Face Guide Oval */}
              <div className="absolute inset-8 border-2 border-white/60 rounded-full border-dashed pointer-events-none animate-pulse" />

              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md py-1.5 px-3 rounded-full text-[11px] text-white font-medium">
                Align your face inside the oval and strike the pose
              </div>
            </div>

            <button
              onClick={handleSnapPhoto}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Snap Verification Photo</span>
            </button>
          </div>
        )}

        {/* STEP 3: SCANNING AI */}
        {step === 'scan' && (
          <div className="space-y-6 py-6">
            <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-sky-500 shadow-xl">
              <img src={capturedPhoto!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-sky-500/20 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 font-extrabold text-base text-gray-900 dark:text-white">
                <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />
                <span>AI Face & Pose Recognition in Progress...</span>
              </div>
              <p className="text-xs text-gray-400">Comparing facial geometry with profile gallery...</p>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETE */}
        {step === 'complete' && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Verification Approved!
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Your photo pose matched perfectly. Your profile now features the Blue Checkmark Badge!
            </p>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-500 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-emerald-500/25"
            >
              Back to CREST
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
