import React, { useState } from 'react';
import { Sparkles, Check, Flame, Heart, Star, Zap, Globe, Shield, X, CreditCard } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface SubscriptionModalProps {
  currentTier: 'free' | 'plus' | 'gold' | 'platinum';
  onUpgradeTier: (tier: 'plus' | 'gold' | 'platinum') => void;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  currentTier,
  onUpgradeTier,
  onClose
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'gold' | 'platinum' | 'plus'>('gold');

  const PLANS = [
    {
      id: 'plus',
      name: 'CREST Plus',
      price: '$12.99',
      period: '/ month',
      color: 'from-pink-500 to-rose-500',
      badge: 'POPULAR',
      features: [
        'Unlimited Likes',
        'Unlimited Rewinds',
        'Passport Mode (Swipe anywhere)',
        'Hide Ads'
      ]
    },
    {
      id: 'gold',
      name: 'CREST Gold',
      price: '$22.99',
      period: '/ month',
      color: 'from-amber-400 via-amber-500 to-amber-600',
      badge: 'BEST VALUE',
      features: [
        'Everything in Plus',
        'See Who Liked You (Unblur profiles)',
        '5 Free Super Likes per week',
        '1 Free Boost per month',
        'Top Picks curated daily'
      ]
    },
    {
      id: 'platinum',
      name: 'CREST Platinum',
      price: '$32.99',
      period: '/ month',
      color: 'from-gray-900 via-purple-950 to-rose-950 dark:from-gray-100 dark:to-gray-300 dark:text-gray-900',
      badge: 'VIP ACCESS',
      features: [
        'Everything in Gold',
        'Priority Likes (Seen first by matches)',
        'Message before matching with Superlike',
        'Unlimited AI Wingman Openers'
      ]
    }
  ];

  const handleCheckout = () => {
    triggerHaptic('success');
    onUpgradeTier(selectedPlan);
    showNativeToast(`Upgraded to ${selectedPlan.toUpperCase()}! Gold Features Unlocked 🎉`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-gray-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Unlock CREST Premium
              </h3>
              <p className="text-[11px] text-gray-400">Get 10x more matches and instant reveals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Cards Selector */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => { triggerHaptic('light'); setSelectedPlan(plan.id as any); }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-md scale-102'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 opacity-90'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                      {plan.badge}
                    </span>
                    <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                      {plan.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-lg text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-[10px] text-gray-400 block">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-500 font-bold flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Checkout CTA */}
        <button
          onClick={handleCheckout}
          className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-gray-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-102 transition-transform"
        >
          <CreditCard className="w-5 h-5" />
          <span>Subscribe to CREST {selectedPlan.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};
