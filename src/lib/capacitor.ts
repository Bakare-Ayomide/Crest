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

export const showNativeToast = (message: string) => {
  const toastEl = document.createElement('div');
  toastEl.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#1b1d22]/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md z-50 pointer-events-none flex items-center gap-2 border border-white/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2';
  toastEl.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translate(-50%, 8px)';
    setTimeout(() => toastEl.remove(), 300);
  }, 2200);
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
