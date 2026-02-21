/**
 * Chat Notification Service
 * Desktop notifications + notification sounds
 */

const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2ozHTB3r+P4vW8lCB6Ftu37sm0gBDKl4P3YgnEaChWQ2/bplo9+eCMFJK3o//HIeGMVBBeO0/Xjl41+cB4DHK3p//TKe2UXBRaO0/TiloxucRwDG63o//fNgWoYCBSN0fLekol1aRgCHK/r//fOfWgXCRGOz/DYjo19Yx0DHbDs//fNgGcWCBGOz/DZkIx6ZBwCHK/r//bOg2sYDQ==';

let audioContext: AudioContext | null = null;
let notificationAudio: HTMLAudioElement | null = null;

function getAudio() {
  if (!notificationAudio) {
    notificationAudio = new Audio('/notification.mp3');
    notificationAudio.volume = 0.4;
  }
  return notificationAudio;
}

export function playNotificationSound() {
  try {
    // Try mp3 first
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Fallback: Web Audio API beep
      try {
        if (!audioContext) audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch {}
    });
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function showDesktopNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-message',
    renotify: true,
    silent: true, // we handle sound ourselves
  });
  setTimeout(() => n.close(), 5000);
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

export function notifyNewMessage(senderName: string, content: string, conversationTitle?: string) {
  playNotificationSound();
  const title = conversationTitle ? `${senderName} ב-${conversationTitle}` : senderName;
  const body = content.length > 80 ? content.slice(0, 80) + '...' : content;
  showDesktopNotification(title, body);
}

let soundEnabled = true;
let notificationsEnabled = true;

export function getSoundEnabled() { return soundEnabled; }
export function getNotificationsEnabled() { return notificationsEnabled; }
export function toggleSound() { soundEnabled = !soundEnabled; return soundEnabled; }
export function toggleNotifications() { notificationsEnabled = !notificationsEnabled; return notificationsEnabled; }
