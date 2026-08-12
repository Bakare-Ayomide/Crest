import React from 'react';
import { Bell, Heart, Star, ShieldCheck, MessageCircle, X, CheckCheck } from 'lucide-react';
import { NotificationItem } from '../types';
import { triggerHaptic } from '../lib/capacitor';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClose: () => void;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onMarkAllRead,
  onClose,
  onSelectNotification
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900 dark:text-white">
            <Bell className="w-5 h-5 text-rose-500" />
            <span>Activity Notifications</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { triggerHaptic('light'); onMarkAllRead(); }}
              className="text-[11px] font-bold text-rose-500 hover:underline"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => { triggerHaptic('light'); onSelectNotification(item); }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                !item.read
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 opacity-80'
              }`}
            >
              {item.userAvatar ? (
                <div className="relative flex-shrink-0">
                  <img src={item.userAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  {item.type === 'superlike' && (
                    <span className="absolute -bottom-1 -right-1 p-1 bg-sky-500 text-white rounded-full">
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                  {item.type === 'match' && (
                    <span className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full">
                      <Heart className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-500 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">{item.title}</h4>
                  <span className="text-[10px] text-gray-400">{item.timestamp}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
