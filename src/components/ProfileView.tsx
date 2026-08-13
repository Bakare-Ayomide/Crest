import React from 'react';
import { UserProfile, UserSettings } from '../types';
import { CanonicalProfileView } from './CanonicalProfileView';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  userSettings: UserSettings;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onStartVerification: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  userSettings,
  onOpenSettings,
  onOpenSubscription,
  onStartVerification
}) => {
  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-2 pb-24">
      <CanonicalProfileView
        user={user}
        isOwnProfile={true}
        isDrawer={false}
        userSettings={userSettings}
        onUpdateUser={onUpdateUser}
        onOpenSettings={onOpenSettings}
        onOpenSubscription={onOpenSubscription}
        onStartVerification={onStartVerification}
      />
    </div>
  );
};
