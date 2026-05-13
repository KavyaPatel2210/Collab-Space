import * as React from "react";
import API from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { getSocket } from "../lib/socket";
import { toast } from "sonner";

// Helper to convert base64 to Uint8Array for PushManager
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export interface Notification {
  _id: string;
  type: 'message' | 'share' | 'edit';
  title: string;
  message: string;
  documentId?: string;
  fromUser?: { _id: string; name: string; };
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchNotifications();
    
    // NUCLEAR OPTION: 5-second polling fallback
    const interval = setInterval(fetchNotifications, 5000);

    if (user) {
      const socket = getSocket();
      
      const identify = () => {
        socket.emit('identify-user', user.id);
      };

      if (socket.connected) identify();
      socket.on('connect', identify);

      // Setup Web Push
      const setupWebPush = async () => {
        try {
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const { data } = await API.get('/api/notifications/vapid-key');
            const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          }
          await API.post('/api/notifications/subscribe', subscription);
        } catch (err) {
          console.error('Failed to setup web push:', err);
        }
      };

      // Request notification permission ONLY if installed as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') setupWebPush();
          });
        } else if (Notification.permission === "granted") {
          setupWebPush();
        }
      }

      const handleNewNotification = (notif: Notification) => {
        // Ignore notifications from ourselves
        if (notif.fromUser?._id === user.id) return;

        setNotifications(prev => {
          if (prev.find(n => n._id === notif._id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount(prev => prev + 1);
        
        // Native System Notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            // Check if service worker is ready to use its notification (works better on Android)
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(notif.title, {
                body: notif.message,
                icon: '/icon-192.png',
                data: {
                  url: notif.documentId ? `/editor/${notif.documentId}?tab=chat` : '/'
                }
              });
            }).catch(() => {
              // Fallback to basic Notification API
              const n = new window.Notification(notif.title, {
                body: notif.message,
                icon: '/icon-192.png',
              });
              if (notif.documentId) {
                n.onclick = () => {
                  window.focus();
                  window.location.href = `/editor/${notif.documentId}?tab=chat`;
                };
              }
            });
          } catch (e) {
            console.error("Native notification failed:", e);
          }
        }

        toast.info(notif.title, {
          description: notif.message,
          action: notif.documentId ? {
            label: "Open",
            onClick: () => window.location.href = `/editor/${notif.documentId}?tab=chat`
          } : undefined
        });
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        clearInterval(interval);
        socket.off('connect', identify);
        socket.off('new-notification', handleNewNotification);
      };
    }
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await API.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
