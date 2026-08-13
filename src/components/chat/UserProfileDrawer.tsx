import React from 'react';
import { UserProfile } from '../../types';
import { CanonicalProfileView } from '../CanonicalProfileView';

export interface UserProfileDrawerProps {
  user: UserProfile;
  onClose: () => void;
  onOpenDateIdeas: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  user,
  onClose,
  onOpenDateIdeas,
  onUnmatch,
  onBlock,
  onReport
}) => {
  return (
    <CanonicalProfileView
      user={user}
      isDrawer={true}
      isMatched={true}
      isOwnProfile={false}
      onClose={onClose}
      onOpenDateIdeas={() => onOpenDateIdeas()}
      onUnmatch={() => onUnmatch()}
      onBlock={() => onBlock()}
      onReport={() => onReport()}
    />
  );
};
