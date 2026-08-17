// Capacitor Native helper module providing haptics, toast, camera, and device emulation

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (type === 'light') window.navigator.vibrate(12);
      else if (type === 'medium') window.navigator.vibrate(25);
      else if (type === 'heavy') window.navigator.vibrate([40, 30, 40]);
      else if (type === 'success') window.navigator.vibrate([20, 50, 30]);
      else if (type === 'warning') window.navigator.vibrate([50, 100, 50]);
    } catch (e) {
      // Ignore vibration error on unsupported platforms
    }
  }
};

export const showNativeToast = (_message: string) => {
  // Onscreen native event toast removed as requested
};

export const nativeShare = async (title: string, text: string, url: string) => {
  triggerHaptic('medium');
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      // user cancelled
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      showNativeToast('Link copied to clipboard!');
      return true;
    } catch (e) {
      showNativeToast('Unable to share link');
    }
  }
  return false;
};
